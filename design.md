# Design Decisions

## System Overview

The project is a four-service Docker Compose stack: the provided upstream campaign API, a FastAPI **backend**, Postgres, and a static React **frontend**. The backend polls the upstream API on a fixed interval, validates and stores results in Postgres, opens GitHub issues when spend crosses 90% of budget, and exposes a read-only REST API for the UI. The frontend never calls the upstream API or GitHub directly — all secrets stay on the backend, and the browser reads from a stable local read model that survives upstream flakiness.

---

## Technologies

| Layer | Stack |
|-------|--------|
| **Upstream API** | Provided Docker image |
| **Backend** | Python 3, FastAPI, Uvicorn, httpx, tenacity, APScheduler, SQLAlchemy (async) + asyncpg, Alembic, filelock |
| **Database** | PostgreSQL 16 |
| **Frontend** | React 19, Vite, TanStack Query, React Router, Recharts, Tailwind CSS v4 |
| **Frontend hosting** | Apache (static build from multi-stage Dockerfile) |
| **Orchestration** | Docker Compose; shared `.env` for URLs and secrets |

Backend dependencies are pinned via **pip-tools** (`backend/requirements.in` → `requirements.txt`).

---

## Key Design Decisions

- **Backend** —  UI consumes a single backend API. Backend manages jobs, manages data persistence, and provides seamless access.
- **Read model in Postgres** — Decouple the dashboard from upstream availability and response shape; charts and lists read from local history.
- **Append-only metrics snapshots** — Each poll appends a `campaign_data` row rather than overwriting, enabling time-series charts.
- **Alert once per campaign** — A DB row in `campaign_alerts` prevents duplicate GitHub issues on every poll after threshold is crossed.
- **GitHub via httpx** — Direct REST calls with tenacity retries; no high-level GitHub SDK (per requirements).
- **Non-blocking startup** — First poll runs in a background task so the backend serves HTTP immediately (empty state is valid, not an error).
- **Scheduler single-master** — File lock ensures only one Uvicorn process runs APScheduler when the backend is scaled horizontally.
- **Static frontend** — Vite build served by Apache; no Node runtime in production.
- **Central `.env`** — Compose injects API URLs, GitHub credentials, poll interval, and CORS into containers.

---

## Core Backend

### Poll job and scheduler

`PollCampaignsJob` runs every `POLL_INTERVAL_SECONDS` (default 10). Each run: paginate upstream `/campaigns` (`page_size=10`, upstream max), validate each record, upsert campaign identity, append a metrics snapshot, then evaluate alerts. Per-page fetches use short timeouts and limited retries; if a later page fails after earlier pages succeeded, partial results are committed and the next poll continues. Invalid records are skipped with a log line — they do not fail the whole job. After each snapshot, old rows are trimmed per campaign (`CAMPAIGN_DATA_MAX_ROWS`, default 1000).

APScheduler uses `coalesce=True` and `max_instances=1` so overlapping runs are skipped if a poll overruns the interval. The first poll is scheduled via `asyncio.create_task` at startup so Uvicorn is not blocked waiting for a full upstream sync.

### Postgres and Alembic

Postgres data persists in a named Compose volume (`pgdata`). Migrations run automatically on backend startup (`alembic upgrade head` in `start.sh`). Schema changes are versioned under `backend/alembic/versions/`.

### Schema and read API

Three tables: **`campaigns`** (identity and dates), **`campaign_data`** (metrics snapshots), **`campaign_alerts`** (GitHub issue metadata). The backend exposes:

- `GET /campaigns` — list with latest snapshot joined
- `GET /campaigns/{id}` — single campaign + latest snapshot
- `GET /campaigns/{id}/data` — paginated snapshot history (ascending by time)
- `GET /github-issues` — paginated alerts, optional `campaign_id` filter
- `POST /next-day` — proxy to upstream simulation advance

Empty lists return `200` with `total: 0`. `404` is reserved for a requested campaign ID that does not exist. Latest snapshot selection uses `row_number()` with a tie-break on snapshot `id` when multiple rows share the same `created_at`.

### Failure modes

| Failure | Handling |
|---------|----------|
| Upstream connect error / 500 / timeout | Per-page retry (fast backoff); partial sync if some pages already fetched |
| Upstream not ready at startup | Backend serves HTTP immediately; UI shows empty state until first successful poll |
| Invalid upstream payload | Skip record, log warning, continue poll |
| GitHub 429 / 5xx / network | Retry with tenacity; alert not recorded until issue creation succeeds; retried next poll |
| Poll longer than interval | Scheduler skips overlapping run (`max_instances=1`) |
| Duplicate snapshot timestamps | Latest-snapshot query tie-breaks on snapshot `id` |

---

## Database

Campaign metadata (`campaigns`) is separated from **metrics history** (`campaign_data`) intentionally:

- **Upstream vs. dashboard** — Upstream returns a flat campaign object each poll. We split stable fields (name, advertiser, status, dates) from values that change every sync (budget, spend, impressions, etc.). Identity is upserted; metrics are appended.
- **Time series** — Overwriting a single metrics row would lose history. Append-only snapshots power spend-% and other charts on the detail and compare pages.
- **Alert audit trail** — `campaign_alerts` stores title, body, and GitHub URL locally so the sidebar and Manage Alerts page do not depend on GitHub API availability at read time.

Retention is bounded by trimming oldest snapshots per campaign after each insert, keeping storage predictable during long-running demos.

---

## Frontend

The UI talks only to the backend (`VITE_API_URL`). It polls every **5 seconds** for responsiveness; copy in the app says **10 seconds** to reflect the backend/upstream sync interval (the meaningful data refresh cadence).

### Pages and navigation

- **Campaigns (home)** — Searchable list with status / over-budget filters and numeric metric filters (equals or between). Sortable columns including start/end dates. Compare checkboxes with session-persisted selection; **Clear selection** and **Compare selected** actions.
- **Campaign detail** — Full campaign card plus stacked charts (spend %, impressions, clicks, CPM, CTR).
- **Compare** — Side-by-side cards and the same chart set with one line per campaign; spend alerts sidebar filtered to selected campaigns only.
- **Manage Alerts** — Searchable, sortable full alert list; title links to GitHub, campaign name links to detail. No alerts sidebar on this page.

### Spend Alerts sidebar

Present on home, detail, and compare (not on Manage Alerts). Paginated (10 per page) with count at top. On home: title → campaign detail, arrow → GitHub. On campaign detail: title and arrow → GitHub. On compare: filtered to compared campaigns only.

### Other UX

- **Next Day** — Proxies upstream simulation advance; invalidates cached queries.
- **Compare selection** — Stored in `sessionStorage`; survives navigation between home, detail, and compare. **Change selection** returns to home without clearing checkboxes.

# Potential Additional Features

- Adding an analytics agent (LLM) that is able to give natural language summaries on different campaigns. Compare campaigns. Do projections or other analytics. Write professional emails to clients or campaign managers with campaign progress.