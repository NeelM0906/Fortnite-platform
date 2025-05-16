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