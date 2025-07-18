#!/usr/bin/env bash
# Build script for Render deployment

echo "Starting build process..."

# Install system dependencies
echo "Installing system dependencies..."
apt-get update
apt-get install -y ffmpeg

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt

echo "Build completed successfully!"
