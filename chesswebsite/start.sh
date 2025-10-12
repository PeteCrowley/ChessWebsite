#!/usr/bin/env bash
#!/usr/bin/env bash
set -euo pipefail

# Print a small startup marker (useful in logs)
echo ">>> ENTRYPOINT: starting at $(date)"

# Run migrations (safe in most setups; remove if you run migrations separately)
python manage.py migrate --noinput

# Start Daphne (ASGI server). Use exec so signals are forwarded correctly.
exec python manage.py runserver 0.0.0.0:$PORT
