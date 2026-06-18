from app.services.poll_campaigns_job import run_poll_job


async def poll_campaigns_once() -> None:
    await run_poll_job()
