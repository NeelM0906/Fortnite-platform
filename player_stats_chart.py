#!/usr/bin/env python3
"""
Player Stats Chart

Reads Fortnite island stats from result.txt, prints player stats, displays a formatted table, and shows an interactive Plotly chart.

Usage:
    python player_stats_chart.py
    # or import and call show_stats_and_chart('result.txt')

External dependencies: plotly, tabulate
"""
import json
import sys
import os

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
        # Check in both current directory and output directory
        if os.path.exists('result.txt'):
            result_file = 'result.txt'
        elif os.path.exists(os.path.join('output', 'result.txt')):
            result_file = os.path.join('output', 'result.txt')
        else:
            print("Error: result.txt not found in current directory or output directory.")
            print("Run the scraper first with: python player-data-scrap.py [map_code]")
            sys.exit(1)
            
    try:
        # Check if file exists and has content
        if not os.path.exists(result_file) or os.path.getsize(result_file) == 0:
            print(f"Error: {result_file} is empty or does not exist.")
            sys.exit(1)
        
        with open(result_file) as f:
            data = json.load(f)
        
        # Check if data is empty
        if not data:
            print(f"No data found in {result_file}. The map code may be invalid or no data is available.")
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
        
    except json.JSONDecodeError:
        print(f"Error: {result_file} does not contain valid JSON data.")
        sys.exit(1)
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    show_stats_and_chart() 