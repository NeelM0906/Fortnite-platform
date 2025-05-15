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

def run_python_scraper(map_code):
    """
    Runs the Python scraper for the given map code.
    Args:
        map_code (str): Fortnite map code.
    """
    print("\n=== Python Scraper Output ===")
    result = subprocess.run([sys.executable, 'player-data-scrap.py', map_code])
    if result.returncode != 0:
        print("Python scraper failed.")
        sys.exit(1)

def run_python_chart():
    """
    Runs the Python chart script to display stats and chart.
    """
    print("\n=== Python Chart Output ===")
    subprocess.run([sys.executable, 'player_stats_chart.py'])

def run_js_api(map_code):
    """
    Runs the JS API script for the given map code and prints its output.
    Args:
        map_code (str): Fortnite map code.
    """
    print("\n=== JS API Output ===")
    result = subprocess.run(['node', 'fortnite_island_data.js', map_code], capture_output=True, text=True)
    if result.returncode != 0:
        print("JS script failed.")
        sys.exit(1)
    print(result.stdout)

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
    run_python_scraper(map_code)
    run_python_chart()
    run_js_api(map_code)

if __name__ == '__main__':
    main() 