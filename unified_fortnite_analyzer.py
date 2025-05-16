#!/usr/bin/env python3
"""
Unified Fortnite Island Analyzer

Combines island metadata and player stats visualization in a single interface.
When run, this script will:
1. Prompt the user for a Fortnite map code
2. Fetch island metadata from the Fortnite API
3. Scrape player stats data from fortnite.gg
4. Display both island information and player statistics with visualizations

Usage:
    python unified_fortnite_analyzer.py [map_code]
    # or just
    python unified_fortnite_analyzer.py
    # (then enter the code when prompted)

External dependencies: crawl4ai, plotly, tabulate, requests
"""
import sys
import os
import json
import time
from datetime import datetime

# Ensure output directory exists
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Import from existing modules ---
# From player-data-scrap.py
try:
    from crawl4ai import (
        AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode,
        JsonCssExtractionStrategy
    )
except ImportError:
    print("ERROR: crawl4ai module not found. Please follow the instructions in CRAWL4AI_SETUP.md to install it correctly.")
    sys.exit(1)

# From player_stats_chart.py
try:
    import plotly.graph_objects as go
except ImportError:
    print("Plotly not installed. Install with: pip install plotly")
    sys.exit(1)

try:
    from tabulate import tabulate
    use_tabulate = True
except ImportError:
    use_tabulate = False
    print("Tabulate not installed. Tables will be displayed in simple format.")

# From fortnite_island_data_complete.py
try:
    import requests
except ImportError:
    print("Requests not installed. Install with: pip install requests")
    sys.exit(1)

# --- Utility Functions ---
def safe_int(val):
    """
    Safely convert a string to int, handling commas, 'K', and invalid values.
    """
    if not val or val == '-':
        return None
    try:
        return int(val.replace(',', '').replace('K','000').split()[0])
    except Exception:
        return None

