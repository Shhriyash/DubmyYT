#!/usr/bin/env bash

set -o errexit

echo "Starting DubMyYT backend build process..."

echo "Upgrading pip..."
python -m pip install --upgrade pip

echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Build completed successfully!"
