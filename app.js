// API URLs
const MAIN_API_URL = 'http://localhost:5003/api';
const PREDICTION_API_URL = 'http://localhost:5004/api';

// Chart Objects
let playerChart = null;
let predictionChart = null;

// DOM Elements
const searchForm = document.getElementById('search-form');
const mapCodeInput = document.getElementById('map-code');
const exampleLinks = document.querySelectorAll('.example-link');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const resultsContainer = document.getElementById('results-container');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    // Event listeners
    searchForm.addEventListener('submit', handleFormSubmit);
    
    // Example links
    exampleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            mapCodeInput.value = link.textContent.trim();
            searchForm.dispatchEvent(new Event('submit'));
        });
    });
    
    // Tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            activateTab(tabId);
        });
    });

    // Check if APIs are running
    checkAPIStatus();
});

// Check if APIs are running
async function checkAPIStatus() {
    try {
        console.log('Checking API status...');
        
        // Try main API
        try {
            const mainResponse = await fetch(`${MAIN_API_URL}/health`);
            if (mainResponse.ok) {
                console.log('Main API is running');
            } else {
                console.error('Main API returned error:', mainResponse.status);
                showError('Main API is not responding correctly. Make sure it is running on port 5003.');
            }
        } catch (error) {
            console.error('Error connecting to Main API:', error);
            showError('Cannot connect to Main API. Make sure it is running on port 5003.');
        }
        
        // Try prediction API
        try {
            const predResponse = await fetch(`${PREDICTION_API_URL}/health`);
            if (predResponse.ok) {
                console.log('Prediction API is running');
            } else {
                console.error('Prediction API returned error:', predResponse.status);
                showError('Prediction API is not responding correctly. Make sure it is running on port 5004.');
            }
        } catch (error) {
            console.error('Error connecting to Prediction API:', error);
            showError('Cannot connect to Prediction API. Make sure it is running on port 5004.');
        }
    } catch (error) {
        console.error('Error checking API status:', error);
        showError('Error checking API status. Check console for details.');
    }
}

