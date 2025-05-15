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
    try:
        return int(val.replace(',', '').replace('K','000').split()[0])
    except Exception:
        return None

def show_stats_and_chart(result_file='result.txt'):
    """
    Prints player stats, shows table, and displays a Plotly chart from the given result file.
    Args:
        result_file (str): Path to the JSON file with extracted stats.
    """
    with open(result_file) as f:
        data = json.load(f)
    if isinstance(data, list):
        data = data[0]
    print('Player Stats:')
    for stat in data.get('player_stats', []):
        label = stat.get('stat_label', '').strip()
        value = stat.get('stat_value', '').strip()
        print(f'{label}: {value}')
    table = data.get('table_rows', [])
    if not table:
        print('No table_rows data to plot.')
        return
    # Prepare data for table and chart
    rows = []
    times, peaks, avgs = [], [], []
    for row in table:
        t = row.get('time')
        p = safe_int(row.get('peak', ''))
        a = safe_int(row.get('average', ''))
        if t and p is not None and a is not None:
            rows.append([t, p, a])
            times.append(t)
            peaks.append(p)
            avgs.append(a)
    if not times:
        print('No valid numeric data to plot.')
        return
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

if __name__ == '__main__':
    show_stats_and_chart() 