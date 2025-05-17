"""
Fortnite Island Data Fetcher (Production Version)

This script fetches data for Fortnite Creative Islands using the fortniteapi.io API.
It supports fetching data for specific island codes provided as command-line arguments
or uses a default list if no arguments are given.

Features:
- Fetches detailed island data by code.
- Fetches a list of currently featured islands.
- Uses an API key from the FORTNITE_API_KEY environment variable.
- Implements retry logic for API requests.
- Logs script activity and errors to the console (configurable for file logging).
- Supports a debug/verbose mode for more detailed logging (-v, --verbose, -d, --debug).
- Saves fetched data to JSON files in an 'output' directory, with timestamps.

Environment Variables:
  FORTNITE_API_KEY: Your API key for fortniteapi.io.

Usage:
  python fortnite_island_data_complete.py [island_code_1] [island_code_2] ...
  python fortnite_island_data_complete.py -v [island_code_1] ...
"""
import requests
import json
import os
import sys
import time
import logging
from datetime import datetime

# --- Global Constants and Configuration ---

# Base URL for the Fortnite API (fortniteapi.io)
# All API calls will be made to endpoints under this base URL.
BASE_URL = "https://fortniteapi.io/v1"

# Default retry mechanism parameters for API calls
DEFAULT_RETRY_COUNT = 3  # Number of times to retry a failed API request
DEFAULT_RETRY_DELAY = 2  # Delay in seconds between retries

# Output directory for saving JSON files
OUTPUT_DIR = "output"

# --- Logging Configuration ---
# Configures the logging system for the script.
# Logs are output to stdout by default.
# The log level is INFO by default, can be set to DEBUG via command-line flag.
logging.basicConfig(
    level=logging.INFO,  # Default logging level
    format="%(asctime)s - %(module)s - %(levelname)s - %(message)s", # Log message format
    handlers=[
        logging.StreamHandler(sys.stdout)  # Log messages to the console
        # To log to a file, uncomment and configure FileHandler:
        # logging.FileHandler(os.path.join(OUTPUT_DIR, "script_activity.log"))
    ]
)
# --- End Logging Configuration ---

# --- API Key Initialization ---
# Fetches the API key from an environment variable.
# The script will exit if the API key is not found.
API_KEY = os.environ.get("FORTNITE_API_KEY")
if not API_KEY:
    logging.critical("CRITICAL: The FORTNITE_API_KEY environment variable is not set.")
    logging.critical("Please set this environment variable before running the script.")
    logging.critical("Example: export FORTNITE_API_KEY='your_actual_api_key_here'")
    sys.exit(1) # Exit if API key is crucial and not found
logging.info("Successfully loaded FORTNITE_API_KEY.")

# Standard headers for all API requests, including authorization.
# The API key is passed in the Authorization header.
REQUEST_HEADERS = {
    "Authorization": API_KEY
}
# --- End API Key Initialization ---

