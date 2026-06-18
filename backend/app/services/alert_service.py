from app.db.models import Campaign, CampaignAlert
from app.schemas.alert import GitHubIssueOut


def alert_to_out(alert: CampaignAlert, campaign: Campaign) -> GitHubIssueOut:
    return GitHubIssueOut(
        id=str(alert.id),
        campaign_id=alert.campaign_id,
        campaign_name=campaign.name,
        github_issue_url=alert.github_issue_url,
        title=alert.title,
        body=alert.body,
        created_at=alert.created_at,
    )
