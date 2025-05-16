"""
crawl4ai - A simple web crawler and data extraction tool
"""

from enum import Enum
import json
import asyncio

# Enums
class CacheMode(Enum):
    BYPASS = 'bypass'
    USE_CACHE = 'use_cache'
    REFRESH = 'refresh'

# Configuration classes
class BrowserConfig:
    def __init__(self, headless=True, **kwargs):
        self.headless = headless
        self.extra_args = kwargs

class CrawlerRunConfig:
    def __init__(self, cache_mode=CacheMode.BYPASS, delay_before_return_html=2, 
                 table_score_threshold=100, js_code=None, extraction_strategy=None):
        self.cache_mode = cache_mode
        self.delay_before_return_html = delay_before_return_html
        self.table_score_threshold = table_score_threshold
        self.js_code = js_code
        self.extraction_strategy = extraction_strategy

# Extraction strategies
class JsonCssExtractionStrategy:
    def __init__(self, verbose=False, schema=None):
        self.verbose = verbose
        self.schema = schema

# Mock crawler result
class CrawlerResult:
    def __init__(self, extracted_content, html_content="<html></html>"):
        self.extracted_content = extracted_content
        self.html_content = html_content

# Main crawler class
class AsyncWebCrawler:
    def __init__(self, config=None):
        self.config = config or BrowserConfig()
        
    async def __aenter__(self):
        print("Starting crawler session...")
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("Closing crawler session...")
    
    async def arun(self, url, config=None):
        """
        Run the crawler on a URL and extract data according to the provided configuration.
        This is a mock implementation that returns dummy data.
        """
        print(f"Crawling URL: {url}")
        await asyncio.sleep(1)  # Simulate network delay
        
        # Extract map code from URL
        map_code = url.split("code=")[-1] if "code=" in url else "unknown"
        
        # Generate mock data
        mock_data = {
            "title": f"Fortnite Island {map_code}",
            "title_link": url,
            "chart_image": "https://example.com/images/chart.png",
            "chart_image_alt": f"Player Chart for {map_code}",
            "player_stats": [
                {"stat_label": "Players Now", "stat_value": "2,345"},
                {"stat_label": "Peak Today", "stat_value": "4,567"},
                {"stat_label": "Peak Ever", "stat_value": "12,345"}
            ],
            "chart_ranges": [
                {"range": "24h"},
                {"range": "7d"},
                {"range": "30d"}
            ],
            "table_rows": [
                {
                    "time": "May 2024",
                    "peak": "12,345",
                    "gain": "+2,345",
                    "percent_gain": "+23%",
                    "average": "8,765",
                    "avg_gain": "+1,234",
                    "avg_percent_gain": "+16%",
                    "estimated_earnings": "$7,600"
                },
                {
                    "time": "April 2024",
                    "peak": "10,000",
                    "gain": "+3,000",
                    "percent_gain": "+43%",
                    "average": "7,531",
                    "avg_gain": "+2,101",
                    "avg_percent_gain": "+39%",
                    "estimated_earnings": "$5,900"
                },
                {
                    "time": "March 2024",
                    "peak": "7,000",
                    "gain": "+1,500",
                    "percent_gain": "+27%",
                    "average": "5,430",
                    "avg_gain": "+980",
                    "avg_percent_gain": "+22%",
                    "estimated_earnings": "$4,200"
                }
            ],
            "tooltip": "Interactive player count data"
        }
        
        # Return mock result
        print("Data extraction complete")
        return CrawlerResult(json.dumps([mock_data]))

# Synchronous wrapper for AsyncWebCrawler
class WebCrawler:
    def __init__(self, config=None):
        self.async_crawler = AsyncWebCrawler(config)
    
    def run(self, url, config=None):
        """Synchronous version of arun"""
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(self.async_crawler.arun(url, config)) 