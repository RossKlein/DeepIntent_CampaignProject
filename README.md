# DeepIntent Campaign Project

Campaign dashboard (React) and scheduled GitHub issue integration (FastAPI worker) against the provided campaign API.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Worker | http://localhost:8000 |
| Campaign API | http://localhost:8080 |

Architecture notes: [DESIGN.md](./DESIGN.md)

## Run

**Prerequisites:** Docker

```bash
cp .env.example .env
# Set GITHUB_TOKEN and GITHUB_REPO in .env

docker compose up --build
```

## Environment

Copy `.env.example` to `.env`. Compose injects these into containers.

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub PAT with issue write access (**required**) |
| `GITHUB_REPO` | Target repo as `owner/name` (**required**) |
| `VITE_API_URL` | Worker URL for the frontend (default `http://localhost:8000`) |
| `API_URL` | Campaign API URL for worker (default `http://api:8080`) |
| `CAMPAIGN_API_KEY` | Campaign API key (default `interview-key-2024`) |
| `DATABASE_URL` | Postgres connection for worker |
| `POLL_INTERVAL_SECONDS` | Poll interval (default `10`) |
| `CORS_ORIGINS` | Frontend origin (default `http://localhost:5173`) |

## Database

Migrations run on worker startup. Reset tables:

```bash
docker compose exec worker /code/scripts/db_reset.sh
```

Full Postgres wipe: `docker compose down -v`