# --- Island Metadata API Functions (from fortnite_island_data_complete.py) ---
def get_island_data(map_code, api_key=None):
    """
    Fetches detailed data for a specific Fortnite Creative Island by its code.
    """
    # Base URL for the Fortnite API (fortniteapi.io)
    BASE_URL = "https://fortniteapi.io/v1"
    
    # Check for API key in environment variable
    if not api_key:
        api_key = os.environ.get("FORTNITE_API_KEY")
    
    # If no API key is available, inform the user but continue with web scraping
    if not api_key:
        print("Note: No Fortnite API key found. Set FORTNITE_API_KEY environment variable for additional metadata.")
        print("Continuing with player stats scraping only...")
        return None
        
    # Standard headers for all API requests, including authorization
    headers = {"Authorization": api_key}
    
    endpoint_url = f"{BASE_URL}/creative/island"
    params = {"code": map_code}
    
    print(f"\n=== Fetching Island Information for {map_code} ===")
    
    try:
        response = requests.get(endpoint_url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Check if the API indicates success and island data is present
        if data.get("result") is True and data.get("island"):
            island_details = data["island"]
            # Return a structured dictionary of the relevant island details
            return {
                "code": island_details.get("code"),
                "title": island_details.get("title"),
                "description": island_details.get("description"),
                "creator": island_details.get("creator"),
                "creator_code": island_details.get("creatorCode"),
                "creator_id": island_details.get("creatorId"),
                "published_date": island_details.get("publishedDate"),
                "tags": island_details.get("tags", []),
                "image_url": island_details.get("image"),
                "lobby_image_url": island_details.get("lobbyImage"),
                "version": island_details.get("latestVersion"),
                "island_type": island_details.get("islandType"),
                "status": island_details.get("status"),
                "ratings": island_details.get("ratings")
            }
        else:
            print(f"API reports success but island data is incomplete or not found for code: {map_code}")
            return None
            
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred while fetching island {map_code}: {http_err}")
    except requests.exceptions.Timeout as timeout_err:
        print(f"Timeout error occurred while fetching island {map_code}: {timeout_err}")
    except requests.exceptions.RequestException as req_err:
        print(f"Request exception occurred while fetching island {map_code}: {req_err}")
    except json.JSONDecodeError as json_err:
        print(f"Failed to decode JSON response for island {map_code}: {json_err}")
    
    print("Could not fetch island data from API. Continuing with player stats scraping...")
    return None

def display_island_info(island_data):
    """
    Prints formatted island metadata.
    """
    if not island_data:
        return
    
    print("\n=== Island Information ===")
    print(f"Title: {island_data.get('title', 'N/A')}")
    print(f"Creator: {island_data.get('creator', 'N/A')}")
    print(f"Creator Code: {island_data.get('creator_code', 'N/A')}")
    print(f"Published: {island_data.get('published_date', 'N/A')}")
    print(f"Island Type: {island_data.get('island_type', 'N/A')}")
    print(f"Status: {island_data.get('status', 'N/A')}")
    
    # Print tags if available
    tags = island_data.get('tags', [])
    if tags:
        print("Tags:", ", ".join(tags))
    
    # Print description (truncated if too long)
    description = island_data.get('description', '')
    if description:
        if len(description) > 150:
            print(f"Description: {description[:150]}...")
        else:
            print(f"Description: {description}")
    
    # Print ratings info if available
    ratings = island_data.get('ratings')
    if ratings:
        print("\nRatings:")
        print(f"  Total Likes: {ratings.get('totalUpVotes', 'N/A')}")
        print(f"  Total Dislikes: {ratings.get('totalDownVotes', 'N/A')}")
        
    # Print media links
    print("\nMedia:")
    if island_data.get('image_url'):
        print(f"  Image URL: {island_data.get('image_url')}")
    if island_data.get('lobby_image_url'):
        print(f"  Lobby Image URL: {island_data.get('lobby_image_url')}")

# --- Web Scraping Functions (from player-data-scrap.py) ---
def get_js_to_keep_only_elements(xpaths):
    """
    Returns a JS snippet that keeps only the elements matching the given XPaths.
    """
    xpaths_js = ',\n            '.join([f'\'{xp}\'' for xp in xpaths])
    return f"""
(() => {{
    const xpaths = [
        {xpaths_js}
    ];
    const keepNodes = xpaths.map(xpath => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue).filter(Boolean);
    if (keepNodes.length === 0) return;
    const newBody = document.createElement('body');
    keepNodes.forEach(node => {{
        newBody.appendChild(node.cloneNode(true));
    }});
    document.body.parentNode.replaceChild(newBody, document.body);
}})();
"""

def get_fortnite_chart_schema():
    """
    Returns the extraction schema for Fortnite chart data.
    """
    return {
        "name": "Fortnite Chart Full Extraction",
        "baseSelector": "div.chart-wrap-wrap",
        "fields": [
            {"name": "title", "selector": "h2 a", "type": "text"},
            {"name": "title_link", "selector": "h2 a", "type": "attribute", "attribute": "href"},
            {"name": "chart_image", "selector": "img.island-img-thumb", "type": "attribute", "attribute": "src"},
            {"name": "chart_image_alt", "selector": "img.island-img-thumb", "type": "attribute", "attribute": "alt"},
            {
                "name": "player_stats",
                "selector": "div.chart-stats-div",
                "type": "nested_list",
                "fields": [
                    {"name": "stat_value", "selector": "div.chart-stats-title", "type": "text"},
                    {"name": "stat_label", "selector": "div:not(.chart-stats-title)", "type": "text"}
                ]
            },
            {
                "name": "chart_ranges",
                "selector": "div.chart-range",
                "type": "list",
                "fields": [
                    {"name": "range", "type": "text"}
                ]
            },
            {"name": "double_click_info", "selector": "div.chart-dblclick-info", "type": "text"},
            {
                "name": "table_rows",
                "selector": "#chart-month-table tbody tr",
                "type": "nested_list",
                "fields": [
                    {"name": "time", "selector": "td:nth-child(1)", "type": "text"},
                    {"name": "peak", "selector": "td:nth-child(2)", "type": "text"},
                    {"name": "gain", "selector": "td:nth-child(3)", "type": "text"},
                    {"name": "percent_gain", "selector": "td:nth-child(4)", "type": "text"},
                    {"name": "average", "selector": "td:nth-child(5)", "type": "text"},
                    {"name": "avg_gain", "selector": "td:nth-child(6)", "type": "text"},
                    {"name": "avg_percent_gain", "selector": "td:nth-child(7)", "type": "text"},
                    {"name": "estimated_earnings", "selector": "td:nth-child(8)", "type": "text"}
                ]
            },
            {"name": "tooltip", "selector": "div.chart-tooltip", "type": "text"}
        ]
    }

def safe_async_run(coro):
    """
    Runs an async coroutine safely, handling KeyboardInterrupt.
    """
    import asyncio
    try:
        return asyncio.run(coro)
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        return None

async def _run_crawler(url, js_code, schema, output_path):
    """
    Helper function to run the crawler asynchronously.
    """
    browser_conf = BrowserConfig(headless=True)
    extraction_strategy = JsonCssExtractionStrategy(verbose=True, schema=schema)
    run_conf = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        delay_before_return_html=5,
        table_score_threshold=100,
        js_code=js_code,
        extraction_strategy=extraction_strategy
    )
    
    async with AsyncWebCrawler(config=browser_conf) as crawler:
        result = await crawler.arun(url=url, config=run_conf)
        with open(output_path, "w") as f:
            f.write(result.extracted_content)
        return result.extracted_content

