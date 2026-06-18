from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.repositories.campaign_repository import CampaignRepository
from app.schemas.campaign import CampaignOut
from app.services.campaign_service import campaign_data_to_out, campaign_model_to_out

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("")
async def list_campaigns(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: str | None = None,
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    repo = CampaignRepository(session)
    campaigns, total = await repo.list_campaigns(
        page=page,
        page_size=page_size,
        status=status,
    )

    return {
        "campaigns": [
            campaign_model_to_out(campaign, snapshot)
            for campaign, snapshot in campaigns
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{campaign_id}/data")
async def list_campaign_data(
    campaign_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    repo = CampaignRepository(session)

    if not await repo.campaign_exists(campaign_id):
        raise HTTPException(status_code=404, detail="Campaign not found")

    data_points, total = await repo.list_campaign_data(
        campaign_id=campaign_id,
        page=page,
        page_size=page_size,
    )

    return {
        "campaign_id": campaign_id,
        "data": [campaign_data_to_out(point) for point in data_points],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> CampaignOut:
    repo = CampaignRepository(session)
    result = await repo.get_campaign(campaign_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign, snapshot = result
    return campaign_model_to_out(campaign, snapshot)
