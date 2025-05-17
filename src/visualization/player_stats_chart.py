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

def clean_time_label(time_str):
    """
    Clean and simplify time labels to avoid overlap in charts.
    
    Args:
        time_str (str): Time string in format like "20:00 - 21:00"
        
    Returns:
        str: Simplified time label
    """
    if not time_str or time_str == "":
        return "Total"
        
    # Extract just the starting hour for a cleaner display
    if " - " in time_str:
        start_time = time_str.split(" - ")[0]
        if ":" in start_time:
            # Convert 24h format to more readable format
            hour = int(start_time.split(":")[0])
            if hour == 0:
                return "12 AM"
            elif hour < 12:
                return f"{hour} AM"
            elif hour == 12:
                return "12 PM"
            else:
                return f"{hour-12} PM"
        return start_time
    return time_str

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
            
    # Create clean time labels for the x-axis
    cleaned_times = [clean_time_label(t) for t in times]
    
    # Plotly chart with improved layout
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=cleaned_times, y=peaks, mode='lines+markers', name='Peak', marker=dict(size=8)))
    fig.add_trace(go.Scatter(x=cleaned_times, y=avgs, mode='lines+markers', name='Average', marker=dict(size=8)))
    
    # Improve chart layout to avoid overlapping
    fig.update_layout(
        title='Player Count Over Time',
        xaxis_title='Time (Hour)',
        yaxis_title='Players',
        legend_title='Legend',
        # Ensure there's enough space for labels and they're readable
        margin=dict(l=50, r=50, t=50, b=100),
        # Improve readability of x-axis labels
        xaxis=dict(
            tickangle=-45,
            tickmode='array',
            tickvals=cleaned_times,
            ticktext=cleaned_times
        )
    )
    
    # Adjust tick density based on number of data points
    if len(cleaned_times) > 12:
        # Only show every other time label if there are many
        fig.update_layout(
            xaxis=dict(
                tickangle=-45,
                tickmode='array',
                tickvals=cleaned_times[::2],  # Show every other label
                ticktext=cleaned_times[::2]
            )
        )
    
    fig.show()
    
    print("\nChart displayed successfully!")
    return data

if __name__ == '__main__':
    show_stats_and_chart() 