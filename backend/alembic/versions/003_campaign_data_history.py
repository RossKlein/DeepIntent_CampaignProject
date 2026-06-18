"""campaign metrics history table

Revision ID: 003
Revises: 002
Create Date: 2026-06-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "campaign_data",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("campaign_id", sa.String(), nullable=False),
        sa.Column("budget", sa.Float(), nullable=False),
        sa.Column("spend", sa.Float(), nullable=False),
        sa.Column("impressions", sa.Integer(), nullable=False),
        sa.Column("clicks", sa.Integer(), nullable=False),
        sa.Column("cpm", sa.Float(), nullable=False),
        sa.Column("spend_pct", sa.Float(), nullable=False),
        sa.Column("ctr", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_campaign_data_campaign_id"),
        "campaign_data",
        ["campaign_id"],
        unique=False,
    )
    op.create_index(
        "ix_campaign_data_campaign_id_created_at",
        "campaign_data",
        ["campaign_id", "created_at"],
        unique=False,
    )

    op.execute(
        sa.text(
            """
            INSERT INTO campaign_data (
                id, campaign_id, budget, spend, impressions, clicks, cpm, spend_pct, ctr, created_at
            )
            SELECT
                gen_random_uuid(),
                id,
                budget,
                spend,
                impressions,
                clicks,
                cpm,
                spend_pct,
                ctr,
                updated_at
            FROM campaigns
            """
        )
    )

    op.drop_column("campaigns", "budget")
    op.drop_column("campaigns", "spend")
    op.drop_column("campaigns", "impressions")
    op.drop_column("campaigns", "clicks")
    op.drop_column("campaigns", "cpm")
    op.drop_column("campaigns", "spend_pct")
    op.drop_column("campaigns", "ctr")


def downgrade() -> None:
    op.add_column("campaigns", sa.Column("budget", sa.Float(), nullable=True))
    op.add_column("campaigns", sa.Column("spend", sa.Float(), nullable=True))
    op.add_column("campaigns", sa.Column("impressions", sa.Integer(), nullable=True))
    op.add_column("campaigns", sa.Column("clicks", sa.Integer(), nullable=True))
    op.add_column("campaigns", sa.Column("cpm", sa.Float(), nullable=True))
    op.add_column("campaigns", sa.Column("spend_pct", sa.Float(), nullable=True))
    op.add_column("campaigns", sa.Column("ctr", sa.Float(), nullable=True))

    op.execute(
        sa.text(
            """
            UPDATE campaigns AS c
            SET
                budget = d.budget,
                spend = d.spend,
                impressions = d.impressions,
                clicks = d.clicks,
                cpm = d.cpm,
                spend_pct = d.spend_pct,
                ctr = d.ctr
            FROM (
                SELECT DISTINCT ON (campaign_id)
                    campaign_id, budget, spend, impressions, clicks, cpm, spend_pct, ctr
                FROM campaign_data
                ORDER BY campaign_id, created_at DESC
            ) AS d
            WHERE c.id = d.campaign_id
            """
        )
    )

    for column in ("budget", "spend", "impressions", "clicks", "cpm", "spend_pct", "ctr"):
        op.alter_column("campaigns", column, nullable=False)

    op.drop_index("ix_campaign_data_campaign_id_created_at", table_name="campaign_data")
    op.drop_index(op.f("ix_campaign_data_campaign_id"), table_name="campaign_data")
    op.drop_table("campaign_data")
