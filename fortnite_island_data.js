/**
 * @file fortnite_island_data.js
 * @description Fetches data for Fortnite Creative Islands using the fortnite-api-io library.
 * 
 * This script allows fetching detailed information for specific Fortnite Creative island codes
 * and logs the results to the console. It serves as a JavaScript equivalent to the more
 * comprehensive Python version for users who prefer or require a Node.js environment.
 *
 * @requires fortnite-api-io Node.js library (https://www.npmjs.com/package/fortnite-api-io)
 *
 * @example
 * // To run this script:
 * // 1. Ensure you have Node.js and npm installed.
 * // 2. Install the required dependency: npm install fortnite-api-io
 * // 3. Execute the script: node fortnite_island_data.js
 *
 * @note The API key is currently hardcoded in the client instantiation.
 *       For production environments, consider managing this more securely, 
 *       e.g., through environment variables, similar to the Python version.
 */

const FortniteAPI = require("fortnite-api-io");

// --- Configuration ---
// API Key for fortniteapi.io. 
// IMPORTANT: For production, this key should not be hardcoded.
// Consider using environment variables or a secure configuration management system.
const API_KEY = "4d5a18a0-bd9041ee-2a022a7f-4381fc6c";

// Default language for API responses. fortnite-api-io defaults to 'en' if not specified.
const DEFAULT_LANGUAGE = 'en';

// --- API Client Initialization ---
// Instantiate the fortnite-api-io client with credentials and options.
const apiClient = new FortniteAPI(API_KEY, {
    defaultLanguage: DEFAULT_LANGUAGE,
    ignoreWarnings: false // Set to true to suppress warnings from the library itself.
});

/**
 * Fetches detailed data for a specific Fortnite Creative Island by its code.
 * 
 * This function uses the `searchIsland` method from the `fortnite-api-io` client.
 * 
 * @async
 * @param {string} code - The island code (e.g., "1234-5678-9012") to look up.
 * @returns {Promise<object|null>} A promise that resolves to an object containing 
 *                                  key island data if found, or null if the island 
 *                                  is not found or an error occurs.
 */
async function getIslandData(code) {
    if (!code || typeof code !== 'string') {
        console.error("Error: Invalid island code provided to getIslandData.");
        return null;
    }

    console.debug(`Fetching data for island code: ${code}`); // For more verbose logging if needed
    try {
        // Use the searchIsland method to retrieve data for the given island code.
        const result = await apiClient.searchIsland(code);
        
        // Validate the structure of the API response.
        if (result && result.result === true && result.island) {
            const island = result.island;
            console.debug(`Successfully fetched data for island: ${island.title}`);
            // Extract and return a curated set of important island information.
            return {
                code: island.code,
                title: island.title,
                description: island.description,
                creator: island.creator,
                creatorCode: island.creatorCode || null, // Default to null if undefined
                publishedDate: island.publishedDate,
                tags: island.tags || [], // Default to an empty array if undefined
                imageUrl: island.image,
                version: island.latestVersion
            };
        } else {
            // Log a warning if the island is not found or the response structure is unexpected.
            console.warn(`Island not found or unexpected API response for code ${code}. Response:`, result);
            return null;
        }
    } catch (error) {
        // Log any errors that occur during the API request or data processing.
        console.error(`Error fetching island data for code ${code}:`, error.message);
        // It might be useful to log `error` itself for more details in some cases.
        // console.error(error);
        return null;
    }
}

/**
 * Processes a list of island codes, fetching data for each.
 * 
 * Iterates over an array of island codes, calls `getIslandData` for each, 
 * and aggregates the results.
 * 
 * @async
 * @param {string[]} codes - An array of island code strings to process.
 * @returns {Promise<object>} A promise that resolves to an object where keys are 
 *                            island codes and values are the fetched island data 
 *                            (or null if an error occurred for that code).
 */
async function processIslandCodes(codes) {
    if (!Array.isArray(codes) || codes.some(code => typeof code !== 'string')) {
        console.error("Error: Invalid array of island codes provided to processIslandCodes.");
        return {};
    }

    console.info("Starting to fetch island data for multiple codes...\n");
    
    const results = {}; // Object to store results, keyed by island code.
    
    for (const code of codes) {
        console.info(`Processing island code: ${code}`);
        const data = await getIslandData(code);
        
        if (data) {
            console.info(`✅ Found: "${data.title}" by ${data.creator}`);
            results[code] = data;
        } else {
            console.warn(`❌ Failed to get data for island code: ${code}`);
            results[code] = null; // Explicitly store null for failed fetches.
        }
        console.log("-----------------------------------"); // Separator for readability.
    }
    
    console.info("Finished processing all island codes.");
    return results;
}

/**
 * Main function to orchestrate the script's execution.
 * 
 * Defines a list of island codes to check and then processes them,
 * finally logging the aggregated results to the console.
 * 
 * @async
 */
async function main() {
    console.info("Fortnite Island Data Fetcher (JavaScript) started.");

    // List of island codes to check. Modify this array to fetch data for different islands.
    const islandCodes = [
        "1865-4829-7018", // Example: "The Pit - Free For All"
        "9683-4582-8184", // Example: "Red vs Blue Lava"
        "6531-4403-0726"  // Example: "Bio's Zone Wars - Trio"
        // Add more island codes here as needed.
    ];
    
    const results = await processIslandCodes(islandCodes);
    
    // Display final aggregated results in a readable JSON format.
    console.info("\nFinal Results (JSON):");
    console.log(JSON.stringify(results, null, 2)); // null, 2 for pretty-printing JSON.

    console.info("\nFortnite Island Data Fetcher (JavaScript) finished.");
}

// --- Script Execution ---
// Execute the main function and catch any unhandled top-level errors.
main().catch(err => {
    console.error("A fatal error occurred in the main execution flow:", err);
    process.exitCode = 1; // Indicate an error exit status.
}); 