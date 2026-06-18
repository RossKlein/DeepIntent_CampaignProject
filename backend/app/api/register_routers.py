from fastapi import FastAPI

from app.api import campaigns, github_issues, health, simulation


def include_routers(app: FastAPI) -> None:
    app.include_router(health.router)
    app.include_router(campaigns.router)
    app.include_router(github_issues.router)
    app.include_router(simulation.router)
