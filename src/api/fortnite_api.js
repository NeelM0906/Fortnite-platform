/**
 * Fortnite Island Data Fetcher (JavaScript)
 *
 * Fetches data for Fortnite Creative Islands using the fortnite-api-io library.
 * Accepts a map code as a CLI argument and prints only the requested fields.
 *
 * Usage:
 *   node src/api/fortnite_api.js <map_code>
 *   # or import and use getIslandData function
 *
 * External dependencies: fortnite-api-io (npm)
 */

const FortniteAPI = require("fortnite-api-io");
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// --- Configuration ---
// API Key for fortniteapi.io. For production, use environment variables.
const API_KEY = process.env.FORTNITE_API_KEY || "4d5a18a0-bd9041ee-2a022a7f-4381fc6c";
const DEFAULT_LANGUAGE = 'en';

// --- API Client Initialization ---
const apiClient = new FortniteAPI(API_KEY, {
    defaultLanguage: DEFAULT_LANGUAGE,
    ignoreWarnings: false
});

/**
 * Fetches detailed data for a specific Fortnite Creative Island by its code.
 * Only returns the requested fields.
 * @async
 * @param {string} code - The island code (e.g., "1234-5678-9012") to look up.
 * @returns {Promise<object|null>} Object with requested fields or null if not found.
 */
async function getIslandData(code) {
    if (!code || typeof code !== 'string') {
        console.error("Error: Invalid island code provided to getIslandData.");
        return null;
    }
    try {
        const result = await apiClient.searchIsland(code);
        if (result && result.result === true && result.island) {
            const island = result.island;
            // Only return the requested fields
            return {
                code: island.code,
                title: island.title,
                description: island.description,
                creator: island.creator,
                creatorCode: island.creatorCode || null,
                publishedDate: island.publishedDate,
                tags: island.tags || [],
                version: island.latestVersion
            };
        } else {
            console.warn(`Island not found or unexpected API response for code ${code}. Response:`, result);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching island data for code ${code}:`, error.message);
        return null;
    }
}

/**
 * Processes a list of island codes, fetching data for each.
 * @async
 * @param {string[]} codes - Array of island code strings to process.
 * @returns {Promise<object>} Object where keys are island codes and values are the fetched data.
 */
async function processIslandCodes(codes) {
    if (!Array.isArray(codes) || codes.some(code => typeof code !== 'string')) {
        console.error("Error: Invalid array of island codes provided to processIslandCodes.");
        return {};
    }
    const results = {};
    for (const code of codes) {
        const data = await getIslandData(code);
        results[code] = data;
    }
    return results;
}

/**
 * Save island data to a file
 * @async
 * @param {object} data - The island data to save
 * @param {string} outputPath - Path to save the data
 */
async function saveIslandData(data, outputPath = 'output/island_data.json') {
    try {
        // Ensure output directory exists
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });
        
        // Write the data
        await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
        console.log(`Island data saved to ${outputPath}`);
    } catch (error) {
        console.error(`Error saving island data: ${error.message}`);
    }
}

/**
 * Main function to orchestrate the script's execution.
 * Accepts code(s) from CLI, falls back to default list if none provided.
 * Prints only the requested fields for a single code, or all for multiple.
 * @async
 */
async function main() {
    const cliCodes = process.argv.slice(2);
    let islandCodes;
    if (cliCodes.length > 0) {
        islandCodes = cliCodes;
    } else {
        // Fallback to default list
        islandCodes = [
            "1865-4829-7018",
            "9683-4582-8184",
            "6531-4403-0726"
        ];
    }
    const results = await processIslandCodes(islandCodes);
    
    // Create output directory if needed
    try {
        await fs.mkdir('output', { recursive: true });
    } catch (error) {
        // Ignore if directory already exists
    }
    
    if (islandCodes.length === 1) {
        const code = islandCodes[0];
        console.log(JSON.stringify(results[code], null, 2));
        
        // Save to file if it's a single result
        await saveIslandData(results[code], 'output/island_data.json');
    } else {
        console.info("\nFinal Results (JSON):");
        console.log(JSON.stringify(results, null, 2));
        
        // Save to file
        await saveIslandData(results, 'output/islands_data.json');
    }
    console.info("\nFortnite Island Data Fetcher (JavaScript) finished.");
}

// Export functions for use as a module
module.exports = {
    getIslandData,
    processIslandCodes,
    saveIslandData
};

// --- Script Execution ---
if (require.main === module) {
    main().catch(err => {
        console.error("A fatal error occurred in the main execution flow:", err);
        process.exitCode = 1;
    });
} 