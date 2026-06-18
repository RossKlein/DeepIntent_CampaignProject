from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Campaign, CampaignAlert


class AlertRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_github_issues(
        self,
        page: int = 1,
        page_size: int = 10,
        campaign_id: str | None = None,
    ) -> tuple[list[tuple[CampaignAlert, Campaign]], int]:
        query = (
            select(CampaignAlert, Campaign)
            .join(Campaign, Campaign.id == CampaignAlert.campaign_id)
            .order_by(CampaignAlert.created_at.desc())
        )
        count_query = select(func.count()).select_from(CampaignAlert)

        if campaign_id is not None:
            query = query.where(CampaignAlert.campaign_id == campaign_id)
            count_query = count_query.where(CampaignAlert.campaign_id == campaign_id)

        total = await self.session.scalar(count_query) or 0
        offset = (page - 1) * page_size
        result = await self.session.execute(query.offset(offset).limit(page_size))
        return list(result.tuples().all()), total
