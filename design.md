
# Design Decisions

- Docker compose to run project and dockerfile for each service: frontend, worker, and api image

- central .env file contains configurable URLs and secrets like github info. Used by docker compose.

# Frontend

- Dockerfile builds vite + react app then statically serves with apache for a lightweight and portable frontend. No need for a node server for this use case.

# Worker Backend

- Uses pip-tools to build requirements for stable and compatible versions

- fastapi server

- file lock ensures only one uvicorn worker runs the poll scheduler when scaled to multiple workers

- postgres stores synced campaign data; alembic runs on worker startup (`alembic upgrade head`)