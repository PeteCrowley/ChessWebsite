#!/usr/bin/env bash
set -euo pipefail

echo ">>> ENTRYPOINT: starting at $(date)"

# Run migrations
python manage.py migrate --noinput

# Start server
exec python manage.py runserver 0.0.0.0:$PORT
