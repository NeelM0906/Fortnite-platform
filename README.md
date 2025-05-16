# Fortnite Platform

A web application for analyzing Fortnite Creative Island data and displaying player statistics.

## Features

- Fetch and display island metadata from Fortnite API
- Scrape and visualize player count data
- Generate interactive charts showing player trends
- Combine multiple data sources for comprehensive analysis

## Installation

### Prerequisites

- Python 3.7 or higher
- Node.js 14 or higher
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fortnite-platform.git
   cd fortnite-platform
   ```

2. Run the start script to install all dependencies and start the services:
   ```bash
   ./start.sh
   ```

   This will:
   - Create a Python virtual environment
   - Install all required Python packages including the crawl4ai module if available
   - Start the Flask API service on port 5003
   - Start the Next.js app for the frontend

## Usage

Once both services are running:

1. Access the web application at http://localhost:3000
2. Enter a Fortnite island code to analyze (e.g., 1234-5678-9012)
3. View the island details and player statistics

## Architecture

The application consists of two main components:

1. **Flask API Service** (port 5003)
   - Handles data scraping and processing
   - Generates charts and statistics
   - Provides JSON data to the frontend

2. **Next.js Frontend** (port 3000)
   - User interface for the application
   - Makes API calls to the Flask service
   - Displays island details and statistics

## Development

### Flask API Service

The Flask service provides these endpoints:

- `/island_info/<map_code>` - Get island metadata
- `/player_stats/<map_code>` - Get player stats
- `/full_analysis/<map_code>` - Get complete analysis (metadata + stats)
- `/chart/<map_code>` - Get a chart image

### Next.js Frontend

The Next.js app includes API routes at:

- `/api/scrape` - Fetches data from the Flask service and JS script

## Dependencies

### Python

- flask
- flask-cors
- plotly
- requests
- tabulate
- crawl4ai (custom package for web scraping)

### JavaScript/Node.js

- next.js
- react
- axios

## License

MIT
