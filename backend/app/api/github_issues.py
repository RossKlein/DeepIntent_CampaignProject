from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.repositories.alert_repository import AlertRepository
from app.services.alert_service import alert_to_out

router = APIRouter(prefix="/github-issues", tags=["github-issues"])


@router.get("")
async def list_github_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    campaign_id: str | None = None,
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    repo = AlertRepository(session)
    issues, total = await repo.list_github_issues(
        page=page,
        page_size=page_size,
        campaign_id=campaign_id,
    )

    return {
        "issues": [
            alert_to_out(alert, campaign) for alert, campaign in issues
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
