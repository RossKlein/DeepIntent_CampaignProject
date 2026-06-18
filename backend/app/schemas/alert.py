from datetime import datetime

from pydantic import BaseModel


class GitHubIssueOut(BaseModel):
    id: str
    campaign_id: str
    campaign_name: str
    github_issue_url: str
    title: str
    body: str
    created_at: datetime
