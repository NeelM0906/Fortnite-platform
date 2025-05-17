"""
API clients for interacting with Fortnite-related services.
"""

import os
import json
import sys
import subprocess

# Ensure Python can find the src module
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
sys.path.append(project_root)

# Now we can import from src.utils
from src.utils.common import get_project_root

def get_island_data(map_code):
    """
    Get Fortnite island data using the JavaScript API client.
    
    Args:
        map_code (str): The Fortnite map code to fetch data for
        
    Returns:
        dict or None: The island data if successful, None otherwise
    """
    try:
        script_path = os.path.join(get_project_root(), 'src', 'api', 'fortnite_island_data.js')
        result = subprocess.run(['node', script_path, map_code], 
                               capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Error fetching island data: {result.stderr}")
            return None
            
        # Try to parse the output as JSON
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            print(f"Error parsing JSON response: {result.stdout}")
            return None
            
    except Exception as e:
        print(f"Error running fortnite_island_data.js: {str(e)}")
        return None 