def scrape_player_data(map_code, output_path):
    """
    Scrapes player data from fortnite.gg for the given map code.
    """
    print(f"\n=== Scraping Player Stats for {map_code} ===")
    target_url = f"https://fortnite.gg/island?code={map_code}"
    xpaths_to_keep = [
        '/html/body/div[4]/div[3]'
    ]
    
    js_code = get_js_to_keep_only_elements(xpaths_to_keep)
    schema = get_fortnite_chart_schema()
    
    print(f"Launching headless browser to scrape data from {target_url}")
    print("This may take a few moments...")
    
    result = safe_async_run(_run_crawler(target_url, js_code, schema, output_path))
    
    if result:
        print(f"Data successfully scraped and saved to {output_path}")
        return True
    else:
        print(f"Failed to scrape data from {target_url}")
        return False

# --- Chart and Stats Functions (from player_stats_chart.py) ---
def display_player_stats(data):
    """
    Extracts and displays player stats from the scraped data.
    """
    if not data:
        print("No player stats data available.")
        return
    
    # If data is a list, get the first item
    if isinstance(data, list):
        if len(data) == 0:
            print("No player stats data available.")
            return
        data = data[0]
    
    print("\n=== Player Stats ===")
    for stat in data.get('player_stats', []):
        label = stat.get('stat_label', '').strip()
        value = stat.get('stat_value', '').strip()
        print(f'{label}: {value}')
    
def display_player_table(data):
    """
    Displays a table of player data from the scraped data.
    """
    if not data:
        return
    
    # If data is a list, get the first item
    if isinstance(data, list):
        if len(data) == 0:
            return
        data = data[0]
    
    table = data.get('table_rows', [])
    if not table:
        print('No table data available.')
        return
    
    # Prepare data for table and chart
    rows = []
    times, peaks, avgs = [], [], []
    for row in table:
        t = row.get('time')
        p = safe_int(row.get('peak', ''))
        a = safe_int(row.get('average', ''))
        if t and p is not None:
            if a is None:
                a = 0  # Use 0 for missing average values
            rows.append([t, p, a])
            times.append(t)
            peaks.append(p)
            avgs.append(a)
    
    if not times:
        print('No valid numeric data for table or chart.')
        return
    
    # Print table
    print('\n=== Player Count Data ===')
    headers = ['Time', 'Peak', 'Average']
    if use_tabulate:
        print(tabulate(rows, headers=headers, tablefmt='github'))
    else:
        print(f"{headers[0]:<20} {headers[1]:>10} {headers[2]:>10}")
        print('-'*42)
        for r in rows:
            print(f"{r[0]:<20} {r[1]:>10} {r[2]:>10}")
    
    return times, peaks, avgs

def display_player_chart(times, peaks, avgs):
    """
    Displays an interactive chart of player data.
    """
    if not times or not peaks:
        return
    
    print("\n=== Generating Interactive Chart ===")
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=times, y=peaks, mode='lines+markers', name='Peak'))
    fig.add_trace(go.Scatter(x=times, y=avgs, mode='lines+markers', name='Average'))
    fig.update_layout(
        title='Player Count Over Time',
        xaxis_title='Time',
        yaxis_title='Players',
        legend_title='Legend'
    )
    fig.show()

def process_player_data(result_file):
    """
    Reads the scraped data file and processes it for display.
    """
    try:
        with open(result_file) as f:
            data = json.load(f)
        
        display_player_stats(data)
        times, peaks, avgs = display_player_table(data)
        display_player_chart(times, peaks, avgs)
        
        return data
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error processing player data: {str(e)}")
        return None

# --- Main Function ---
def main():
    """
    Unified entry point for Fortnite island analysis.
    """
    # Get map code from command line or prompt
    if len(sys.argv) > 1:
        map_code = sys.argv[1]
    else:
        map_code = input("Enter Fortnite map code: ").strip()
    
    if not map_code:
        print("No map code provided. Exiting.")
        return
    
    # 1. Fetch island metadata from API
    island_data = get_island_data(map_code)
    if island_data:
        display_island_info(island_data)
    
    # 2. Scrape player stats from fortnite.gg
    output_path = os.path.join(OUTPUT_DIR, "result.txt")
    success = scrape_player_data(map_code, output_path)
    
    if success:
        # 3. Process and display player stats and chart
        process_player_data(output_path)
        print(f"\nCompleted analysis for map code: {map_code}")
    else:
        print("Failed to complete analysis due to scraping errors.")

if __name__ == "__main__":
    main() 