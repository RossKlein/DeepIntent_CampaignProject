import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI

from app.api.register_routers import include_routers
from app.core.config import settings
from app.core.scheduler_lock import (
    release_scheduler_master_lock,
    try_become_scheduler_master,
)
from app.jobs.poll_campaigns import poll_campaigns_once
from app.middlewares.register_middlewares import include_middlewares

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = None
    is_master = try_become_scheduler_master()

    if is_master:
        logger.info("This worker is the scheduler master")
        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            poll_campaigns_once,
            trigger="interval",
            seconds=settings.POLL_INTERVAL_SECONDS,
            id="poll_campaigns",
            coalesce=True,
            max_instances=1,
            replace_existing=True,
        )
        scheduler.start()
    else:
        logger.info("Another worker holds the scheduler lock; skipping scheduler startup")

    yield

    if scheduler is not None:
        scheduler.shutdown(wait=False)
    release_scheduler_master_lock()


app = FastAPI(title="Campaign Worker", lifespan=lifespan)

include_middlewares(app)
include_routers(app)
