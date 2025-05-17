#!/usr/bin/env python3
"""
Fortnite Player Prediction API

A Flask API service that provides player count predictions based on the player_prediction.py module.
This is a separate service from the main Fortnite Platform API.

Usage:
    flask run --port 5004
    # or
    python player_prediction_api.py

Endpoints:
    POST /api/predict - Accept JSON data and return predictions
    GET /api/predict/<map_code> - Run predictions for a specific map code
    GET /api/health - Health check endpoint
"""
import os
import sys
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import logging

# Import common utilities for accessing project paths
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from src.utils.common import get_output_dir, safe_load_json
from player_prediction import generate_predictions

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

def get_map_data(map_code):
    """
    Get the most recent data file for a given map code
    
    Args:
        map_code (str): The Fortnite map code
        
    Returns:
        dict: The data from the JSON file or None if not found
    """
    logger.info(f"Looking for data for map code: {map_code}")
    output_dir = get_output_dir()
    
    if not os.path.exists(output_dir):
        logger.error(f"Output directory does not exist: {output_dir}")
        return None
    
    # Find all files for this map code
    matching_files = []
    for file in os.listdir(output_dir):
        if file.startswith(f"fortnite_data_{map_code}") and file.endswith(".json"):
            filepath = os.path.join(output_dir, file)
            matching_files.append(filepath)
    
    if not matching_files:
        logger.error(f"No data files found for map code: {map_code}")
        return None
    
    # Get the most recent file (assuming filename includes timestamp)
    most_recent = sorted(matching_files)[-1]
    logger.info(f"Found data file: {most_recent}")
    
    # Load the data
    data = safe_load_json(most_recent)
    return data

@app.route('/api/predict', methods=['POST'])
def predict_from_data():
    """API endpoint to generate predictions from provided JSON data"""
    # Check if JSON data was provided
    if not request.json:
        return jsonify({"error": "No JSON data provided"}), 400
    
    data = request.json
    
    # Get the periods parameter if provided, otherwise use default
    periods = request.args.get('periods', default=12, type=int)
    
    try:
        # Generate predictions
        logger.info(f"Generating predictions with {periods} periods")
        predictions = generate_predictions(data, periods=periods)
        
        if not predictions:
            return jsonify({"error": "Failed to generate predictions"}), 500
        
        return jsonify(predictions)
    except Exception as e:
        logger.error(f"Error generating predictions: {str(e)}")
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500

@app.route('/api/predict/<map_code>', methods=['GET'])
def predict_for_map(map_code):
    """API endpoint to generate predictions for a specific map code"""
    if not map_code or not map_code.strip():
        return jsonify({"error": "Map code is required"}), 400
    
    # Get the periods parameter if provided, otherwise use default
    periods = request.args.get('periods', default=12, type=int)
    
    # Get data for this map code
    data = get_map_data(map_code.strip())
    
    if not data:
        return jsonify({"error": f"No data found for map code {map_code}"}), 404
    
    try:
        # Generate predictions
        logger.info(f"Generating predictions for {map_code} with {periods} periods")
        predictions = generate_predictions(data.get("scraped_data", {}), periods=periods)
        
        if not predictions:
            return jsonify({"error": "Failed to generate predictions"}), 500
        
        # Add context information
        result = {
            "map_code": map_code,
            "timestamp": datetime.now().isoformat(),
            "predictions": predictions,
            "metadata": {
                "title": data.get("api_data", {}).get("title", "Unknown"),
                "creator": data.get("api_data", {}).get("creator", "Unknown"),
            }
        }
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error generating predictions: {str(e)}")
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500

@app.route('/api/save-prediction/<map_code>', methods=['GET'])
def save_prediction(map_code):
    """API endpoint to generate and save predictions for a specific map code"""
    if not map_code or not map_code.strip():
        return jsonify({"error": "Map code is required"}), 400
    
    # Get the periods parameter if provided, otherwise use default
    periods = request.args.get('periods', default=12, type=int)
    
    # Get data for this map code
    data = get_map_data(map_code.strip())
    
    if not data:
        return jsonify({"error": f"No data found for map code {map_code}"}), 404
    
    try:
        # Generate predictions
        logger.info(f"Generating predictions for {map_code} with {periods} periods")
        predictions = generate_predictions(data.get("scraped_data", {}), periods=periods)
        
        if not predictions:
            return jsonify({"error": "Failed to generate predictions"}), 500
        
        # Save predictions to file
        output_dir = get_output_dir()
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f"predictions_{map_code}_{timestamp}.json"
        output_path = os.path.join(output_dir, output_file)
        
        with open(output_path, 'w') as f:
            json.dump(predictions, f, indent=2)
        
        logger.info(f"Saved predictions to {output_path}")
        
        # Add context information to response
        result = {
            "map_code": map_code,
            "timestamp": datetime.now().isoformat(),
            "predictions": predictions,
            "file_path": output_path,
            "metadata": {
                "title": data.get("api_data", {}).get("title", "Unknown"),
                "creator": data.get("api_data", {}).get("creator", "Unknown"),
            }
        }
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error generating predictions: {str(e)}")
        return jsonify({"error": f"Prediction error: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """API endpoint for health check"""
    return jsonify({
        "service": "player-prediction-api",
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Run the Flask app on a different port than the main API
    app.run(debug=True, host='0.0.0.0', port=5004) 