// Helper function for fetch with better error handling and optional CORS mode
async function fetchWithErrorHandling(url, options = {}) {
    console.log(`Fetching: ${url}`);
    
    // Add default options for better CORS handling
    const fetchOptions = {
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        ...options
    };
    
    try {
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            // Try to get error message from response
            let errorMessage;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
            } catch (e) {
                errorMessage = `Server returned ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        throw error;
    }
}

// Form Submission Handler
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const mapCode = mapCodeInput.value.trim();
    if (!isValidMapCode(mapCode)) {
        showError('Please enter a valid map code in the format: 0000-0000-0000');
        return;
    }
    
    // Reset UI
    resetUI();
    showLoading();
    
    try {
        console.log(`Processing map code: ${mapCode}`);
        
        // First check if analysis exists
        const analysisExists = await checkAnalysisExists(mapCode);
        console.log(`Analysis exists: ${analysisExists}`);
        
        // If analysis doesn't exist, run it
        if (!analysisExists) {
            console.log('Running new analysis...');
            await runAnalysis(mapCode);
        }
        
        // Get the data and predictions simultaneously
        console.log('Fetching data and predictions...');
        const [islandData, predictionData] = await Promise.all([
            fetchIslandData(mapCode),
            fetchPredictions(mapCode)
        ]);
        
        // Update UI with data
        console.log('Updating UI with data');
        updateUI(islandData, predictionData);
        
        // Show results
        hideLoading();
        showResults();
    } catch (error) {
        hideLoading();
        showError(error.message || 'An error occurred. Please try again.');
        console.error('Error processing form submission:', error);
    }
}

// Check if map code format is valid
function isValidMapCode(mapCode) {
    return /^\d{4}-\d{4}-\d{4}$/.test(mapCode);
}

// Check if analysis exists for the map code
async function checkAnalysisExists(mapCode) {
    try {
        const data = await fetchWithErrorHandling(`${MAIN_API_URL}/analyses`);
        return data.some(analysis => analysis.map_code === mapCode);
    } catch (error) {
        console.error('Error checking if analysis exists:', error);
        // Return false to force a new analysis
        return false;
    }
}

// Run analysis if needed
async function runAnalysis(mapCode) {
    console.log(`Running analysis for map code: ${mapCode}`);
    
    try {
        return await fetchWithErrorHandling(`${MAIN_API_URL}/analyze/${mapCode}`);
    } catch (error) {
        console.error('Error running analysis:', error);
        throw new Error(`Failed to analyze map code: ${error.message}`);
    }
}

// Fetch island data
async function fetchIslandData(mapCode) {
    console.log(`Fetching island data for map code: ${mapCode}`);
    
    try {
        return await fetchWithErrorHandling(`${MAIN_API_URL}/analysis/${mapCode}`);
    } catch (error) {
        console.error('Error fetching island data:', error);
        throw new Error(`Failed to fetch data for map code: ${error.message}`);
    }
}

// Fetch predictions
async function fetchPredictions(mapCode) {
    console.log(`Fetching predictions for map code: ${mapCode}`);
    
    try {
        return await fetchWithErrorHandling(`${PREDICTION_API_URL}/predict/${mapCode}`);
    } catch (error) {
        console.error('Error fetching predictions:', error);
        throw new Error(`Failed to fetch predictions: ${error.message}`);
    }
}

// Update UI with data
function updateUI(islandData, predictionData) {
    // Island Info Tab
    updateIslandInfo(islandData);
    
    // Player Stats Tab
    updatePlayerStats(islandData);
    
    // Predictions Tab
    updatePredictions(predictionData);
}

// Update Island Info Tab
function updateIslandInfo(data) {
    const apiData = data.api_data || {};
    
    // Update island details
    document.getElementById('island-title').textContent = apiData.title || 'Unknown Island';
    document.getElementById('island-creator').querySelector('span').textContent = apiData.creator || 'Unknown';
    document.getElementById('island-code').querySelector('span').textContent = data.map_code || '';
    document.getElementById('island-description-text').textContent = apiData.description || 'No description available';
    document.getElementById('island-published').textContent = apiData.publishedDate || 'Unknown';
    document.getElementById('island-version').textContent = apiData.version || 'Unknown';
    
    // Update tags
    const tagsContainer = document.getElementById('tags-container');
    tagsContainer.innerHTML = '';
    
    if (apiData.tags && apiData.tags.length) {
        apiData.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.textContent = tag;
            tagsContainer.appendChild(tagEl);
        });
    } else {
        tagsContainer.innerHTML = '<p>No tags available</p>';
    }
}

// Update Player Stats Tab
function updatePlayerStats(data) {
    const scrapedData = Array.isArray(data.scraped_data) 
        ? data.scraped_data[0] 
        : data.scraped_data || {};
    
    // Player stats cards
    const statsCardsContainer = document.getElementById('stats-cards-container');
    statsCardsContainer.innerHTML = '';
    
    if (scrapedData.player_stats && scrapedData.player_stats.length) {
        scrapedData.player_stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-value">${stat.stat_value || '0'}</div>
                <div class="stat-label">${stat.stat_label || 'Unknown'}</div>
            `;
            statsCardsContainer.appendChild(card);
        });
    }
    
    // Player data table
    const tableBody = document.getElementById('player-data-table').querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (scrapedData.table_rows && scrapedData.table_rows.length) {
        scrapedData.table_rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.time || '-'}</td>
                <td>${row.peak || '0'}</td>
                <td>${row.average || '0'}</td>
                <td>${row.gain || '0'}</td>
            `;
            tableBody.appendChild(tr);
        });
        
        // Create player chart
        createPlayerChart(scrapedData.table_rows);
    }
}

// Create player chart
function createPlayerChart(tableRows) {
    if (!tableRows || !tableRows.length) return;
    
    const ctx = document.getElementById('player-chart').getContext('2d');
    
    // Parse data
    const labels = [];
    const peakData = [];
    const avgData = [];
    
    tableRows.forEach(row => {
        labels.push(row.time || '');
        peakData.push(safeParseInt(row.peak));
        avgData.push(safeParseInt(row.average));
    });
    
    // Destroy previous chart if exists
    if (playerChart) {
        playerChart.destroy();
    }
    
    // Create new chart
    playerChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Peak Players',
                    data: peakData,
                    borderColor: '#5643CC',
                    backgroundColor: 'rgba(86, 67, 204, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Average Players',
                    data: avgData,
                    borderColor: '#54C6EB',
                    backgroundColor: 'rgba(84, 198, 235, 0.1)',
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Player Count Trends'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Player Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Period'
                    }
                }
            }
        }
    });
}

// Update Predictions Tab
function updatePredictions(data) {
    const predictions = data.predictions || {};
    
    // Update recommendation
    document.getElementById('best-player-count').textContent = 
        predictions.best_player_count || '0';
    
    // Update confidence
    const confidenceScore = predictions.confidence_score || 0;
    const confidencePercent = Math.round(confidenceScore * 100);
    document.getElementById('confidence-bar').style.width = `${confidencePercent}%`;
    document.getElementById('confidence-value').textContent = `${confidencePercent}%`;
    
    // Update explanations
    const explanationsContainer = document.getElementById('prediction-explanations');
    explanationsContainer.innerHTML = '';
    
    if (predictions.explanations && predictions.explanations.length) {
        predictions.explanations.forEach(explanation => {
            const p = document.createElement('p');
            p.className = 'explanation-item';
            p.textContent = explanation;
            explanationsContainer.appendChild(p);
        });
    }
    
    // Create prediction chart
    createPredictionChart(predictions);
}

// Create prediction chart
function createPredictionChart(predictions) {
    const ctx = document.getElementById('prediction-chart').getContext('2d');
    
    // Parse historical and prediction data
    const labels = [];
    const historicalData = [];
    const predictionData = [];
    const lowerBoundData = [];
    const upperBoundData = [];
    
    // Add historical data
    if (predictions.historical && predictions.historical.length) {
        predictions.historical.forEach(point => {
            labels.push(point.time);
            historicalData.push(point.value);
            predictionData.push(null); // No prediction for historical points
            lowerBoundData.push(null);
            upperBoundData.push(null);
        });
    }
    
    // Add prediction data
    if (predictions.predictions && predictions.predictions.length) {
        predictions.predictions.forEach(point => {
            labels.push(point.time);
            historicalData.push(null); // No historical data for prediction points
            predictionData.push(point.value);
            lowerBoundData.push(point.lower);
            upperBoundData.push(point.upper);
        });
    }
    
    // Destroy previous chart if exists
    if (predictionChart) {
        predictionChart.destroy();
    }
    
    // Create new chart
    predictionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Historical',
                    data: historicalData,
                    borderColor: '#5643CC',
                    backgroundColor: 'rgba(86, 67, 204, 0.1)',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false
                },
                {
                    label: 'Prediction',
                    data: predictionData,
                    borderColor: '#FF9933',
                    backgroundColor: 'rgba(255, 153, 51, 0.1)',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: 'Lower Bound',
                    data: lowerBoundData,
                    borderColor: 'rgba(255, 153, 51, 0.3)',
                    backgroundColor: 'transparent',
                    pointRadius: 0,
                    borderDash: [2, 2],
                    fill: false
                },
                {
                    label: 'Upper Bound',
                    data: upperBoundData,
                    borderColor: 'rgba(255, 153, 51, 0.3)',
                    backgroundColor: 'rgba(255, 153, 51, 0.1)',
                    pointRadius: 0,
                    borderDash: [2, 2],
                    fill: '+1' // Fill between this dataset and the next one
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Player Count Forecast'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Player Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Period'
                    }
                }
            }
        }
    });
}

// Helper: Safe parseInt
function safeParseInt(value) {
    if (!value) return 0;
    
    // Remove commas and 'K' for thousands
    const cleanValue = String(value)
        .replace(/,/g, '')
        .replace('K', '000');
    
    const result = parseInt(cleanValue);
    return isNaN(result) ? 0 : result;
}

// UI Helpers
function resetUI() {
    hideError();
    hideResults();
    activateTab('island-info'); // Reset to first tab
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showResults() {
    resultsContainer.classList.remove('hidden');
}

function hideResults() {
    resultsContainer.classList.add('hidden');
}

function activateTab(tabId) {
    // Update buttons
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Update content
    tabPanes.forEach(pane => {
        if (pane.id === tabId) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });
} 