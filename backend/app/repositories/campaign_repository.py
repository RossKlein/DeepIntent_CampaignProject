from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Campaign, CampaignAlert, CampaignData


class CampaignRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _latest_snapshot_ranked(self):
        """Rank snapshots per campaign; break ties on created_at with id."""
        return (
            select(
                CampaignData.id.label("snapshot_id"),
                CampaignData.campaign_id,
                func.row_number()
                .over(
                    partition_by=CampaignData.campaign_id,
                    order_by=(CampaignData.created_at.desc(), CampaignData.id.desc()),
                )
                .label("row_num"),
            )
        ).subquery()

    async def list_campaigns(
        self,
        page: int = 1,
        page_size: int = 10,
        status: str | None = None,
    ) -> tuple[list[tuple[Campaign, CampaignData | None]], int]:
        ranked = self._latest_snapshot_ranked()

        query = (
            select(Campaign, CampaignData)
            .outerjoin(
                ranked,
                (Campaign.id == ranked.c.campaign_id) & (ranked.c.row_num == 1),
            )
            .outerjoin(CampaignData, CampaignData.id == ranked.c.snapshot_id)
        )
        count_query = select(func.count()).select_from(Campaign)

        if status is not None:
            query = query.where(Campaign.status == status)
            count_query = count_query.where(Campaign.status == status)

        total = await self.session.scalar(count_query) or 0
        offset = (page - 1) * page_size
        result = await self.session.execute(
            query.order_by(Campaign.name).offset(offset).limit(page_size)
        )
        return list(result.tuples().all()), total

    async def get_campaign(
        self, campaign_id: str
    ) -> tuple[Campaign, CampaignData | None] | None:
        campaign = await self.session.get(Campaign, campaign_id)
        if campaign is None:
            return None

        snapshot = await self.session.scalar(
            select(CampaignData)
            .where(CampaignData.campaign_id == campaign_id)
            .order_by(CampaignData.created_at.desc(), CampaignData.id.desc())
            .limit(1)
        )
        return campaign, snapshot

    async def campaign_exists(self, campaign_id: str) -> bool:
        result = await self.session.execute(
            select(Campaign.id).where(Campaign.id == campaign_id).limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def list_campaign_data(
        self,
        campaign_id: str,
        page: int = 1,
        page_size: int = 100,
    ) -> tuple[list[CampaignData], int]:
        count_query = (
            select(func.count())
            .select_from(CampaignData)
            .where(CampaignData.campaign_id == campaign_id)
        )
        total = await self.session.scalar(count_query) or 0
        offset = (page - 1) * page_size

        result = await self.session.execute(
            select(CampaignData)
            .where(CampaignData.campaign_id == campaign_id)
            .order_by(CampaignData.created_at.asc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    async def has_alert_for_campaign(self, campaign_id: str) -> bool:
        result = await self.session.execute(
            select(CampaignAlert.id)
            .where(CampaignAlert.campaign_id == campaign_id)
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def create_alert(
        self,
        campaign_id: str,
        github_issue_url: str,
        title: str,
        body: str,
    ) -> CampaignAlert:
        alert = CampaignAlert(
            campaign_id=campaign_id,
            github_issue_url=github_issue_url,
            title=title,
            body=body,
        )
        self.session.add(alert)
        await self.session.flush()
        return alert
