#!/usr/bin/env python3
"""
Unified Entrypoint for Fortnite Map Stats

Runs the Python scraper, chart, and JS API for a given Fortnite map code.

Usage:
    python main.py <map_code>
    # or just
    python main.py
    # (then enter the code when prompted)

External dependencies: Python 3, Node.js, crawl4ai, plotly, tabulate, fortnite-api-io (npm)
"""
import subprocess
import sys
import os
import json
from datetime import datetime

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

# Default map code to use if none is provided
DEFAULT_MAP_CODE = "1865-4829-7018"  # This is one of the default codes from the JS script

# Ensure Python can find the src module
sys.path.append(PROJECT_ROOT)

# Import common utilities
from src.utils.common import get_output_dir, safe_load_json

def run_python_scraper(map_code):
    """
    Runs the Python scraper for the given map code.
    Args:
        map_code (str): Fortnite map code.
    Returns:
        dict: The scraped data if successful.
    """
    print("\n=== Python Scraper Output ===")
    script_path = os.path.join(PROJECT_ROOT, 'src', 'scrapers', 'player_data_scraper.py')
    result = subprocess.run([sys.executable, script_path, map_code], capture_output=True, text=True)
    print(result.stdout)
    
    if result.stderr:
        print("Error output:", result.stderr)
        
    if result.returncode != 0:
        print("Python scraper failed with exit code:", result.returncode)
        sys.exit(1)
    
    # Verify that the output file was created
    output_path = os.path.join(get_output_dir(), 'result.txt')
    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        print(f"Error: Output file {output_path} was not created or is empty.")
        sys.exit(1)
    
    print(f"Scraper completed successfully. Data saved to {output_path}")
    
    # Load the data from the file
    return safe_load_json(output_path)

def run_python_chart():
    """
    Runs the Python chart script to display stats and chart.
    Returns:
        dict: The data used for chart generation.
    """
    print("\n=== Python Chart Output ===")
    script_path = os.path.join(PROJECT_ROOT, 'src', 'visualization', 'player_stats_chart.py')
    result = subprocess.run([sys.executable, script_path], capture_output=True, text=True)
    print(result.stdout)
    
    if result.stderr:
        print("Error output:", result.stderr)
        
    if result.returncode != 0:
        print("Python chart generation failed with exit code:", result.returncode)
        sys.exit(1)
    
    print("Chart generation completed successfully.")
    
    # The chart is based on the result.txt file, so the data is already returned by run_python_scraper

def run_js_api(map_code):
    """
    Runs the JS API script for the given map code and prints its output.
    Args:
        map_code (str): Fortnite map code.
    Returns:
        dict: The API data if successful, None otherwise.
    """
    print("\n=== JS API Output ===")
    script_path = os.path.join(PROJECT_ROOT, 'src', 'api', 'fortnite_island_data.js')
    
    # Create a new environment with the NODE_PATH set to include the node_modules
    env = os.environ.copy()
    
    # Check if node_modules exists; add proper NODE_PATH if it does
    node_modules_path = os.path.join(PROJECT_ROOT, 'node_modules')
    if os.path.exists(node_modules_path):
        if 'NODE_PATH' in env:
            env['NODE_PATH'] = f"{env['NODE_PATH']}:{node_modules_path}"
        else:
            env['NODE_PATH'] = node_modules_path
    
    try:
        result = subprocess.run(['node', script_path, map_code], 
                            capture_output=True, text=True, env=env)
        
        print(result.stdout)
        
        if result.stderr:
            print("Error output:", result.stderr)
            
        if result.returncode != 0:
            print(f"JS script failed with exit code: {result.returncode}")
            return None
        else:
            print("JS API call completed successfully.")
            
            # Try to parse the JSON output from the JS script
            try:
                # Extract only the JSON part from the output
                stdout_lines = result.stdout.splitlines()
                json_lines = []
                for line in stdout_lines:
                    if line.strip().startswith('{') or line.strip().endswith('}'):
                        json_lines.append(line)
                    elif 'Fortnite Island Data Fetcher' in line:
                        # Skip this line and similar non-JSON lines
                        continue
                    elif line.strip():  # If not empty
                        json_lines.append(line)
                        
                json_str = '\n'.join(json_lines)
                return json.loads(json_str)
            except json.JSONDecodeError as e:
                print(f"Warning: Could not parse JSON output from JS API: {e}")
                print(f"Raw output: {result.stdout}")
                return None
    except Exception as e:
        print(f"Error running JS API: {str(e)}")
        return None

def save_consolidated_data(map_code, scraped_data, api_data):
    """
    Saves all collected data to a consolidated JSON file.
    
    Args:
        map_code (str): The Fortnite map code analyzed
        scraped_data (dict): Data from the web scraper
        api_data (dict): Data from the Fortnite API
        
    Returns:
        str: Path to the saved JSON file
    """
    # Create a timestamp for the filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Prepare the consolidated data
    consolidated_data = {
        "map_code": map_code,
        "timestamp": timestamp,
        "scraped_data": scraped_data,
        "api_data": api_data
    }
    
    # Save to a JSON file
    output_dir = get_output_dir()
    output_file = f"fortnite_data_{map_code}_{timestamp}.json"
    output_path = os.path.join(output_dir, output_file)
    
    with open(output_path, 'w') as f:
        json.dump(consolidated_data, f, indent=2)
    
    return output_path

def main():
    """
    Entrypoint: runs all scripts for a given Fortnite map code.
    """
    # Ensure output directory exists
    output_dir = get_output_dir()
    
    if len(sys.argv) > 1:
        map_code = sys.argv[1]
    else:
        map_code = input(f"Enter Fortnite map code (default: {DEFAULT_MAP_CODE}): ").strip()
        if not map_code:
            map_code = DEFAULT_MAP_CODE
            print(f"Using default map code: {map_code}")
    
    try:
        # Run all components and collect their data
        scraped_data = run_python_scraper(map_code)
        run_python_chart()  # This uses the same data as the scraper
        api_data = run_js_api(map_code)
        
        # Save consolidated data to JSON
        json_path = save_consolidated_data(map_code, scraped_data, api_data)
        print(f"\nConsolidated data saved to: {json_path}")
        
        print("\n=== All processes completed ===")
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main() 