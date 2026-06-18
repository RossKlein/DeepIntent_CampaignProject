# DeepIntent Campaign Project

Campaign dashboard (React) and scheduled GitHub issue integration (FastAPI backend) against the provided campaign API.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Campaign API | http://localhost:8080 |

Architecture notes: [design.md](./design.md)

## Run

**Prerequisites:** Docker

```bash
cp .env.example .env
# Set GITHUB_TOKEN and GITHUB_REPO in .env

docker compose up --build
```

## Shutting Down

After stopping the stack, wipe the Postgres volume for a clean slate on the next run:

```bash
docker compose down -v
```

Without `-v`, campaign and alert data persist across restarts.

## Environment

Copy `.env.example` to `.env`. Compose injects these into containers.

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub PAT with issue write access (**required**) |
| `GITHUB_REPO` | Target repo as `owner/name` (**required**) |
| `VITE_API_URL` | Backend URL for the frontend (default `http://localhost:8000`) |
| `API_URL` | Campaign API URL for backend (default `http://api:8080`) |
| `CAMPAIGN_API_KEY` | Campaign API key (default `interview-key-2024`) |
| `DATABASE_URL` | Postgres connection for backend |
| `POLL_INTERVAL_SECONDS` | Upstream poll interval (default `10`) |
| `CORS_ORIGINS` | Frontend origin (default `http://localhost:5173`) |

## Database

Migrations run on backend startup. Reset tables without dropping the volume:

```bash
docker compose exec backend /code/scripts/db_reset.sh
```

Full Postgres wipe: `docker compose down -v`
