# Fortnite Island Data Fetcher

This project provides tools to fetch data about Fortnite Creative Islands using both web scraping and API methods.

## API-Based Methods

The API-based methods are the recommended way to fetch island data, as they are faster, more reliable, and don't risk getting blocked by Cloudflare.

### JavaScript Version

```bash
# Install dependencies
npm install

# Run the script
node fortnite_island_data.js
```

### Python Version

```bash
# Install dependencies
pip install requests

# Run the script
python fortnite_island_data.py

# Run the complete version (with more features)
python fortnite_island_data_complete.py

# Pass custom island codes as arguments
python fortnite_island_data_complete.py 6155-1398-4059 8035-1519-2959 7263-1478-7522
```

The complete Python version includes:
- Retry logic for failed requests
- Command-line argument support for custom island codes
- Saving results to JSON files with timestamps
- Fetching featured islands

## Web Scraping Methods (Legacy)

The web scraping methods were created to bypass Cloudflare protection and extract data directly from the fortnite.gg website. These methods are more complex and less reliable than the API-based methods.

### Selenium-Based Scraper

```bash
# Install dependencies
pip install selenium webdriver-manager

# Run the script
python test.py
```

### Playwright-Based Scraper

```bash
# Install dependencies
pip install playwright

# Install browser binaries
playwright install

# Run the script
python html-test.py
```

## API Endpoints

The project uses the following endpoints from the fortniteapi.io service:

- `GET /v1/creative/island?code={code}` - Get information about a specific island by code
- `GET /v1/creative/featured` - Get a list of featured creative islands

## Output

The complete Python script saves output files to the `output/` directory:
- `fortnite_islands_{timestamp}.json` - Contains data for the requested island codes
- `fortnite_featured_{timestamp}.json` - Contains data for currently featured islands

## Notes

- The API key used in these scripts is for demonstration purposes only
- The Cloudflare bypass methods may stop working if Cloudflare updates their protection mechanisms
- The API-based methods are much more efficient and reliable than web scraping 