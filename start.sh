#!/bin/bash
# Start script for Fortnite Platform
# Starts both the Flask API service and the Next.js app

# Set default port for Flask service
export FLASK_RUN_PORT=5003

# Create and set up virtual environment
VENV_DIR="venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment."
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Install dependencies in the virtual environment
echo "Installing Python dependencies..."
pip install flask flask-cors plotly requests tabulate
if [ $? -ne 0 ]; then
    echo "Error: Failed to install Python dependencies."
    exit 1
fi

# Install crawl4ai if available
if [ -d "crawl4ai" ]; then
    echo "Installing crawl4ai from local directory..."
    pip install -e crawl4ai
elif [ -f "crawl4ai-1.0.0.tar.gz" ]; then
    echo "Installing crawl4ai from tarball..."
    pip install crawl4ai-1.0.0.tar.gz
elif [ -f "CRAWL4AI_SETUP.md" ]; then
    echo "Please follow instructions in CRAWL4AI_SETUP.md to install crawl4ai manually."
    echo "crawl4ai is needed for live data scraping (mock data will be used instead)."
else
    echo "Installing crawl4ai from PyPI (may fail if not available)..."
    pip install crawl4ai || echo "crawl4ai not available - will use mock data."
fi

# Start Flask service in background
echo "Starting Flask service on port $FLASK_RUN_PORT..."
python flask_analyzer_service.py &
FLASK_PID=$!

# Wait for Flask service to start
echo "Waiting for Flask service to start..."
sleep 3

# Check if Flask service is running
if ! ps -p $FLASK_PID > /dev/null; then
    echo "Error: Flask service failed to start. Check the logs above."
    deactivate  # Deactivate virtual environment
    exit 1
fi

echo "Flask service started with PID $FLASK_PID"

# Start Next.js app
echo "Starting Next.js app..."
cd next-app
npm run dev

# When Next.js app is stopped, kill Flask service
echo "Stopping Flask service..."
kill $FLASK_PID
deactivate  # Deactivate virtual environment

echo "All services stopped." 