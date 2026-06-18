from pydantic import BaseModel


class CampaignOut(BaseModel):
    id: str
    name: str
    advertiser: str
    budget: float
    spend: float
    status: str
    spend_pct: float
    over_budget_threshold: bool
