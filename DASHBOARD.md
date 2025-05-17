# Fortnite Island Analytics Dashboard

A beautiful, interactive dashboard for visualizing Fortnite island statistics.

![Dashboard Screenshot](https://via.placeholder.com/800x450.png?text=Fortnite+Island+Analytics+Dashboard)

## Features

- **Island Analysis**: Analyze any Fortnite island by entering its map code
- **Interactive Charts**: Visualize player counts, trends, and engagement metrics
- **Historical Data**: View previous analyses and compare islands
- **Island Information**: See island details, creator information, and metadata

## Getting Started

### Prerequisites

Make sure you have the following installed:
- Python 3.8+
- Required packages:
  - streamlit
  - plotly
  - pandas
  - All packages in requirements.txt

### Installation

1. Clone the repository (if you haven't already)
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Dashboard

From the project root directory, run:

```bash
streamlit run dashboard.py
```

The dashboard will open in your default web browser at http://localhost:8501

## Usage Guide

### Analyzing a New Island

1. Select "Analyze New Island" in the sidebar
2. Enter a valid Fortnite island map code (e.g., 1865-4829-7018)
3. Click "Analyze Island"
4. Wait for the analysis to complete (this may take a minute)
5. Explore the results in the dashboard

### Viewing Existing Analyses

1. Select "View Existing Analysis" in the sidebar
2. Click on any of the previously analyzed islands
3. The dashboard will load the saved analysis data

### Understanding the Results

The dashboard has two main tabs:

1. **Island Overview**
   - General information about the island
   - Creator details
   - Island description and tags

2. **Player Analytics**
   - Key player statistics
   - Player count trends over time
   - Peak vs average player comparisons
   - Raw data table for deeper analysis

## Troubleshooting

### Common Issues

- **Analysis Fails**: Ensure you've entered a valid island code
- **Missing Data**: Some islands may have limited or no data available
- **Charts Not Displaying**: Check your internet connection as Plotly requires internet access

### Getting Help

If you encounter any issues, please:
1. Check the console output for error messages
2. Make sure all dependencies are properly installed
3. Verify that the island code is correct and active

## Contributing

Contributions to improve the dashboard are welcome! Please feel free to submit pull requests or open issues for any bugs or feature requests. 