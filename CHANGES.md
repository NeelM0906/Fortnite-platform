# Changes to Project Structure

This document outlines the recent changes made to the Fortnite Island Analyzer project structure.

## Code Reorganization

All Python scripts have been moved to their proper directories in the `src` folder:

- `player-data-scrap.py` → `src/scrapers/island_scraper.py`  
- `player_prediction.py` → `src/utils/prediction_utils.py`  
- `player_stats_chart.py` → `src/utils/chart_utils.py`  
- `fortnite_island_data.js` → `src/api/fortnite_api.js`

This ensures a clean separation of concerns and better organization:
- `src/api/` - Contains API clients and data fetching logic
- `src/scrapers/` - Contains web scraping utilities
- `src/utils/` - Contains utilities for charts, predictions, and data processing

## Output File Standardization

All output files are now consistently stored in the `output/` directory:

- `result.txt` → `output/result.txt`
- `predictions.json` → `output/predictions.json`
- Other generated files → `output/[filename]`

## API Route Updates

The Next.js API routes have been updated to use the new file locations:

- `/api/scrape` - Now calls the Python scripts in their new locations
- `/api/predict` - Now calls the prediction utility with updated file paths

## Module Entry Point

The project now has a clear entry point in `src/fortnite_analyzer.py` that:

1. Uses imports directly instead of subprocess calls where possible
2. Creates proper output directories
3. Provides a unified interface for all project features

## Usage Examples

You can use the reorganized codebase in the following ways:

```bash
# Run the main analyzer
python -m src.fortnite_analyzer [map_code]

# Run the scraper directly
python -m src.scrapers.island_scraper [map_code]

# Generate predictions
python -m src.utils.prediction_utils output/result.txt output/predictions.json

# Show statistics and chart
python -m src.utils.chart_utils
```

## Next.js Application

The Next.js application is unchanged functionally but now calls scripts in their new locations. 