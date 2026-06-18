"""campaign alert title and body

Revision ID: 002
Revises: 001
Create Date: 2026-06-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("campaign_alerts", sa.Column("title", sa.String(), nullable=True))
    op.add_column("campaign_alerts", sa.Column("body", sa.Text(), nullable=True))
    op.execute(
        sa.text(
            "UPDATE campaign_alerts SET title = '', body = description WHERE description IS NOT NULL"
        )
    )
    op.drop_column("campaign_alerts", "description")
    op.alter_column("campaign_alerts", "title", nullable=False)
    op.alter_column("campaign_alerts", "body", nullable=False)


def downgrade() -> None:
    op.add_column(
        "campaign_alerts", sa.Column("description", sa.String(), nullable=True)
    )
    op.execute(
        sa.text(
            "UPDATE campaign_alerts SET description = body WHERE body IS NOT NULL"
        )
    )
    op.drop_column("campaign_alerts", "body")
    op.drop_column("campaign_alerts", "title")
    op.alter_column("campaign_alerts", "description", nullable=False)
