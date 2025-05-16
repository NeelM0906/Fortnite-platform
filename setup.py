"""
Setup script for the Fortnite Island Analyzer package.
"""
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as f:
    requirements = f.read().splitlines()

setup(
    name="fortnite-island-analyzer",
    version="0.1.0",
    author="Fortnite Analyzer Team",
    author_email="info@example.com",
    description="Tools for analyzing Fortnite Creative Island data",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/fortnite-island-analyzer",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "fortnite-analyzer=src.fortnite_analyzer:main",
            "fortnite-scraper=player-data-scrap:main",
            "fortnite-chart=player_stats_chart:show_stats_and_chart",
        ],
    },
    include_package_data=True,
) 