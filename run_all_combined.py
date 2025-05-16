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
    result = subprocess.run([sys.executable, script_path, map_code], capture_output=True, text=True)
    print(result.stdout)
    
    if result.stderr:
        print("Error output:", result.stderr)
        
    if result.returncode != 0:
        print("Python scraper failed with exit code:", result.returncode)
        sys.exit(1)
    
    # Verify that the output file was created
    output_path = os.path.join(SCRIPT_DIR, 'output', 'result.txt')
    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        print(f"Error: Output file {output_path} was not created or is empty.")
        sys.exit(1)
    
    print(f"Scraper completed successfully. Data saved to {output_path}")

def run_python_chart():
    """
    Runs the Python chart script to display stats and chart.
    """
    print("\n=== Python Chart Output ===")
    script_path = os.path.join(SCRIPT_DIR, 'player_stats_chart.py')
    result = subprocess.run([sys.executable, script_path], capture_output=True, text=True)
    print(result.stdout)
    
    if result.stderr:
        print("Error output:", result.stderr)
        
    if result.returncode != 0:
        print("Python chart generation failed with exit code:", result.returncode)
        sys.exit(1)
    
    print("Chart generation completed successfully.")

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
    
    result = subprocess.run(['node', script_path, map_code], 
                            capture_output=True, text=True, env=env)
    print(result.stdout)
    
    if result.stderr:
        print("Error output:", result.stderr)
        
    if result.returncode != 0:
        print(f"JS script failed with exit code: {result.returncode}")
        # Don't exit here, as this is optional
    else:
        print("JS API call completed successfully.")

def main():
    """
    Entrypoint: runs all scripts for a given Fortnite map code.
    """
    # Change to the script directory to ensure relative paths work
    os.chdir(SCRIPT_DIR)
    
    # Ensure output directory exists
    output_dir = os.path.join(SCRIPT_DIR, 'output')
    os.makedirs(output_dir, exist_ok=True)
    
    if len(sys.argv) > 1:
        map_code = sys.argv[1]
    else:
        map_code = input(f"Enter Fortnite map code (default: {DEFAULT_MAP_CODE}): ").strip()
        if not map_code:
            map_code = DEFAULT_MAP_CODE
            print(f"Using default map code: {map_code}")
    
    try:
        run_python_scraper(map_code)
        run_python_chart()
        run_js_api(map_code)
        print("\n=== All processes completed ===")
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main() 