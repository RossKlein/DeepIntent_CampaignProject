from datetime import date, datetime

from pydantic import BaseModel


class CampaignSnapshotOut(BaseModel):
    budget: float
    spend: float
    impressions: int
    clicks: int
    cpm: float
    spend_pct: float
    ctr: float
    over_budget_threshold: bool
    created_at: datetime


class CampaignOut(BaseModel):
    id: str
    name: str
    advertiser: str
    status: str
    start_date: date
    end_date: date
    latest: CampaignSnapshotOut | None


class CampaignDataPointOut(BaseModel):
    id: str
    budget: float
    spend: float
    impressions: int
    clicks: int
    cpm: float
    spend_pct: float
    ctr: float
    created_at: datetime
