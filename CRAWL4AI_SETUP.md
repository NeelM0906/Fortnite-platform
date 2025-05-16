# Crawl4AI Setup Guide

This guide explains how to properly set up and configure Crawl4AI, which is a dependency used in this project's web scraping components. If you're experiencing the import error `ModuleNotFoundError: No module named 'crawl4ai'`, follow these steps to fix it.

## Installation Steps

### 1. Basic Installation 

First, install the core crawl4ai package:

```bash
# Install the package
pip install -U crawl4ai

# For pre-release versions if needed
# pip install crawl4ai --pre
```

### 2. Run Post-Installation Setup

After installing, you must run the setup command to install the required browser components:

```bash
# Run post-installation setup to install browsers
crawl4ai-setup
```

This step:
- Installs or updates required Playwright browsers (Chromium, Firefox, etc.)
- Performs OS-level checks
- Confirms your environment is ready to crawl

### 3. Optional Diagnostics

If you encounter any issues, run the diagnostics tool:

```bash
# Verify your installation
crawl4ai-doctor
```

### 4. Alternative Manual Browser Installation

If you encounter browser-related issues, you can manually install the required browser:

```bash
# Manually install the Chromium browser
python -m playwright install --with-deps chromium
```

## Development Environment Configuration

For development environments, you can install the package in editable mode:

```bash
# Within the project directory
pip install -e .
```

## Path Resolution Issues

If your Python environment has difficulty finding the crawl4ai module, you can modify the code to add path handling logic. This is already implemented in our project files to handle path issues.

For example, in `player-data-scrap.py`, we have the following path resolution logic:

```python
# Fix Python path to find system packages if needed
try:
    import crawl4ai
except ImportError:
    # Try to add the potential system Python path
    python_version = '.'.join(map(str, sys.version_info[:2]))
    potential_paths = [
        # Add paths where crawl4ai might be installed
        os.path.expanduser(f'~/.pyenv/versions/{sys.version.split()[0]}/lib/python{python_version}/site-packages'),
        os.path.expanduser(f'~/Library/Python/{python_version}/lib/python/site-packages'),
        os.path.expanduser(f'~/anaconda3/lib/python{python_version}/site-packages'),
        os.path.expanduser(f'~/opt/anaconda3/lib/python{python_version}/site-packages'),
        os.path.expanduser(f'~/miniconda3/lib/python{python_version}/site-packages'),
        '/usr/local/lib/python{python_version}/site-packages',
        '/usr/lib/python{python_version}/site-packages',
    ]
    
    for path in potential_paths:
        if os.path.exists(path):
            sys.path.insert(0, path)
            print(f"Added potential path: {path}")
            break
```

## Running Scripts

After installing Crawl4AI and its dependencies, you can run the scripts:

```bash
# Run the combined script
python run_all_combined.py

# Or each script individually
python player-data-scrap.py <map_code>
python player_stats_chart.py
```

## Troubleshooting

### 1. Import Errors

If you still get `ModuleNotFoundError: No module named 'crawl4ai'`:

- Check that you've installed the package correctly
- Ensure you're using the same Python environment where the package was installed
- Try installing with pip in a development mode: `pip install -e .`

### 2. Browser Installation Issues

If you encounter browser installation issues:
- Try the manual browser installation command
- Make sure you have adequate permissions to install browser components
- On Linux, you might need additional dependencies like `apt-get install libx11-xcb1 libxcb-dri3-0`

### 3. Path Issues

If you know the module is installed but Python can't find it:
- Check your PYTHONPATH environment variable
- Ensure your virtual environment is activated, if you're using one
- Try the workaround in the "Path Resolution Issues" section above

## Resources

- [Crawl4AI Documentation](https://docs.crawl4ai.com)
- [Playwright Documentation](https://playwright.dev/python/docs/intro)

# crawl4ai Setup Instructions

The crawl4ai module is a specialized web scraping tool required for fetching live Fortnite player stats. Without this module, the application will use mock data instead of real-time information.

## Installation Options

### Option 1: Install from GitHub (Recommended)

```bash
# Activate your virtual environment first
source venv/bin/activate

# Install the package directly from the GitHub repository
pip install git+https://github.com/fortnite-tools/crawl4ai.git
```

### Option 2: Manual Installation

If you have received the source code for crawl4ai:

1. Unzip/extract the package to a directory named `crawl4ai` in the Fortnite-platform directory
2. Install it as a development package:

```bash
# Activate your virtual environment first
source venv/bin/activate

# Install in development mode
pip install -e ./crawl4ai
```

### Option 3: Contact the Development Team

If you're unable to install the package using the above methods, please contact the development team for assistance.

## Verifying Installation

To verify that crawl4ai is installed correctly:

```bash
# Activate your virtual environment
source venv/bin/activate

# Check if the package is importable
python -c "import crawl4ai; print('crawl4ai is installed correctly')"
```

If you don't see any errors, the package is installed correctly.

## Troubleshooting

If you encounter issues with installation:

1. Ensure you have the latest version of pip: `pip install --upgrade pip`
2. Make sure your Python environment has the required dependencies:
   ```bash
   pip install requests beautifulsoup4 pandas aiohttp
   ```
3. Check for any error messages during installation and search for solutions online.

## Alternative: Using Mock Data

If you're unable to install crawl4ai, the application will automatically use mock data. While this won't provide real-time information, it allows you to test and use all features of the application. 