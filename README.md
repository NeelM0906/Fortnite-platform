# Fortnite Island Analyzer

A comprehensive toolkit for analyzing Fortnite Creative Islands. This project provides tools to fetch data about Fortnite Creative Islands using both web scraping and API methods, and to visualize player statistics.

## Features

- **API-based data fetching**: Fast and reliable data retrieval using the fortniteapi.io service
- **Web scraping**: Alternative method to extract data directly from fortnite.gg
- **Data visualization**: Interactive charts showing player count over time
- **Unified CLI**: Simple command-line interface for all functionality
- **Player count predictions**: ML-based predictions of future player counts

## Installation

### Python Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Optional: Install the package in development mode
pip install -e .
```

### Node.js Dependencies

```bash
# Install Node.js dependencies
npm install
```

### Crawl4AI Setup

This project uses Crawl4AI for web scraping. If you encounter import errors with this module, please refer to the [Crawl4AI Setup Guide](./CRAWL4AI_SETUP.md) for detailed installation and troubleshooting instructions.

```bash
# Basic Crawl4AI installation
pip install crawl4ai
crawl4ai-setup
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
FORTNITE_API_KEY=your-api-key
```

You can get an API key from [fortniteapi.io](https://fortniteapi.io/).

## Quick Start

The easiest way to use this tool is with the combined script:

```bash
# Run with a specific map code
python run_all_combined.py 1234-5678-9012

# Or run without arguments to be prompted for a map code
python run_all_combined.py
```

This will:
1. Scrape player data from fortnite.gg
2. Generate and display an interactive chart
3. Fetch additional island information via the API

## Individual Components

You can also run each component separately:

```bash
# Run just the web scraper
python player-data-scrap.py 1234-5678-9012

# Generate chart from scraped data
python player_stats_chart.py

# Get island info from API
node fortnite_island_data.js 1234-5678-9012
```

## Project Structure

```
fortnite-island-analyzer/
├── run_all_combined.py       # Main entry point script
├── player-data-scrap.py      # Web scraper for fortnite.gg
├── player_stats_chart.py     # Chart generator for player stats
├── fortnite_island_data.js   # Fortnite API client for island data
├── player_prediction.py      # ML-based player count prediction
├── requirements.txt          # Python dependencies
├── package.json              # Node.js dependencies
├── setup.py                  # Package setup script
├── CHANGES.md                # Details on recent changes
├── CRAWL4AI_SETUP.md         # Guide for Crawl4AI installation
├── output/                   # Output directory for data files
└── README.md                 # This file
```

## Troubleshooting

### Missing Python Modules

If you encounter a "Module not found" error, ensure you've installed all dependencies:

```bash
pip install -r requirements.txt
```

For development, you may need to install the package in development mode:

```bash
pip install -e .
```

For the crawl4ai module specifically, consult [CRAWL4AI_SETUP.md](./CRAWL4AI_SETUP.md).

### Node.js Issues

If you encounter issues with the JavaScript component:

1. Ensure Node.js is installed (version 14+)
2. Make sure dependencies are installed: `npm install`
3. Check that your .env file exists with a valid API key

### Browser Automation

The web scraper uses browser automation. If you encounter issues:

1. Ensure you have a modern browser installed
2. Try running with the `headless=False` option in the code to see the browser in action
3. Some websites may have anti-scraping measures that can change over time
