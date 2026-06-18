import logging

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import (
    before_sleep_log,
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings
from app.db.models import CampaignAlert
from app.exceptions import GitHubAPIError
from app.services.poll_campaigns_job.types import SyncedCampaign

logger = logging.getLogger(__name__)

SPEND_ALERT_THRESHOLD_PCT = 90.0
GITHUB_RETRYABLE_STATUS_CODES = {429, 502, 503, 504}


def _is_retryable_github_error(exc: BaseException) -> bool:
    if not isinstance(exc, GitHubAPIError):
        return False
    if exc.status_code is None:
        return True
    return exc.status_code in GITHUB_RETRYABLE_STATUS_CODES


@retry(
    retry=retry_if_exception(_is_retryable_github_error),
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=30),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
async def _create_github_issue(title: str, body: str) -> str:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.github.com/repos/{settings.GITHUB_REPO}/issues",
                headers={
                    "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2026-03-10",
                },
                json={"title": title, "body": body},
                timeout=10.0,
            )
            response.raise_for_status()
            issue_url = response.json().get("html_url")
            if not issue_url:
                raise GitHubAPIError("GitHub issue response missing html_url")
            return issue_url
    except httpx.HTTPStatusError as exc:
        raise GitHubAPIError(
            f"GitHub API error: {exc.response.text}",
            status_code=exc.response.status_code,
        ) from exc
    except httpx.RequestError as exc:
        raise GitHubAPIError(f"GitHub API unavailable: {exc}") from exc


async def create_alerts(session: AsyncSession, campaigns: list[SyncedCampaign]) -> int:
    """Open GitHub issues for over-budget campaigns that have not been alerted yet."""
    alerts_created = 0

    for synced in campaigns:
        campaign = synced.campaign
        snapshot = synced.snapshot

        if snapshot.spend_pct <= SPEND_ALERT_THRESHOLD_PCT:
            continue

        existing = await session.execute(
            select(CampaignAlert.id)
            .where(CampaignAlert.campaign_id == campaign.id)
            .limit(1)
        )
        if existing.scalar_one_or_none() is not None:
            continue

        body = (
            f"Campaign **{campaign.name}** ({campaign.id}) has exceeded 90% of its budget.\n\n"
            f"- Advertiser: {campaign.advertiser}\n"
            f"- Status: {campaign.status}\n"
            f"- Budget: ${snapshot.budget:,.2f}\n"
            f"- Spend: ${snapshot.spend:,.2f}\n"
            f"- Spend %: {snapshot.spend_pct}%\n"
            f"- Impressions: {snapshot.impressions:,}\n"
            f"- Clicks: {snapshot.clicks:,}\n"
            f"- CTR: {snapshot.ctr:.4f}\n"
            f"- CPM: ${snapshot.cpm:.2f}\n"
        )
        title = f" {campaign.name} compaign over 90% budget"

        try:
            issue_url = await _create_github_issue(title, body)
        except GitHubAPIError as exc:
            logger.exception(
                "Failed to create GitHub issue for campaign %s, will retry next poll: %s",
                campaign.id,
                exc,
            )
        else:
            session.add(
                CampaignAlert(
                    campaign_id=campaign.id,
                    github_issue_url=issue_url,
                    title=title,
                    body=body,
                )
            )
            alerts_created += 1
            logger.info("Created GitHub issue for campaign %s: %s", campaign.id, issue_url)

    await session.flush()
    return alerts_created
