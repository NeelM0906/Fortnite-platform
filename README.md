# Fortnite Platform

A tool suite for fetching and visualizing Fortnite island statistics and data.

## Features

- Scrape player statistics from Fortnite islands
- Generate interactive charts and visualizations of player data
- Fetch island metadata via the Fortnite API
- Interactive dashboard for exploring island analytics

## Project Structure

```
Fortnite-platform/
├── src/
│   ├── scrapers/        # Web scrapers for collecting data
│   ├── visualization/   # Data visualization tools
│   ├── api/             # API clients and wrappers
│   └── utils/           # Shared utility functions
├── main.py              # Main application entry point
├── dashboard.py         # Streamlit dashboard for analytics
├── requirements.txt     # Python dependencies
└── package.json         # Node.js dependencies
```

## Setup

### Python Dependencies

```bash
pip install -r requirements.txt
```

### Node.js Dependencies

```bash
npm install
```

## Usage

### Command Line Interface

Run the main application with an optional map code:

```bash
python main.py <map_code>
```

If no map code is provided, a default one will be used.

### Interactive Dashboard

Launch the interactive dashboard to visualize island data:

```bash
streamlit run dashboard.py
```

This will open a web interface where you can enter island codes and explore the data visually. See [DASHBOARD.md](DASHBOARD.md) for detailed usage instructions.

## Output

The application will:

1. Scrape player data from the specified Fortnite island
2. Generate and display an interactive chart
3. Fetch and display additional island metadata

Output files will be saved to the `output/` directory. 