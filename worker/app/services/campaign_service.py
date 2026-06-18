from app.schemas.campaign import CampaignOut


def transform_campaign(raw: dict) -> CampaignOut:
    budget = float(raw["budget"])
    spend = float(raw["spend"])
    spend_pct = round((spend / budget) * 100, 1) if budget else 0.0

    return CampaignOut(
        id=str(raw["id"]),
        name=raw["name"],
        advertiser=raw["advertiser"],
        budget=budget,
        spend=spend,
        status=raw["status"],
        spend_pct=spend_pct,
        over_budget_threshold=spend_pct > 90,
    )
