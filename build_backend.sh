#!/usr/bin/env bash
# Render.com build script for DubMyYT backend

set -o errexit  # Exit on error

echo "Starting DubMyYT backend build process..."

# Note: FFmpeg is pre-installed on Render's Python environment
# No need to install system dependencies manually

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Build completed successfully!"
