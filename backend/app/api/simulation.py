from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.exceptions import CampaignAPIError
from app.services.campaign_client import CampaignClient

router = APIRouter(tags=["simulation"])


@router.post("/next-day")
async def advance_next_day() -> dict:
    """Proxy to upstream API to advance the campaign simulation by one day."""
    client = CampaignClient(settings.API_URL, settings.CAMPAIGN_API_KEY)
    try:
        return await client.advance_next_day()
    except CampaignAPIError as exc:
        raise HTTPException(
            status_code=exc.status_code or 502,
            detail=str(exc),
        ) from exc
