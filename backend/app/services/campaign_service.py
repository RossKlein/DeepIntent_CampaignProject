from app.db.models import Campaign, CampaignData
from app.schemas.campaign import CampaignDataPointOut, CampaignOut, CampaignSnapshotOut

SPEND_ALERT_THRESHOLD_PCT = 90.0


def snapshot_to_out(snapshot: CampaignData) -> CampaignSnapshotOut:
    return CampaignSnapshotOut(
        budget=snapshot.budget,
        spend=snapshot.spend,
        impressions=snapshot.impressions,
        clicks=snapshot.clicks,
        cpm=snapshot.cpm,
        spend_pct=snapshot.spend_pct,
        ctr=snapshot.ctr,
        over_budget_threshold=snapshot.spend_pct > SPEND_ALERT_THRESHOLD_PCT,
        created_at=snapshot.created_at,
    )


def campaign_model_to_out(
    campaign: Campaign, snapshot: CampaignData | None
) -> CampaignOut:
    return CampaignOut(
        id=campaign.id,
        name=campaign.name,
        advertiser=campaign.advertiser,
        status=campaign.status,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        latest=snapshot_to_out(snapshot) if snapshot is not None else None,
    )


def campaign_data_to_out(data: CampaignData) -> CampaignDataPointOut:
    return CampaignDataPointOut(
        id=str(data.id),
        budget=data.budget,
        spend=data.spend,
        impressions=data.impressions,
        clicks=data.clicks,
        cpm=data.cpm,
        spend_pct=data.spend_pct,
        ctr=data.ctr,
        created_at=data.created_at,
    )
