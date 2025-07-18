#!/usr/bin/env bash
# Render.com build script for DubMyYT backend

set -o errexit  # Exit on error

echo "Starting DubMyYT backend build process..."

# Install system dependencies
echo "Installing system dependencies..."
apt-get update -qq
apt-get install -y --no-install-recommends ffmpeg

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install Python dependencies
echo " Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Build completed successfully!"
