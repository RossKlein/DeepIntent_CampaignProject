from fastapi import FastAPI

from app.api import campaigns, health


def include_routers(app: FastAPI) -> None:
    app.include_router(health.router)
    app.include_router(campaigns.router)
