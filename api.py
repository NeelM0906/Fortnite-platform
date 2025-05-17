#!/usr/bin/env python3
"""
Fortnite Platform API

A Flask API service that extracts the data scraping and gathering logic from dashboard.py
to provide the data in JSON format.

Usage:
    flask run
    # or
    python api.py

Endpoints:
    GET /api/analyze/<map_code> - Run analysis on a Fortnite map code
    GET /api/analyses - Get list of existing analyses
    GET /api/analysis/<map_code> - Get specific analysis data
"""
import os
import sys
import json
import subprocess
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import logging
import socket

# Import common utilities for accessing project paths
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from src.utils.common import get_output_dir, safe_load_json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

def find_available_port(start_port=5003, max_attempts=10):
    """Find an available port starting from start_port"""
    port = start_port
    for _ in range(max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('localhost', port))
                return port
            except OSError:
                port += 1
    raise RuntimeError(f"Could not find an available port after {max_attempts} attempts")

def run_analysis(map_code):
    """
    Run the main.py script to analyze the given map code and return the path to the output JSON file.
    
    Args:
        map_code (str): The Fortnite island code to analyze
        
    Returns:
        str: Path to the output JSON file or None if analysis failed
    """
    logger.info(f"Running analysis for map code: {map_code}")
    try:
        result = subprocess.run(
            [sys.executable, "main.py", map_code], 
            capture_output=True, 
            text=True
        )
        
        # Extract the JSON path from the output
        output_lines = result.stdout.splitlines()
        json_path_line = [line for line in output_lines if "Consolidated data saved to" in line][0]
        json_path = json_path_line.split(": ")[1].strip()
        logger.info(f"Analysis complete. Output saved to: {json_path}")
        return json_path
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        logger.error(f"Subprocess stdout: {result.stdout}")
        logger.error(f"Subprocess stderr: {result.stderr}")
        return None

def load_existing_data():
    """
    Load existing analysis files from the output directory
    
    Returns:
        list: List of tuples containing (filename, path, timestamp, map_code)
    """
    output_dir = get_output_dir()
    files = []
    
    if not os.path.exists(output_dir):
        return files
        
    for file in os.listdir(output_dir):
        if file.startswith("fortnite_data_") and file.endswith(".json"):
            try:
                parts = file.replace("fortnite_data_", "").replace(".json", "").split("_")
                map_code = parts[0]
                timestamp = "_".join(parts[1:])
                filepath = os.path.join(output_dir, file)
                
                # Try to parse timestamp
                try:
                    dt = datetime.strptime(timestamp, "%Y%m%d_%H%M%S")
                    formatted_time = dt.strftime("%Y-%m-%d %H:%M:%S")
                except:
                    formatted_time = timestamp
                    
                files.append((file, filepath, formatted_time, map_code))
            except:
                # Skip files that don't match expected pattern
                continue
                
    # Sort by timestamp (newest first)
    return sorted(files, key=lambda x: x[0], reverse=True)

@app.route('/api/analyze/<map_code>', methods=['GET'])
def analyze(map_code):
    """API endpoint to analyze a Fortnite map code"""
    if not map_code or not map_code.strip():
        return jsonify({"error": "Map code is required"}), 400
    
    # Run the analysis
    json_path = run_analysis(map_code.strip())
    
    if not json_path or not os.path.exists(json_path):
        return jsonify({"error": "Analysis failed"}), 500
    
    # Load the data from the JSON file
    data = safe_load_json(json_path)
    
    if not data:
        return jsonify({"error": "Failed to load analysis data"}), 500
    
    return jsonify(data)

@app.route('/api/analyses', methods=['GET'])
def get_analyses():
    """API endpoint to list all existing analyses"""
    analyses = load_existing_data()
    
    # Convert to a more API-friendly format
    result = []
    for file, path, timestamp, map_code in analyses:
        result.append({
            "filename": file,
            "filepath": path,
            "timestamp": timestamp,
            "map_code": map_code
        })
    
    return jsonify(result)

@app.route('/api/analysis/<map_code>', methods=['GET'])
def get_analysis(map_code):
    """API endpoint to get analysis data for a specific map code"""
    if not map_code or not map_code.strip():
        return jsonify({"error": "Map code is required"}), 400
    
    # Find the most recent analysis for this map code
    analyses = load_existing_data()
    map_analyses = [a for a in analyses if a[3] == map_code.strip()]
    
    if not map_analyses:
        return jsonify({"error": f"No analysis found for map code {map_code}"}), 404
    
    # Get the most recent analysis (first in the list since they're sorted newest first)
    _, filepath, _, _ = map_analyses[0]
    
    # Load the data
    data = safe_load_json(filepath)
    
    if not data:
        return jsonify({"error": "Failed to load analysis data"}), 500
    
    return jsonify(data)

@app.route('/api/health', methods=['GET'])
def api_health_check():
    """API endpoint for health check"""
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    })

# Add a health check endpoint
@app.route('/health', methods=['GET'])
def health_discovery_endpoint():
    """Health check endpoint for the API discovery process"""
    return jsonify({
        'status': 'ok',
        'type': 'main',
        'version': '1.0.0'
    })

# Add a status endpoint
@app.route('/api/status', methods=['GET'])
def api_status():
    """Status endpoint for checking if the API is alive"""
    return jsonify({
        'status': 'ok',
        'message': 'API is running',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    try:
        port = find_available_port()
        print(f"Server starting on port {port}")
        app.run(debug=True, port=port)
    except Exception as e:
        print(f"Error starting server: {e}") 