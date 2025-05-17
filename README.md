# Fortnite-platform

A platform for analyzing and visualizing Fortnite island statistics.

## Features

- Scrape player data from Fortnite islands
- Generate charts and visualizations
- Interactive Streamlit dashboard
- Flask APIs for data access and player predictions
- Web frontend for easy data viewing

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/Fortnite-platform.git
cd Fortnite-platform
pip install -r requirements.txt
npm install # for JavaScript components
```

## Usage

### Streamlit Dashboard

Run the dashboard:

```bash
streamlit run dashboard.py
```

### Flask APIs

#### Main Data API

Start the main API server:

```bash
python api.py
# or
flask run
```

#### Player Prediction API

Start the player prediction API server:

```bash
python player_prediction_api.py
# or
flask run --port 5004
```

### Web Frontend

After starting both APIs, simply open the `index.html` file in your browser:

```bash
# Open the file directly in your browser
open index.html  # on macOS
# or
firefox index.html  # on Linux
# or
start index.html  # on Windows
```

Alternatively, you can serve it using a basic HTTP server:

```bash
# Using Python's built-in server
python -m http.server

# Then open http://localhost:8000 in your browser
```

## API Endpoints

### Main Data API (Port 5003)

The main Flask API provides JSON access to the Fortnite island data:

- `GET /api/analyze/<map_code>` - Run analysis on a Fortnite map code
- `GET /api/analyses` - Get list of all existing analyses
- `GET /api/analysis/<map_code>` - Get the most recent analysis for a specific map code
- `GET /api/health` - Health check endpoint

### Player Prediction API (Port 5004)

The player prediction API provides forecasting functionality:

- `POST /api/predict` - Accept JSON data and return predictions
- `GET /api/predict/<map_code>` - Generate predictions for a specific map code
- `GET /api/save-prediction/<map_code>` - Generate and save predictions for a map code
- `GET /api/health` - Health check endpoint

### Example API Usage

```bash
# Run a new analysis (Main API)
curl http://localhost:5003/api/analyze/1865-4829-7018

# List all analyses (Main API)
curl http://localhost:5003/api/analyses

# Get the most recent analysis (Main API)
curl http://localhost:5003/api/analysis/1865-4829-7018

# Generate predictions for a map code (Prediction API)
curl http://localhost:5004/api/predict/1865-4829-7018

# Generate predictions with custom periods (Prediction API)
curl http://localhost:5004/api/predict/1865-4829-7018?periods=24
```

## Project Structure

- `dashboard.py` - Streamlit dashboard for visualization
- `api.py` - Flask API for headless data access
- `player_prediction_api.py` - Flask API for player predictions
- `main.py` - Command-line script for analysis
- `player_prediction.py` - Player count forecasting module
- `index.html` - Web frontend
- `styles.css` - Frontend styles
- `app.js` - Frontend JavaScript
- `src/` - Source code for scrapers, API integrations, and utilities
- `output/` - Output directory for analysis results 