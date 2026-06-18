from dataclasses import dataclass
from datetime import date

from app.db.models import Campaign, CampaignData


@dataclass
class ValidatedCampaign:
    id: str
    name: str
    advertiser: str
    status: str
    start_date: date
    end_date: date
    budget: float
    spend: float
    impressions: int
    clicks: int
    cpm: float
    spend_pct: float
    ctr: float


@dataclass
class SyncedCampaign:
    campaign: Campaign
    snapshot: CampaignData