def get_island_data(code, retry_count=DEFAULT_RETRY_COUNT, retry_delay=DEFAULT_RETRY_DELAY):
    """
    Fetches detailed data for a specific Fortnite Creative Island by its code.

    This function queries the /creative/island endpoint of the fortniteapi.io API.
    It includes retry logic for transient network issues or API errors.

    Args:
        code (str): The island code (e.g., "1234-5678-9012") to look up.
        retry_count (int, optional): Number of times to retry on failure.
                                     Defaults to DEFAULT_RETRY_COUNT.
        retry_delay (int, optional): Delay in seconds between retries.
                                     Defaults to DEFAULT_RETRY_DELAY.

    Returns:
        dict or None: A dictionary containing the island data if found and the request
                      is successful. Returns None if the island is not found, or if
                      all retry attempts fail.
    """
    endpoint_url = f"{BASE_URL}/creative/island"
    params = {"code": code}
    logging.debug(f"Attempting to fetch island data for code: {code} from {endpoint_url}")

    for attempt in range(1, retry_count + 1): # Start attempt count from 1 for logging
        logging.debug(f"Attempt {attempt}/{retry_count} for island code: {code}")
        try:
            response = requests.get(endpoint_url, headers=REQUEST_HEADERS, params=params)
            # Raises an HTTPError for bad responses (4XX or 5XX)
            response.raise_for_status()
            
            data = response.json()
            logging.debug(f"Successfully received API response for code {code}. Result: {data.get('result')}")
            
            # Check if the API indicates success and island data is present
            if data.get("result") is True and data.get("island"):
                island_details = data["island"]
                # Return a structured dictionary of the relevant island details
                return {
                    "code": island_details.get("code"),
                    "title": island_details.get("title"),
                    "description": island_details.get("description"),
                    "creator": island_details.get("creator"),
                    "creator_code": island_details.get("creatorCode"),
                    "creator_id": island_details.get("creatorId"),
                    "published_date": island_details.get("publishedDate"),
                    "tags": island_details.get("tags", []), # Default to empty list if no tags
                    "image_url": island_details.get("image"),
                    "lobby_image_url": island_details.get("lobbyImage"),
                    "version": island_details.get("latestVersion"),
                    "island_type": island_details.get("islandType"),
                    "status": island_details.get("status"),
                    "ratings": island_details.get("ratings")
                }
            else:
                # Log if result is not true or island data is missing
                logging.warning(f"API reports success but island data is incomplete or not found for code: {code}. Response: {json.dumps(data)}")
                return None # Island effectively not found as per expected data structure
                
        except requests.exceptions.HTTPError as http_err:
            # Specific handling for HTTP errors (e.g., 404 Not Found, 500 Server Error)
            logging.error(f"HTTP error occurred while fetching island {code} (Attempt {attempt}/{retry_count}): {http_err}. Response: {response.text if response else 'No response object'}")
        except requests.exceptions.Timeout as timeout_err:
            logging.error(f"Timeout error occurred while fetching island {code} (Attempt {attempt}/{retry_count}): {timeout_err}")
        except requests.exceptions.RequestException as req_err:
            # Catch-all for other request-related errors (e.g., connection errors)
            logging.error(f"Request exception occurred while fetching island {code} (Attempt {attempt}/{retry_count}): {req_err}")
        except json.JSONDecodeError as json_err:
            logging.error(f"Failed to decode JSON response for island {code} (Attempt {attempt}/{retry_count}): {json_err}. Response text: {response.text if response else 'No response object'}")
        
        # If this is not the last attempt, wait before retrying
        if attempt < retry_count:
            logging.info(f"Retrying in {retry_delay} seconds for island code {code}...")
            time.sleep(retry_delay)
        else:
            # Log final failure after all retries
            logging.error(f"All {retry_count} attempts to fetch island data for code {code} failed.")
            return None

    return None # Should ideally be unreachable if loop logic is correct

