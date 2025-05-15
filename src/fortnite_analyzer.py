#!/usr/bin/env python3
"""
Unified Entrypoint for Fortnite Map Stats

Runs the Python scraper, chart, and JS API for a given Fortnite map code.

Usage:
    python -m src.fortnite_analyzer <map_code>
    # or just
    python -m src.fortnite_analyzer
    # (then enter the code when prompted)

External dependencies: Python 3, Node.js, crawl4ai, plotly, tabulate, fortnite-api-io (npm)
"""
import subprocess
import sys
import os
import json
from pathlib import Path

# Internal module imports
from src.scrapers.island_scraper import crawl_and_extract_island_data
from src.utils.chart_utils import show_stats_and_chart
from src.utils.prediction_utils import generate_predictions

def run_python_scraper(map_code):
    """
    Runs the Python scraper for the given map code.
    Args:
        map_code (str): Fortnite map code.
    """
    print("\n=== Scraping Data ===")
    output_path = f"output/result.txt"
    
    # Ensure output directory exists
    os.makedirs("output", exist_ok=True)
    
    # Run the scraper directly from the imported module
    print(f"Scraping data for map code: {map_code}")
    crawl_and_extract_island_data(map_code, output_path)
    
    print("Data scraping completed")
    return output_path

def run_python_chart(result_file="output/result.txt"):
    """
    Runs the Python chart script to display stats and chart.
    """
    print("\n=== Generating Chart ===")
    show_stats_and_chart(result_file)

def run_js_api(map_code):
    """
    Runs the JS API script for the given map code and prints its output.
    Args:
        map_code (str): Fortnite map code.
    """
    print("\n=== Fetching API Data ===")
    script_path = os.path.join("src", "api", "fortnite_api.js")
    
    # Check if the script exists
    if not os.path.exists(script_path):
        print(f"Error: JS API script not found at {script_path}")
        return
    
    print(f"Running JS API script for map code: {map_code}")
    result = subprocess.run(['node', script_path, map_code], capture_output=True, text=True)
    if result.returncode != 0:
        print("JS script failed.")
        print(result.stderr)
        return
    
    print(result.stdout)
    return result.stdout

def run_predictions(result_file="output/result.txt", output_file="output/predictions.json"):
    """
    Runs the prediction script to generate forecasts.
    """
    print("\n=== Generating Predictions ===")
    
    # Ensure result file exists
    if not os.path.exists(result_file):
        print(f"Error: Result file not found at {result_file}")
        return
    
    # Read the data
    with open(result_file, "r") as f:
        data = json.load(f)
    
    # Generate predictions using the imported module
    print(f"Generating predictions based on data from {result_file}")
    predictions = generate_predictions(data)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Save predictions
    with open(output_file, "w") as f:
        json.dump(predictions, f, indent=2)
    
    print(f"Predictions saved to {output_file}")
    return predictions

def main():
    """
    Entrypoint: runs all scripts for a given Fortnite map code.
    """
    if len(sys.argv) > 1:
        map_code = sys.argv[1]
    else:
        map_code = input("Enter Fortnite map code: ").strip()
    if not map_code:
        print("No map code provided. Exiting.")
        return
    
    # Run all steps
    result_file = run_python_scraper(map_code)
    run_python_chart(result_file)
    run_js_api(map_code)
    run_predictions(result_file)
    
    print("\nFortnite Island Analysis completed successfully!")

if __name__ == '__main__':
    main() 