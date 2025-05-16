from setuptools import setup, find_packages

setup(
    name="crawl4ai",
    version="1.0.0",
    packages=find_packages(),
    description="A simple web crawler and data extraction tool",
    author="Fortnite-Platform Team",
    author_email="dev@fortniteplatform.com",
    install_requires=[
        "aiohttp",
        "asyncio",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
) 