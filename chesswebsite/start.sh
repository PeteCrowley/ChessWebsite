#!/usr/bin/env bash
set -e
echo ">>> START.SH RUNNING: $(date)"
echo "ENV SAMPLE: PORT=$PORT DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE"
sleep 1
exec python manage.py runserver 0.0.0.0:$PORT