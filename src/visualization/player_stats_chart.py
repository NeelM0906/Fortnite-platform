#!/usr/bin/env python3
"""
Player Stats Chart

Reads Fortnite island stats from result.txt, prints player stats, displays a formatted table, and shows an interactive Plotly chart.

Usage:
    python -m src.visualization.player_stats_chart
    # or import and call show_stats_and_chart('result.txt')

External dependencies: plotly, tabulate
"""
import json
import sys
import os

# Ensure Python can find the src module
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
sys.path.append(project_root)

# Now we can import from src.utils
from src.utils.common import get_output_dir, safe_load_json

try:
    import plotly.graph_objects as go
except ImportError:
    print("Plotly not installed. Install with: pip install plotly")
    sys.exit(1)

try:
    from tabulate import tabulate
    use_tabulate = True
except ImportError:
    use_tabulate = False

def safe_int(val):
    """
    Safely convert a string to int, handling commas, 'K', and invalid values.
    Args:
        val (str): Value to convert.
    Returns:
        int or None: Integer value or None if conversion fails.
    """
    if not val or val == '-':
        return None
    try:
        return int(val.replace(',', '').replace('K','000').split()[0])
    except Exception:
        return None

def show_stats_and_chart(result_file=None):
    """
    Prints player stats, shows table, and displays a Plotly chart from the given result file.
    Args:
        result_file (str): Path to the JSON file with extracted stats. If None, will check in output directory.
    """
    if result_file is None:
        # Use the output directory from common utilities
        output_dir = get_output_dir()
        result_file = os.path.join(output_dir, 'result.txt')
        if not os.path.exists(result_file):
            print(f"Error: result.txt not found in {output_dir}.")
            print("Run the scraper first with: python main.py [map_code]")
            sys.exit(1)
            
    # Use safe_load_json from common utilities
    data = safe_load_json(result_file)
    if data is None:
        sys.exit(1)
            
    # If data is a list, get the first item
    if isinstance(data, list):
        if len(data) == 0:
            print(f"No data found in {result_file}. The map code may be invalid or no data is available.")
            sys.exit(1)
        data = data[0]
        
    print('Player Stats:')
    for stat in data.get('player_stats', []):
        label = stat.get('stat_label', '').strip()
        value = stat.get('stat_value', '').strip()
        print(f'{label}: {value}')
        
    table = data.get('table_rows', [])
    if not table:
        print('No table_rows data to plot.')
        sys.exit(1)
        
    # Prepare data for table and chart
    rows = []
    times, peaks, avgs = [], [], []
    for row in table:
        t = row.get('time')
        p = safe_int(row.get('peak', ''))
        a = safe_int(row.get('average', ''))
        if t and p is not None:
            if a is None:
                a = 0  # Use 0 for missing average values
            rows.append([t, p, a])
            times.append(t)
            peaks.append(p)
            avgs.append(a)
            
    if not times:
        print('No valid numeric data to plot.')
        sys.exit(1)
        
    # Print table
    print('\nTable Data (used for chart):')
    headers = ['Time', 'Peak', 'Average']
    if use_tabulate:
        print(tabulate(rows, headers=headers, tablefmt='github'))
    else:
        print(f"{headers[0]:<20} {headers[1]:>10} {headers[2]:>10}")
        print('-'*42)
        for r in rows:
            print(f"{r[0]:<20} {r[1]:>10} {r[2]:>10}")
            
    # Plotly chart
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=times, y=peaks, mode='lines+markers', name='Peak'))
    fig.add_trace(go.Scatter(x=times, y=avgs, mode='lines+markers', name='Average'))
    fig.update_layout(title='Player Count Over Time', xaxis_title='Time', yaxis_title='Players', legend_title='Legend')
    fig.show()
    
    print("\nChart displayed successfully!")
    return data

if __name__ == '__main__':
    show_stats_and_chart() 