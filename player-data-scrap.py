"""
Fortnite Island Data Scraper

Fetches and extracts structured data from a Fortnite island stats page using headless browser automation and CSS-based extraction.

Usage:
    python player-data-scrap.py <map_code>
    # or just
    python player-data-scrap.py
    # (then enter the code when prompted)

External dependencies: crawl4ai, json
"""

import sys
import asyncio
import json
from crawl4ai import (
    AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode,
    JsonCssExtractionStrategy
)

def get_js_to_keep_only_elements(xpaths):
    """
    Returns a JS snippet that keeps only the elements matching the given XPaths, removing all others.

    Args:
        xpaths (list[str]): List of XPath strings to keep in the DOM.
    Returns:
        str: JavaScript code as a string.
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

    Returns:
        dict: Extraction schema for JsonCssExtractionStrategy.
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
    try:
        asyncio.run(coro)
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")

def crawl_and_extract(url, xpaths_to_keep, output_path):
    """
    Launches a headless browser, prunes DOM, extracts Fortnite chart data, and writes to file.

    Args:
        url (str): Target Fortnite.gg island URL.
        xpaths_to_keep (list[str]): XPaths of elements to keep in DOM.
        output_path (str): Path to write extracted JSON.
    """
    browser_conf = BrowserConfig(headless=True)
    js_code = get_js_to_keep_only_elements(xpaths_to_keep)
    schema = get_fortnite_chart_schema()
    extraction_strategy = JsonCssExtractionStrategy(verbose=True, schema=schema)
    run_conf = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        delay_before_return_html=5,
        table_score_threshold=100,
        js_code=js_code,
        extraction_strategy=extraction_strategy
    )
    async def _run():
        async with AsyncWebCrawler(config=browser_conf) as crawler:
            result = await crawler.arun(url=url, config=run_conf)
            with open(output_path, "w") as f:
                f.write(result.extracted_content)
    safe_async_run(_run())

def main():
    """
    Entrypoint: configures crawl and extraction for a Fortnite.gg island page.
    """
    if len(sys.argv) > 1:
        map_code = sys.argv[1]
    else:
        map_code = input("Enter Fortnite map code (e.g. 6155-1398-4059): ").strip()
    if not map_code:
        print("No map code provided. Exiting.")
        return
    target_url = f"https://fortnite.gg/island?code={map_code}"
    xpaths_to_keep = [
        '/html/body/div[4]/div[3]'
    ]
    crawl_and_extract(target_url, xpaths_to_keep, "result.txt")

if __name__ == "__main__":
    main()