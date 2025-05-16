#!/usr/bin/env python3
"""
Unified Service Runner for Fortnite Analyzer

Starts all necessary services for the Fortnite Analyzer:
1. Flask Analyzer Service - Island metadata and player stats API
2. Player Prediction Service - Player count predictions API

Usage:
    python run_services.py [--analyzer-port PORT] [--prediction-port PORT]
"""
import os
import sys
import argparse
import subprocess
import threading
import time
import signal

# Path configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def start_analyzer_service(port=5003):
    """Start the Flask Analyzer Service"""
    print(f"Starting Flask Analyzer Service on port {port}...")
    
    service_path = os.path.join(SCRIPT_DIR, 'flask_analyzer_service.py')
    cmd = [sys.executable, service_path]
    
    # Replace port in arguments
    env = os.environ.copy()
    env["FLASK_RUN_PORT"] = str(port)
    
    return subprocess.Popen(cmd, env=env)

def start_prediction_service(port=3003):
    """Start the Player Prediction Service"""
    print(f"Starting Player Prediction Service on port {port}...")
    
    service_path = os.path.join(SCRIPT_DIR, 'player_prediction_service.py')
    cmd = [sys.executable, service_path]
    
    # Replace port in arguments
    env = os.environ.copy()
    env["FLASK_RUN_PORT"] = str(port)
    
    return subprocess.Popen(cmd, env=env)

def handle_shutdown(processes):
    """Handle graceful shutdown of all processes"""
    def signal_handler(sig, frame):
        print("\nShutting down all services...")
        for process in processes:
            if process and process.poll() is None:  # Process is still running
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
        sys.exit(0)
    
    return signal_handler

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Start Fortnite Analyzer services')
    parser.add_argument('--analyzer-port', type=int, default=5003, help='Port for analyzer service')
    parser.add_argument('--prediction-port', type=int, default=3003, help='Port for prediction service')
    args = parser.parse_args()
    
    # Change to script directory to ensure relative paths work
    os.chdir(SCRIPT_DIR)
    
    # Start services
    processes = []
    try:
        # Start analyzer service
        analyzer_process = start_analyzer_service(args.analyzer_port)
        processes.append(analyzer_process)
        
        # Start prediction service  
        prediction_process = start_prediction_service(args.prediction_port)
        processes.append(prediction_process)
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, handle_shutdown(processes))
        signal.signal(signal.SIGTERM, handle_shutdown(processes))
        
        print("\nAll services started. Press Ctrl+C to stop.")
        print(f"Analyzer service: http://localhost:{args.analyzer_port}/")
        print(f"Prediction service: http://localhost:{args.prediction_port}/")
        
        # Keep the main thread alive
        while all(p.poll() is None for p in processes):
            time.sleep(1)
            
        # If we get here, one of the processes has ended
        print("A service has terminated unexpectedly. Shutting down all services.")
        handle_shutdown(processes)(None, None)
        
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        handle_shutdown(processes)(None, None)
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        handle_shutdown(processes)(None, None)
        sys.exit(1)

if __name__ == '__main__':
    main() 