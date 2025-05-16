#!/usr/bin/env python3
"""
Unified Entrypoint for Fortnite Map Stats

Runs the Python scraper, chart, and JS API for a given Fortnite map code.

Usage:
    python run_all_combined.py <map_code>
    # or just
    python run_all_combined.py
    # (then enter the code when prompted)

External dependencies: Python 3, Node.js, crawl4ai, plotly, tabulate, fortnite-api-io (npm)
"""
import subprocess
import sys
import os

# Get the directory of the current script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Default map code to use if none is provided
DEFAULT_MAP_CODE = "1865-4829-7018"  # This is one of the default codes from the JS script

def run_python_scraper(map_code):
    """
    Runs the Python scraper for the given map code.
    Args:
        map_code (str): Fortnite map code.
    """
    print("\n=== Python Scraper Output ===")
    script_path = os.path.join(SCRIPT_DIR, 'player-data-scrap.py')
    result = subprocess.run([sys.executable, script_path, map_code])
    if result.returncode != 0:
        print("Python scraper failed.")
        sys.exit(1)

def run_python_chart():
    """
    Runs the Python chart script to display stats and chart.
    """
    print("\n=== Python Chart Output ===")
    script_path = os.path.join(SCRIPT_DIR, 'player_stats_chart.py')
    subprocess.run([sys.executable, script_path])

def run_js_api(map_code):
    """
    Runs the JS API script for the given map code and prints its output.
    Args:
        map_code (str): Fortnite map code.
    """
    print("\n=== JS API Output ===")
    script_path = os.path.join(SCRIPT_DIR, 'fortnite_island_data.js')
    # Create a new environment with the NODE_PATH set to include the node_modules
    env = os.environ.copy()
    
    result = subprocess.run(['node', script_path, map_code], capture_output=True, text=True, env=env)
    if result.returncode != 0:
        print(f"JS script failed with error: {result.stderr}")
        return
    print(result.stdout)

def main():
    """
    Entrypoint: runs all scripts for a given Fortnite map code.
    """
    # Change to the script directory to ensure relative paths work
    os.chdir(SCRIPT_DIR)
    
    if len(sys.argv) > 1:
        map_code = sys.argv[1]
    else:
        map_code = input(f"Enter Fortnite map code (default: {DEFAULT_MAP_CODE}): ").strip()
        if not map_code:
            map_code = DEFAULT_MAP_CODE
            print(f"Using default map code: {map_code}")
    
    run_python_scraper(map_code)
    run_python_chart()
    run_js_api(map_code)

if __name__ == '__main__':
    main() 