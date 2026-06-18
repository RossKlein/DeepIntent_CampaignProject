import logging

logger = logging.getLogger(__name__)


async def poll_campaigns_once() -> None:
    """Poll campaign API and open GitHub issues for over-budget campaigns."""
    logger.info("poll_campaigns_once: not implemented yet")
