"""
Fortnite Island API Client

A Python client for the Fortnite API to fetch island data.

Usage as module:
    from src.api.fortnite_api import FortniteIslandAPI
    api = FortniteIslandAPI()
    island_data = api.get_island_data('6155-1398-4059')
    print(island_data)

Usage as script:
    python -m src.api.fortnite_api <map_code>
"""

import os
import sys
import json
import time
import requests
from typing import Dict, List, Any, Optional, Union
from pathlib import Path
from datetime import datetime

# Default API key - replace with your own or use environment variable
DEFAULT_API_KEY = os.environ.get('FORTNITE_API_KEY', '4d5a18a0-bd9041ee-2a022a7f-4381fc6c')


class FortniteIslandAPI:
    """
    Client for the Fortnite API to fetch island data.
    """
    
    BASE_URL = "https://fortniteapi.io/v1/creative/island"
    FEATURED_URL = "https://fortniteapi.io/v1/creative/featured"
    
    def __init__(self, api_key: Optional[str] = None, language: str = 'en'):
        """
        Initialize the API client.
        
        Args:
            api_key: API key for fortniteapi.io (defaults to env var or hardcoded key)
            language: Language code for responses
        """
        self.api_key = api_key or DEFAULT_API_KEY
        self.language = language
        self.headers = {
            'Authorization': self.api_key,
            'Accept-Language': self.language
        }
    
    def get_island_data(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Fetch data for a specific Fortnite Creative Island by code.
        
        Args:
            code: The island code (e.g., "1234-5678-9012")
            
        Returns:
            Island data or None if not found/error
        """
        if not code or not isinstance(code, str):
            print(f"Error: Invalid island code: {code}")
            return None
        
        try:
            url = f"{self.BASE_URL}?code={code}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            if data.get('result') is True and data.get('island'):
                island = data['island']
                # Return only the relevant fields
                return {
                    'code': island.get('code'),
                    'title': island.get('title'),
                    'description': island.get('description'),
                    'creator': island.get('creator'),
                    'creatorCode': island.get('creatorCode'),
                    'publishedDate': island.get('publishedDate'),
                    'tags': island.get('tags', []),
                    'version': island.get('latestVersion')
                }
            else:
                print(f"Island not found or unexpected API response for code {code}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching island data for code {code}: {e}")
            return None
    
    def get_featured_islands(self) -> List[Dict[str, Any]]:
        """
        Fetch featured Fortnite Creative Islands.
        
        Returns:
            List of featured islands or empty list if error
        """
        try:
            response = requests.get(self.FEATURED_URL, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            if data.get('result') is True and data.get('islands'):
                return data['islands']
            else:
                print("Failed to fetch featured islands")
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching featured islands: {e}")
            return []
    
    def process_island_codes(self, codes: List[str]) -> Dict[str, Optional[Dict[str, Any]]]:
        """
        Process multiple island codes and fetch data for each.
        
        Args:
            codes: List of island codes to process
            
        Returns:
            Dictionary mapping codes to their data
        """
        if not isinstance(codes, list) or not all(isinstance(code, str) for code in codes):
            print("Error: Invalid list of island codes")
            return {}
        
        results = {}
        for code in codes:
            results[code] = self.get_island_data(code)
            # Add a small delay to avoid rate limiting
            time.sleep(0.5)
        
        return results
    
    def save_results_to_file(self, results: Dict[str, Any], filename: Optional[str] = None) -> str:
        """
        Save API results to a JSON file.
        
        Args:
            results: Data to save
            filename: Optional filename, defaults to timestamped file
            
        Returns:
            Path to the saved file
        """
        output_dir = Path("output")
        output_dir.mkdir(exist_ok=True)
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"fortnite_islands_{timestamp}.json"
        
        output_path = output_dir / filename
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        return str(output_path)


def main():
    """
    Main function when run as a script.
    """
    # Get island codes from command line arguments or use defaults
    if len(sys.argv) > 1:
        island_codes = sys.argv[1:]
    else:
        print("No island codes provided. Using default examples.")
        island_codes = [
            "1865-4829-7018",
            "9683-4582-8184",
            "6531-4403-0726"
        ]
    
    # Initialize API client
    api = FortniteIslandAPI()
    
    # Process codes
    results = api.process_island_codes(island_codes)
    
    # Save results
    output_path = api.save_results_to_file(results)
    print(f"Results saved to {output_path}")
    
    # Print results to console
    if len(island_codes) == 1:
        code = island_codes[0]
        print(json.dumps(results[code], indent=2))
    else:
        print(f"Processed {len(island_codes)} island codes.")
    
    return 0


if __name__ == "__main__":
    sys.exit(main()) 