def get_featured_islands(retry_count=DEFAULT_RETRY_COUNT, retry_delay=DEFAULT_RETRY_DELAY):
    """
    Fetches a list of currently featured Fortnite Creative Islands.

    Queries the /creative/featured endpoint. Includes retry logic.

    Args:
        retry_count (int, optional): Number of times to retry on failure.
                                     Defaults to DEFAULT_RETRY_COUNT.
        retry_delay (int, optional): Delay in seconds between retries.
                                     Defaults to DEFAULT_RETRY_DELAY.

    Returns:
        list or None: A list of dictionaries, where each dictionary contains data
                      for a featured island. Returns None if the request fails
                      after all retries or if no featured islands are found.
    """
    endpoint_url = f"{BASE_URL}/creative/featured"
    logging.debug(f"Attempting to fetch featured islands from {endpoint_url}")

    for attempt in range(1, retry_count + 1):
        logging.debug(f"Attempt {attempt}/{retry_count} for featured islands.")
        try:
            response = requests.get(endpoint_url, headers=REQUEST_HEADERS)
            response.raise_for_status()
            data = response.json()
            logging.debug(f"Successfully received API response for featured islands. Result: {data.get('result')}")

            if data.get("result") is True and data.get("featured") is not None: # Check for explicit None too
                return data["featured"]
            else:
                logging.warning(f"API reports success but featured islands data is missing or empty. Response: {json.dumps(data)}")
                return [] # Return empty list if 'featured' key is missing or API says no featured islands
        except requests.exceptions.HTTPError as http_err:
            logging.error(f"HTTP error occurred while fetching featured islands (Attempt {attempt}/{retry_count}): {http_err}. Response: {response.text if response else 'No response object'}")
        except requests.exceptions.Timeout as timeout_err:
            logging.error(f"Timeout error occurred while fetching featured islands (Attempt {attempt}/{retry_count}): {timeout_err}")
        except requests.exceptions.RequestException as req_err:
            logging.error(f"Request exception occurred while fetching featured islands (Attempt {attempt}/{retry_count}): {req_err}")
        except json.JSONDecodeError as json_err:
            logging.error(f"Failed to decode JSON response for featured islands (Attempt {attempt}/{retry_count}): {json_err}. Response text: {response.text if response else 'No response object'}")

        if attempt < retry_count:
            logging.info(f"Retrying in {retry_delay} seconds for featured islands...")
            time.sleep(retry_delay)
        else:
            logging.error(f"All {retry_count} attempts to fetch featured islands failed.")
            return None # Return None on complete failure

    return None # Should ideally be unreachable

def process_island_codes(codes, output_filepath=None):
    """
    Processes a list of island codes, fetching data for each, and optionally saves the results.

    Args:
        codes (list): A list of island code strings to process.
        output_filepath (str, optional): The file path where the aggregated results
                                        should be saved as a JSON file. If None,
                                        results are not saved to a file by this function.
                                        Defaults to None.

    Returns:
        dict: A dictionary where keys are island codes and values are the fetched
              island data (or None if an error occurred for that code).
    """
    if not codes:
        logging.warning("No island codes provided for processing.")
        return {}
    
    logging.info(f"Starting to process {len(codes)} island code(s)...")
    
    all_results = {}
    total_codes = len(codes)

    for index, code in enumerate(codes):
        logging.info(f"Processing code {index + 1}/{total_codes}: {code}")
        island_data = get_island_data(code)
        
        if island_data:
            logging.info(f"Successfully fetched data for island {code}: \"{island_data.get('title', 'N/A')}\"")
            all_results[code] = island_data
        else:
            logging.warning(f"Failed to fetch data for island code: {code}. It will be marked as null in results.")
            all_results[code] = None # Explicitly store None for failed fetches
        
    logging.info(f"Finished processing all {total_codes} island code(s).")

    if output_filepath:
        logging.info(f"Attempting to save results to {output_filepath}...")
        try:
            # Ensure the output directory exists before writing the file
            os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
            with open(output_filepath, 'w', encoding='utf-8') as f_out:
                json.dump(all_results, f_out, indent=4, ensure_ascii=False) # Use indent=4 for readability
            logging.info(f"Successfully saved results to {output_filepath}")
        except IOError as io_err:
            logging.error(f"IOError saving results to file {output_filepath}: {io_err}")
        except Exception as e:
            # Catch any other unexpected errors during file writing
            logging.error(f"An unexpected error occurred while saving results to {output_filepath}: {e}")
    
    return all_results

