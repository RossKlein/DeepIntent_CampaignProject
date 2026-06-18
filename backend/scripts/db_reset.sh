#!/bin/sh
set -e

alembic downgrade base
alembic upgrade head

echo "Database reset complete."
