# Fortnite Island Analyzer

A comprehensive toolkit for analyzing Fortnite Creative Islands. This project provides tools to fetch data about Fortnite Creative Islands using both web scraping and API methods, and to visualize player statistics.

## Features

- **API-based data fetching**: Fast and reliable data retrieval using the fortniteapi.io service
- **Web scraping**: Alternative method to extract data directly from fortnite.gg
- **Data visualization**: Interactive charts showing player count over time
- **Unified CLI**: Simple command-line interface for all functionality
- **Next.js integration**: Web interface for viewing island data
- **Player count predictions**: ML-based predictions of future player counts

## Installation

### Python Package

```bash
# Clone the repository
git clone https://github.com/yourusername/fortnite-island-analyzer.git
cd fortnite-island-analyzer

# Install dependencies
pip install -r requirements.txt

# Install the package in development mode
pip install -e .
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
FORTNITE_API_KEY=your-api-key
```

You can get an API key from [fortniteapi.io](https://fortniteapi.io/).

## Usage

### Command Line Interface

The main command-line interface provides access to all functionality:

```bash
# Basic usage
python -m src.fortnite_analyzer 6155-1398-4059

# Run individual components
python -m src.scrapers.island_scraper 6155-1398-4059
python -m src.utils.chart_utils
python -m src.utils.prediction_utils output/result.txt output/predictions.json
```

Check [CHANGES.md](CHANGES.md) for details on the recent project reorganization.

### Python API

You can also use the components as a Python library:

```python
# Scraper
from src.scrapers.island_scraper import crawl_and_extract_island_data
data_file = crawl_and_extract_island_data('6155-1398-4059', 'output/result.txt')

# Chart utilities
from src.utils.chart_utils import show_stats_and_chart
show_stats_and_chart('output/result.txt')

# Prediction utilities
from src.utils.prediction_utils import generate_predictions
import json
with open('output/result.txt') as f:
    data = json.load(f)
predictions = generate_predictions(data)
```

### Next.js Web Interface

The project includes a Next.js web interface for viewing island data:

```bash
# Navigate to the Next.js app directory
cd next-app

# Install dependencies
npm install

# Run the development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
fortnite-island-analyzer/
├── src/                      # Python source code
│   ├── api/                  # API client
│   │   └── fortnite_api.js   # Fortnite API client
│   ├── scrapers/             # Web scrapers
│   │   └── island_scraper.py # Fortnite.gg scraper
│   ├── utils/                # Utility functions
│   │   ├── chart_utils.py    # Chart generation utilities
│   │   └── prediction_utils.py # ML prediction utilities
│   └── fortnite_analyzer.py  # Main entry point
├── next-app/                 # Next.js web interface
│   ├── app/                  # App directories
│   │   ├── api/              # API routes
│   │   └── ...               # Page components
│   ├── components/           # React components
│   └── ...                   # Configuration files
├── output/                   # Output directory for data files
├── requirements.txt          # Python dependencies
├── setup.py                  # Package setup script
├── CHANGES.md                # Details on recent changes
└── README.md                 # This file
```

See [CHANGES.md](CHANGES.md) for details on recent project reorganization.

## API Endpoints

The Next.js application provides the following API endpoints:

- `POST /api/scrape` - Scrape data for a Fortnite island by map code
- `POST /api/predict` - Generate player count predictions for a previously scraped island
- `GET /api/health` - Check API health
- `GET /api/profile` - Get user profile information 