def parse_arguments():
    """
    Parses command-line arguments for the script.

    Supports a verbose/debug flag and a list of island codes.

    Returns:
        tuple: (list_of_island_codes, is_debug_mode)
               The first element is a list of island codes. 
               The second is a boolean indicating if debug mode is enabled.
    """
    args = sys.argv[1:]
    island_codes_cli = []
    debug_mode = False

    if not args:
        return [], False # No arguments, use defaults later

    # Check for debug flag first
    if args[0].lower() in ('-v', '--verbose', '-d', '--debug'):
        debug_mode = True
        logging.getLogger().setLevel(logging.DEBUG) # Set global log level to DEBUG
        logging.debug("Debug logging enabled via command-line flag.")
        island_codes_cli = args[1:] # The rest are island codes
    else:
        island_codes_cli = args # All arguments are island codes
    
    # Validate island codes (basic format check - can be improved)
    validated_codes = []
    for code_arg in island_codes_cli:
        # A simple check for format like XXXX-XXXX-XXXX. More robust validation could be added.
        if isinstance(code_arg, str) and code_arg.count('-') == 2 and len(code_arg) > 10:
            validated_codes.append(code_arg)
        else:
            logging.warning(f"Skipping invalid island code format from arguments: '{code_arg}'")
            
    return validated_codes, debug_mode

def main():
    """
    Main function to orchestrate the fetching and processing of Fortnite island data.

    Handles argument parsing, data fetching for specified or user-provided island codes,
    fetching featured islands, and saving all data to timestamped JSON files.
    """
    logging.info("Fortnite Island Data Fetcher script started.")

    island_codes_to_process, _ = parse_arguments()  # Debug mode is set globally by parse_arguments

    if not island_codes_to_process:
        user_input = input("Enter one or more Fortnite island codes (comma or space separated): ").strip()
        if user_input:
            # Split by comma or whitespace, strip spaces
            island_codes_to_process = [code.strip() for code in user_input.replace(',', ' ').split() if code.strip()]
        if not island_codes_to_process:
            logging.error("No island codes provided. Exiting.")
            sys.exit(1)
        logging.info(f"Using {len(island_codes_to_process)} island code(s) from user input: {island_codes_to_process}")
    else:
        logging.info(f"Using {len(island_codes_to_process)} island code(s) from command line arguments: {island_codes_to_process}")

    # Ensure the main output directory exists
    try:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        logging.debug(f"Output directory '{OUTPUT_DIR}' ensured.")
    except OSError as e:
        logging.critical(f"CRITICAL: Could not create output directory '{OUTPUT_DIR}': {e}. Exiting.")
        sys.exit(1)

    # Generate a unique timestamp for this run's output files
    current_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # --- Process and Save Specific Island Codes ---
    island_data_output_filepath = os.path.join(OUTPUT_DIR, f"fortnite_islands_data_{current_timestamp}.json")
    processed_island_data = process_island_codes(island_codes_to_process, island_data_output_filepath)

    # Log a summary of the processed island data
    logging.info("Summary of processed island data:")
    logging.info(json.dumps(processed_island_data, indent=4, ensure_ascii=False))

    # --- Fetch and Save Featured Islands ---
    logging.info("Attempting to fetch featured islands...")
    featured_islands_data = get_featured_islands()

    if featured_islands_data is not None:  # Could be an empty list which is valid
        featured_data_output_filepath = os.path.join(OUTPUT_DIR, f"fortnite_featured_islands_{current_timestamp}.json")
        logging.info(f"Attempting to save featured islands data to {featured_data_output_filepath}...")
        try:
            with open(featured_data_output_filepath, 'w', encoding='utf-8') as f_out:
                json.dump(featured_islands_data, f_out, indent=4, ensure_ascii=False)
            logging.info(f"Successfully saved featured islands data to {featured_data_output_filepath}")
        except IOError as io_err:
            logging.error(f"IOError saving featured islands data to file {featured_data_output_filepath}: {io_err}")
        except Exception as e:
            logging.error(f"An unexpected error occurred while saving featured islands data to {featured_data_output_filepath}: {e}")
    else:
        logging.warning("No featured islands data was fetched or an error occurred; nothing to save.")

    logging.info("Fortnite Island Data Fetcher script finished.")

if __name__ == "__main__":
    # This block ensures that main() is called only when the script is executed directly,
    # not when imported as a module.
    main() 