#!/usr/bin/env bash
# Start script for DubMyYT backend

set -o errexit

echo "Starting DubMyYT backend server..."

# Change to backend directory
cd backend

# Use Gunicorn for production (default on Render)
if [[ -n "$PORT" ]]; then
    echo " Starting production server with Gunicorn on port $PORT..."
    exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --access-logfile - --error-logfile - server:app
else
    echo "Starting development server..."
    exec python server.py
fi
