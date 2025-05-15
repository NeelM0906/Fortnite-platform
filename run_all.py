#!/usr/bin/env python3
import subprocess
import sys
import os

# --- Unified Entrypoint for Fortnite Map Stats ---
def main():
    if len(sys.argv) > 1:
        map_code = sys.argv[1]
    else:
        map_code = input("Enter Fortnite map code (e.g. 6155-1398-4059): ").strip()
    if not map_code:
        print("No map code provided. Exiting.")
        return
    # Run the scraper for the given map code
    print(f"Scraping stats for map code: {map_code}")
    result = subprocess.run([sys.executable, 'player-data-scrap.py', map_code])
    if result.returncode != 0:
        print("Scraper failed. Exiting.")
        return
    # Check if result.txt exists and is not empty
    if not os.path.exists('result.txt') or os.path.getsize('result.txt') == 0:
        print("No result.txt produced. Exiting.")
        return
    # Show stats and chart
    subprocess.run([sys.executable, 'player_stats_chart.py'])

if __name__ == '__main__':
    main() 