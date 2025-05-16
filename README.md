# Fortnite Island Analyzer

A comprehensive tool for analyzing Fortnite Creative Islands, including metadata retrieval, player statistics, and predictive analytics.

## Features

- **Island Metadata**: Fetch detailed information about Fortnite Creative Islands
- **Player Statistics**: Track and visualize player engagement metrics
- **Player Count Predictions**: Forecast future player counts with configurable time periods
- **Data Visualization**: Generate charts and visual representations of player data
- **REST API Interface**: Access all functionality through API endpoints
- **User Authentication**: Secure access via Supabase magic link authentication

## Architecture

The application follows a modular design with the following components:

```
fortnite-test/
├── flask_analyzer_service.py   # Flask API for island metadata and player stats
├── player_prediction_service.py # Flask API for player count predictions
├── run_services.py             # Unified service runner
├── src/                        # Core functionality modules
│   ├── api/                    # API client modules
│   ├── scrapers/               # Web scraping modules
│   └── utils/                  # Utility functions and helpers
├── next-app/                   # Next.js frontend application
├── output/                     # Data output directory
└── legacy/                     # Legacy/deprecated scripts
```

## Quick Start Guide

### Prerequisites

- Python 3.7+
- Node.js 14+ (for frontend)
- A modern web browser

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fortnite-test.git
cd fortnite-test
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

Note: The installation may prompt you to install browser components for web scraping. Please follow the on-screen instructions or refer to [CRAWL4AI_SETUP.md](./CRAWL4AI_SETUP.md) for detailed setup instructions.

### 3. Set Up Environment Variables

```bash
cp env.example .env
```

Edit the `.env` file and add your Fortnite API key (optional):

```
FORTNITE_API_KEY=your_api_key_here
HEADLESS=true
OUTPUT_DIR=./output
```

### 4. Install Frontend Dependencies

```bash
cd next-app
npm install
cd ..
```

### 5. Start the Backend Services

In one terminal window:

```bash
# Default ports (5000 and 3000)
python run_services.py

# If port 5000 is in use (common on macOS), use alternative ports:
python run_services.py --analyzer-port 5001 --prediction-port 3002
```

### 6. Start the Frontend

In a second terminal window:

```bash
cd next-app
npm run dev
```

This will start the Next.js development server, typically on port 3000 (if available) or the next available port.

### 7. Access the Application

Open your browser and navigate to:
- http://localhost:3000 (or the port shown in your Next.js terminal)

You'll be directed to the authentication page. The application uses Supabase magic link authentication:
1. Enter your email address
2. Check your email for a magic link
3. Click the link to be logged in
4. You'll be redirected to the dashboard

## Port Configuration

If you encounter port conflicts (especially on macOS where port 5000 is used by AirPlay):

1. Use alternative ports for backend services:
   ```bash
   python run_services.py --analyzer-port 5001 --prediction-port 3002
   ```

2. The frontend will automatically use the next available port if 3000 is in use.

## API Endpoints

### Analyzer Service (Default Port 5000)

- `GET /island_info/{map_code}` - Get island metadata
- `GET /player_stats/{map_code}` - Get player statistics
- `GET /full_analysis/{map_code}` - Get complete analysis
- `GET /chart/{map_code}` - Generate player chart image

### Prediction Service (Default Port 3000)

- `GET /predict/{map_code}` - Get player count predictions
- `GET /predict/{map_code}/{period}` - Get predictions for specific period (12h, 24h, 7d)
- `GET /predict/chart/{map_code}` - Generate prediction chart
- `GET /predict/data/{map_code}` - Get raw prediction data

## Authentication

The application uses Supabase for authentication with magic links. No password is required:

1. Enter your email on the login page
2. Check your email for the magic link
3. Click the link to log in
4. Your session will be maintained until you log out

## Troubleshooting

### Port Conflicts

- **Problem**: "Address already in use" error for port 5000
- **Solution**: macOS uses port 5000 for AirPlay. Use the `--analyzer-port` flag to specify an alternative port.

### Module Import Errors

- **Problem**: `ModuleNotFoundError: No module named 'crawl4ai'`
- **Solution**: Follow the instructions in [CRAWL4AI_SETUP.md](./CRAWL4AI_SETUP.md) to properly set up the web scraping component.

### Authentication Issues

- **Problem**: Magic link emails not arriving
- **Solution**: Check spam folders or retry. The application uses a shared Supabase project for demo purposes.

## License

[MIT License](LICENSE)
