from fastapi import APIRouter, Depends, Query

from app.core.config import settings
from app.schemas.campaign import CampaignOut
from app.services.campaign_client import CampaignClient
from app.services.campaign_service import transform_campaign

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def get_campaign_client() -> CampaignClient:
    return CampaignClient(settings.API_URL, settings.CAMPAIGN_API_KEY)


@router.get("")
async def list_campaigns(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=10),
    status: str | None = None,
    client: CampaignClient = Depends(get_campaign_client),
) -> dict:
    data = await client.list_campaigns(
        page=page,
        page_size=page_size,
        status=status,
    )

    if isinstance(data, list):
        items = data
        total = len(data)
    else:
        items = data.get("campaigns", data.get("items", []))
        total = data.get("total")

    campaigns = [transform_campaign(item) for item in items]

    return {
        "campaigns": campaigns,
        "total": total,
        "page": data.get("page", page) if isinstance(data, dict) else page,
        "page_size": data.get("page_size", page_size) if isinstance(data, dict) else page_size,
    }


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    client: CampaignClient = Depends(get_campaign_client),
) -> CampaignOut:
    data = await client.get_campaign(campaign_id)
    return transform_campaign(data)
