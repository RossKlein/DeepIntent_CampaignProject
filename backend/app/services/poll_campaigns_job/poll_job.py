import logging
from datetime import date, datetime, timezone

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings
from app.db.models import Campaign, CampaignData
from app.db.session import AsyncSessionLocal
from app.exceptions import CampaignAPIError
from app.services.poll_campaigns_job.alert import create_alerts
from app.services.poll_campaigns_job.types import SyncedCampaign, ValidatedCampaign
from app.services.upstream_retry import (
    UPSTREAM_HTTP_TIMEOUT,
    UPSTREAM_PAGE_MAX_ATTEMPTS,
    is_retryable_upstream_error,
)

logger = logging.getLogger(__name__)

UPSTREAM_PAGE_SIZE = 10


@retry(
    retry=retry_if_exception(is_retryable_upstream_error),
    stop=stop_after_attempt(UPSTREAM_PAGE_MAX_ATTEMPTS),
    wait=wait_exponential(multiplier=0.5, min=0.25, max=1),
    before_sleep=before_sleep_log(logger, logging.DEBUG),
    reraise=True,
)
async def _fetch_campaign_page(client: httpx.AsyncClient, page: int) -> dict:
    response = await client.get(
        f"{settings.API_URL}/campaigns",
        headers={"X-API-Key": settings.CAMPAIGN_API_KEY},
        params={"page": page, "page_size": UPSTREAM_PAGE_SIZE},
        timeout=UPSTREAM_HTTP_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


class PollCampaignsJob:
    async def run(self) -> None:
        """Fetch upstream campaigns, validate, upsert to Postgres, and alert on GitHub."""
        try:
            raw_campaigns = await self.fetch()
        except CampaignAPIError:
            logger.exception("Failed to fetch campaigns from upstream API")
            return

        synced: list[SyncedCampaign] = []
        skipped = 0

        async with AsyncSessionLocal() as session:
            for raw in raw_campaigns:
                validated = self.validate(raw)
                if validated is None:
                    skipped += 1
                    continue

                synced_campaign = await self.upsert(session, validated)
                synced.append(synced_campaign)

            alerts_created = await create_alerts(session, synced)
            await session.commit()

        logger.info(
            "Poll job complete: synced=%s skipped=%s alerts_created=%s",
            len(synced),
            skipped,
            alerts_created,
        )

    async def fetch(self) -> list[dict]:
        """Pull every campaign page from the upstream API."""
        page = 1
        all_campaigns: list[dict] = []

        try:
            async with httpx.AsyncClient() as client:
                while True:
                    try:
                        data = await _fetch_campaign_page(client, page)
                    except httpx.HTTPStatusError as exc:
                        if all_campaigns:
                            logger.warning(
                                "Upstream failed on page %s (%s); syncing %s campaigns collected so far",
                                page,
                                exc.response.status_code,
                                len(all_campaigns),
                            )
                            break
                        raise CampaignAPIError(
                            f"Campaign API error: {exc.response.text}",
                            status_code=exc.response.status_code,
                        ) from exc
                    except httpx.RequestError as exc:
                        if all_campaigns:
                            logger.warning(
                                "Upstream unavailable on page %s; syncing %s campaigns collected so far",
                                page,
                                len(all_campaigns),
                            )
                            break
                        raise CampaignAPIError(
                            f"Campaign API unavailable: {exc}"
                        ) from exc

                    batch = data.get("campaigns", data.get("items", []))
                    total = data.get("total", len(batch))

                    if not batch:
                        break

                    all_campaigns.extend(batch)

                    if len(all_campaigns) >= total:
                        break
                    page += 1
        except CampaignAPIError:
            raise

        logger.info("Fetched %s campaigns from upstream API", len(all_campaigns))
        return all_campaigns

    def validate(self, raw: dict) -> ValidatedCampaign | None:
        """Validate upstream JSON and return parsed campaign data, or None if invalid."""
        try:
            budget = float(raw["budget"])
            spend = float(raw["spend"])
            impressions = int(raw["impressions"])
            clicks = int(raw["clicks"])
            if budget and budget != 0.0:
                spend_pct = round((spend / budget) * 100, 2)
            else:
                spend_pct = 0.0

            if impressions and impressions != 0:
                ctr = round(clicks / impressions, 2)
            else:
                ctr = 0.0

            start_date = raw["start_date"]
            end_date = raw["end_date"]
            if isinstance(start_date, str):
                start_date = date.fromisoformat(start_date)
            if isinstance(end_date, str):
                end_date = date.fromisoformat(end_date)

            return ValidatedCampaign(
                id=str(raw["id"]),
                name=str(raw["name"]),
                advertiser=str(raw["advertiser"]),
                status=str(raw["status"]),
                start_date=start_date,
                end_date=end_date,
                budget=budget,
                spend=spend,
                impressions=impressions,
                clicks=clicks,
                cpm=float(raw["cpm"]),
                spend_pct=spend_pct,
                ctr=ctr,
            )
        except (KeyError, TypeError, ValueError) as exc:
            logger.warning("Skipping invalid campaign record: %s — %s", raw, exc)
            return None

    async def upsert(
        self, session: AsyncSession, validated: ValidatedCampaign
    ) -> SyncedCampaign:
        """Upsert campaign identity and append a metrics snapshot."""
        existing = await session.get(Campaign, validated.id)

        if existing is None:
            campaign = Campaign(
                id=validated.id,
                name=validated.name,
                advertiser=validated.advertiser,
                status=validated.status,
                start_date=validated.start_date,
                end_date=validated.end_date,
            )
            session.add(campaign)
        else:
            existing.name = validated.name
            existing.advertiser = validated.advertiser
            existing.status = validated.status
            existing.start_date = validated.start_date
            existing.end_date = validated.end_date
            existing.updated_at = datetime.now(timezone.utc)
            campaign = existing

        snapshot = CampaignData(
            campaign_id=validated.id,
            budget=validated.budget,
            spend=validated.spend,
            impressions=validated.impressions,
            clicks=validated.clicks,
            cpm=validated.cpm,
            spend_pct=validated.spend_pct,
            ctr=validated.ctr,
        )
        session.add(snapshot)
        await session.flush()
        await self._trim_campaign_data(session, validated.id)
        await session.flush()
        return SyncedCampaign(campaign=campaign, snapshot=snapshot)

    async def _trim_campaign_data(
        self, session: AsyncSession, campaign_id: str
    ) -> None:
        """Keep only the newest N snapshots per campaign (LRU-style cap)."""
        max_rows = settings.CAMPAIGN_DATA_MAX_ROWS
        if max_rows <= 0:
            return

        stale_ids = (
            select(CampaignData.id)
            .where(CampaignData.campaign_id == campaign_id)
            .order_by(CampaignData.created_at.desc())
            .offset(max_rows)
        )
        await session.execute(
            delete(CampaignData).where(CampaignData.id.in_(stale_ids))
        )


async def run_poll_job() -> None:
    await PollCampaignsJob().run()
