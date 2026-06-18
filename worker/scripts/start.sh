#!/bin/sh
set -e

WORKERS="${WORKERS:-1}"

alembic upgrade head

exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers "$WORKERS"
