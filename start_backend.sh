#!/usr/bin/env bash
# Start script for DubMyYT backend

set -o errexit

echo "Starting DubMyYT backend server..."

# Change to backend directory
cd backend

# Start the application with Gunicorn for production
if [[ $ENVIRONMENT == "production" ]]; then
    echo " Starting production server with Gunicorn..."
    exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 server:app
else
    echo "🔧 Starting development server..."
    exec python server.py
fi
