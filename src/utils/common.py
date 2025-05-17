"""
Common utility functions for the Fortnite Platform application.
"""

import os
import sys
import json

def ensure_directory_exists(directory_path):
    """
    Ensures that the specified directory exists, creating it if necessary.
    
    Args:
        directory_path (str): Path to the directory that should exist
    
    Returns:
        str: The absolute path to the directory
    """
    os.makedirs(directory_path, exist_ok=True)
    return os.path.abspath(directory_path)

def get_project_root():
    """
    Returns the absolute path to the project root directory.
    
    Returns:
        str: Absolute path to the project root
    """
    # Get the directory of this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up two levels to the project root (utils -> src -> root)
    return os.path.abspath(os.path.join(current_dir, "..", ".."))

def get_output_dir():
    """
    Returns the path to the output directory, creating it if necessary.
    
    Returns:
        str: Path to the output directory
    """
    output_dir = os.path.join(get_project_root(), "output")
    return ensure_directory_exists(output_dir)

def safe_load_json(file_path):
    """
    Safely loads JSON from a file with proper error handling.
    
    Args:
        file_path (str): Path to the JSON file
        
    Returns:
        dict or None: Loaded JSON data or None if loading failed
    """
    try:
        if not os.path.exists(file_path):
            print(f"Error: File not found: {file_path}")
            return None
            
        if os.path.getsize(file_path) == 0:
            print(f"Error: File is empty: {file_path}")
            return None
            
        with open(file_path, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Error: {file_path} contains invalid JSON")
        return None
    except Exception as e:
        print(f"Error loading JSON from {file_path}: {str(e)}")
        return None 