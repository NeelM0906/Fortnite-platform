// Supabase credentials (same as used in the Python backend)
const SUPABASE_URL = "https://ryuxysblsdqxjiagwhci.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dXh5c2Jsc2RxeGppYWd3aGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjkxOTQsImV4cCI6MjA2Mjc0NTE5NH0.GixzXyUlTk1BinFC8hBYrVfN7hdqESx44qNPvo5bON4";

// API URLs - will be dynamically discovered
let MAIN_API_URL = null;
let PREDICTION_API_URL = null;

// Port ranges to scan for APIs
const MAIN_API_PORT_RANGE = { start: 5003, end: 5013 };
const PREDICTION_API_PORT_RANGE = { start: 5004, end: 5014 };

// Chart Objects
let playerChart = null;
let predictionChart = null;

// User state
let currentUser = null;
let userProfile = null;

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

// Auth DOM Elements
const authLoggedOut = document.getElementById('auth-logged-out');
const authLoggedIn = document.getElementById('auth-logged-in');
const userDisplayName = document.getElementById('user-display-name');
const showLoginBtn = document.getElementById('show-login-btn');
const showSignupBtn = document.getElementById('show-signup-btn');
const showProfileBtn = document.getElementById('show-profile-btn');
const logoutBtn = document.getElementById('logout-btn');
const authModal = document.getElementById('auth-modal');
const profileModal = document.getElementById('profile-modal');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const profileForm = document.getElementById('profile-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const profileError = document.getElementById('profile-error');
const profileSuccess = document.getElementById('profile-success');
const authTabButtons = document.querySelectorAll('.auth-tab-button');
const authTabContents = document.querySelectorAll('.auth-tab-content');
const closeModalButtons = document.querySelectorAll('.close-modal');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    
    // Initialize Supabase
    initializeSupabase();
    
    // Event listeners
    setupEventListeners();
    
    // Discover and check API status
    discoverAPIs();
});

// Initialize Supabase client
function initializeSupabase() {
    try {
        // Create Supabase client
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized');
        
        // Check if user is already logged in
        checkAuthState();
    } catch (error) {
        console.error('Error initializing Supabase:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Check that required DOM elements exist
    if (!searchForm || !showLoginBtn || !showSignupBtn || !showProfileBtn || !logoutBtn ||
        !loginForm || !signupForm || !profileForm) {
        console.error('Required DOM elements for event listeners not found');
        return;
    }
    
    // Main app event listeners
    searchForm.addEventListener('submit', handleFormSubmit);
    
    // Example links
    if (exampleLinks) {
        exampleLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                mapCodeInput.value = link.textContent.trim();
                searchForm.dispatchEvent(new Event('submit'));
            });
        });
    }
    
    // Tab navigation
    if (tabButtons) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                activateTab(tabId);
            });
        });
    }
    
    // Auth event listeners
    showLoginBtn.addEventListener('click', () => {
        openAuthModal('login-tab');
    });
    
    showSignupBtn.addEventListener('click', () => {
        openAuthModal('signup-tab');
    });
    
    showProfileBtn.addEventListener('click', openProfileModal);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    profileForm.addEventListener('submit', handleProfileUpdate);
    
    // Auth tabs
    if (authTabButtons) {
        authTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                activateAuthTab(tabId);
            });
        });
    }
    
    // Close modals
    if (closeModalButtons) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (authModal) authModal.classList.add('hidden');
                if (profileModal) profileModal.classList.add('hidden');
            });
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (authModal && e.target === authModal) {
            authModal.classList.add('hidden');
        }
        if (profileModal && e.target === profileModal) {
            profileModal.classList.add('hidden');
        }
    });
}

// Auth Functions
async function checkAuthState() {
    try {
        // Get current session
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) {
            console.error('Error checking auth state:', error);
            return;
        }
        
        if (session) {
            currentUser = session.user;
            updateAuthUI(true);
            
            // Get user profile
            await getUserProfile();
        } else {
            updateAuthUI(false);
        }
        
    } catch (error) {
        console.error('Error in checkAuthState:', error);
        updateAuthUI(false);
    }
}

async function getUserProfile() {
    try {
        if (!currentUser) return;
        
        // Query profiles table for user data
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('Error fetching user profile:', error);
            return;
        }
        
        if (data) {
            userProfile = data;
            
            // Update display name in header
            userDisplayName.textContent = data.display_name || currentUser.email?.split('@')[0] || 'User';
            
            // Update profile form if open
            if (!profileModal.classList.contains('hidden')) {
                updateProfileForm();
            }
        }
    } catch (error) {
        console.error('Error in getUserProfile:', error);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    // Check if login form elements exist
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (!loginForm || !emailInput || !passwordInput || !loginError || !authModal) {
        console.error('Login form elements not found');
        return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    try {
        // Show loading state
        const loginButton = loginForm.querySelector('button');
        if (!loginButton) {
            console.error('Login button not found');
            return;
        }
        
        loginButton.textContent = 'Logging in...';
        loginButton.disabled = true;
        loginError.classList.add('hidden');
        
        // Sign in with email and password
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            loginError.textContent = error.message;
            loginError.classList.remove('hidden');
            console.error('Login error:', error);
        } else {
            // Login successful
            currentUser = data.user;
            authModal.classList.add('hidden');
            updateAuthUI(true);
            
            // Get user profile
            await getUserProfile();
        }
    } catch (error) {
        if (loginError) {
            loginError.textContent = error.message;
            loginError.classList.remove('hidden');
        }
        console.error('Login error:', error);
    } finally {
        // Reset button state
        const loginButton = loginForm.querySelector('button');
        if (loginButton) {
            loginButton.textContent = 'Login';
            loginButton.disabled = false;
        }
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    // Check if signup form elements exist
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const passwordConfirmInput = document.getElementById('signup-password-confirm');
    
    if (!signupForm || !emailInput || !passwordInput || !passwordConfirmInput || !signupError || !authModal) {
        console.error('Signup form elements not found');
        return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    
    // Validate passwords match
    if (password !== passwordConfirm) {
        signupError.textContent = 'Passwords do not match';
        signupError.classList.remove('hidden');
        return;
    }
    
    try {
        // Show loading state
        const signupButton = signupForm.querySelector('button');
        if (!signupButton) {
            console.error('Signup button not found');
            return;
        }
        
        signupButton.textContent = 'Creating account...';
        signupButton.disabled = true;
        signupError.classList.add('hidden');
        
        // Sign up with email and password
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) {
            signupError.textContent = error.message;
            signupError.classList.remove('hidden');
            console.error('Signup error:', error);
        } else {
            // Signup successful
            currentUser = data.user;
            authModal.classList.add('hidden');
            updateAuthUI(true);
            
            // We may need to wait for profile creation from the backend
            setTimeout(getUserProfile, 1000);
        }
    } catch (error) {
        if (signupError) {
            signupError.textContent = error.message;
            signupError.classList.remove('hidden');
        }
        console.error('Signup error:', error);
    } finally {
        // Reset button state
        const signupButton = signupForm.querySelector('button');
        if (signupButton) {
            signupButton.textContent = 'Sign Up';
            signupButton.disabled = false;
        }
    }
}

async function handleLogout() {
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
            return;
        }
        
        // Reset user state
        currentUser = null;
        userProfile = null;
        updateAuthUI(false);
        
    } catch (error) {
        console.error('Error in handleLogout:', error);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!currentUser) {
        profileError.textContent = 'You must be logged in to update your profile';
        profileError.classList.remove('hidden');
        profileSuccess.classList.add('hidden');
        return;
    }
    
    const displayName = document.getElementById('profile-display-name').value;
    const bio = document.getElementById('profile-bio').value;
    
    // Validate input
    if (bio.length < 5) {
        profileError.textContent = 'Bio must be at least 5 characters';
        profileError.classList.remove('hidden');
        profileSuccess.classList.add('hidden');
        return;
    }
    
    try {
        // Show loading state
        profileForm.querySelector('button').textContent = 'Updating...';
        profileForm.querySelector('button').disabled = true;
        profileError.classList.add('hidden');
        profileSuccess.classList.add('hidden');
        
        const profileData = {
            display_name: displayName,
            bio: bio,
            updated_at: new Date().toISOString()
        };
        
        // Update profile in database
        const { error } = await window.supabaseClient
            .from('profiles')
            .update(profileData)
            .eq('id', currentUser.id);
        
        if (error) {
            profileError.textContent = error.message;
            profileError.classList.remove('hidden');
            console.error('Profile update error:', error);
        } else {
            // Update successful
            profileSuccess.textContent = 'Profile updated successfully';
            profileSuccess.classList.remove('hidden');
            
            // Refresh profile data
            await getUserProfile();
        }
    } catch (error) {
        profileError.textContent = error.message;
        profileError.classList.remove('hidden');
        console.error('Profile update error:', error);
    } finally {
        // Reset button state
        profileForm.querySelector('button').textContent = 'Update Profile';
        profileForm.querySelector('button').disabled = false;
    }
}

function updateAuthUI(isLoggedIn) {
    // Check if auth elements exist
    if (!authLoggedOut || !authLoggedIn || !userDisplayName) {
        console.error('Auth UI elements not found');
        return;
    }
    
    if (isLoggedIn) {
        authLoggedOut.classList.add('hidden');
        authLoggedIn.classList.remove('hidden');
    } else {
        authLoggedOut.classList.remove('hidden');
        authLoggedIn.classList.add('hidden');
        userDisplayName.textContent = 'User';
    }
}

function openAuthModal(tabId = 'login-tab') {
    // Check if auth modal exists
    if (!authModal || !loginForm || !signupForm || !loginError || !signupError) {
        console.error('Auth modal elements not found');
        return;
    }
    
    // Reset forms
    loginForm.reset();
    signupForm.reset();
    loginError.classList.add('hidden');
    signupError.classList.add('hidden');
    
    // Set active tab
    activateAuthTab(tabId);
    
    // Show modal
    authModal.classList.remove('hidden');
}

function openProfileModal() {
    if (!currentUser || !profileModal) {
        console.error('Cannot open profile modal: user not logged in or modal element not found');
        return;
    }
    
    // Update profile form with current data
    updateProfileForm();
    
    // Reset messages
    if (profileError) profileError.classList.add('hidden');
    if (profileSuccess) profileSuccess.classList.add('hidden');
    
    // Show modal
    profileModal.classList.remove('hidden');
}

function updateProfileForm() {
    if (!currentUser) return;
    
    // Get necessary DOM elements
    const profileEmailElement = document.getElementById('profile-email');
    const profileCreatedAtElement = document.getElementById('profile-created-at');
    const profileDisplayNameInput = document.getElementById('profile-display-name');
    const profileBioInput = document.getElementById('profile-bio');
    
    // Check if elements exist
    if (!profileEmailElement || !profileCreatedAtElement || !profileDisplayNameInput || !profileBioInput) {
        console.error('Profile form elements not found');
        return;
    }
    
    // Set profile email
    profileEmailElement.textContent = currentUser.email;
    
    if (userProfile) {
        // Format created_at date if available
        let createdAt = userProfile.created_at || '';
        if (createdAt) {
            try {
                const dt = new Date(createdAt);
                createdAt = dt.toLocaleString();
            } catch (e) {
                console.error('Error formatting date:', e);
            }
        }
        
        // Set profile created date
        profileCreatedAtElement.textContent = createdAt || 'N/A';
        
        // Set form values
        profileDisplayNameInput.value = userProfile.display_name || '';
        profileBioInput.value = userProfile.bio || '';
    }
}

function activateAuthTab(tabId) {
    // Hide all tab contents
    authTabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    authTabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Activate the selected tab
    const tabElement = document.getElementById(tabId);
    const tabButton = document.querySelector(`.auth-tab-button[data-tab="${tabId}"]`);
    
    if (tabElement) {
        tabElement.classList.add('active');
    } else {
        console.error(`Auth tab content with id ${tabId} not found`);
    }
    
    if (tabButton) {
        tabButton.classList.add('active');
    } else {
        console.error(`Auth tab button for tab ${tabId} not found`);
    }
}

function activateTab(tabId) {
    // Hide all tab panes
    tabPanes.forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Activate the selected tab
    const tabPane = document.getElementById(tabId);
    const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    
    if (tabPane) {
        tabPane.classList.add('active');
    } else {
        console.error(`Tab pane with id ${tabId} not found`);
    }
    
    if (tabButton) {
        tabButton.classList.add('active');
    } else {
        console.error(`Tab button for tab ${tabId} not found`);
    }
}

// Discover API endpoints by scanning ports
async function discoverAPIs() {
    try {
        // Show loading state
        showLoading();
        
        await Promise.all([
            discoverAPI('main', MAIN_API_PORT_RANGE.start, MAIN_API_PORT_RANGE.end),
            discoverAPI('prediction', PREDICTION_API_PORT_RANGE.start, PREDICTION_API_PORT_RANGE.end)
        ]);
        
        if (!MAIN_API_URL || !PREDICTION_API_URL) {
            showError("Could not connect to one or more API services. Please make sure they are running.");
        } else {
            console.log('APIs discovered:', MAIN_API_URL, PREDICTION_API_URL);
            hideError();
            hideLoading();
        }
    } catch (error) {
        console.error('Error discovering APIs:', error);
        showError("Failed to connect to API services: " + error.message);
    }
}

// Scan ports to find API endpoints
async function discoverAPI(type, startPort, endPort) {
    for (let port = startPort; port <= endPort; port++) {
        const baseUrl = `http://localhost:${port}`;
        try {
            const response = await fetch(`${baseUrl}/health`, { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                timeout: 500  // Short timeout for quick scanning
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'ok' && data.type === type) {
                    if (type === 'main') {
                        MAIN_API_URL = `${baseUrl}/api`;
                    } else if (type === 'prediction') {
                        PREDICTION_API_URL = `${baseUrl}/api`;
                    }
                    return true;
                }
            }
        } catch (error) {
            // Silently fail - just try next port
            console.debug(`No API at port ${port}: ${error.message}`);
        }
    }
    
    console.error(`Could not find ${type} API in port range ${startPort}-${endPort}`);
    return false;
}

// Original checkAPIStatus function modified to use discovered URLs
async function checkAPIStatus() {
    if (!MAIN_API_URL || !PREDICTION_API_URL) {
        showError("API URLs not discovered. Please refresh the page or check if the API servers are running.");
        return false;
    }
    
    try {
        // Check both APIs
        const mainAPIStatus = await fetchWithErrorHandling(`${MAIN_API_URL}/status`);
        const predictionAPIStatus = await fetchWithErrorHandling(`${PREDICTION_API_URL}/status`);
        
        if (mainAPIStatus && predictionAPIStatus) {
            console.log('All APIs are running');
            return true;
        } else {
            throw new Error('One or more APIs are not running');
        }
    } catch (error) {
        console.error('API Status Check Failed:', error);
        showError(`Could not connect to API servers: ${error.message}`);
        return false;
    }
}

// Fetch with better error handling and timeout
async function fetchWithErrorHandling(url, options = {}) {
    // Add default timeout if not specified
    const fetchOptions = {
        ...options,
        timeout: options.timeout || 8000 // 8 second timeout default
    };
    
    try {
        console.log(`Fetching: ${url}`);
        
        // Create AbortController for timeout management
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), fetchOptions.timeout);
        
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}):`, errorText);
            throw new Error(`API returned ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        
        // Handle different types of errors with specific messages
        let errorMessage = 'Unknown error occurred';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. The server did not respond in time.';
        } else if (error.message.includes('NetworkError')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Failed to connect to the server. Is the API running?';
        } else {
            errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
    }
}

// Form Submission Handler
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!mapCodeInput) {
        console.error('Map code input field not found');
        return;
    }
    
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
        
        // Add detailed logging of received data
        console.log('Island Data received:', islandData);
        console.log('Prediction Data received:', predictionData);
        
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
    try {
        if (!PREDICTION_API_URL) {
            console.error('Prediction API URL not set');
            return { error: 'Prediction API not available' };
        }
        
        showLoading();
        const data = await fetchWithErrorHandling(`${PREDICTION_API_URL}/predict/${mapCode}`);
        return data || { error: 'Failed to fetch prediction data' };
    } catch (error) {
        console.error('Error fetching predictions:', error);
        return { 
            error: `Failed to fetch prediction data: ${error.message}`,
            predictions: [] // Add empty predictions array for safer handling
        };
    } finally {
        hideLoading();
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
    // Safely handle apiData which may be missing or in different formats
    const apiData = data.api_data || data.island_data || {};
    
    // Get all needed elements using the safe helpers
    const islandTitleElement = safeGetElement('island-title');
    const islandCreatorElement = safeGetElement('island-creator');
    const islandCodeElement = safeGetElement('island-code');
    const islandDescriptionElement = safeGetElement('island-description-text');
    const islandPublishedElement = safeGetElement('island-published');
    const islandVersionElement = safeGetElement('island-version');
    const tagsContainer = safeGetElement('tags-container');
    
    // Check if enough required elements exist to continue
    if (!islandTitleElement && !islandCreatorElement && !islandCodeElement) {
        console.error('Multiple required island info elements not found in the DOM');
        return;
    }
    
    // Update island details with null checks
    if (islandTitleElement) {
        islandTitleElement.textContent = apiData.title || 'Unknown Island';
    }
    
    // Check if the span element exists in islandCreatorElement
    if (islandCreatorElement) {
        const creatorSpan = safeGetChildElement(islandCreatorElement, 'span');
        if (creatorSpan) {
            creatorSpan.textContent = apiData.creator || 'Unknown';
        }
    }
    
    // Check if the span element exists in islandCodeElement
    if (islandCodeElement) {
        const codeSpan = safeGetChildElement(islandCodeElement, 'span');
        if (codeSpan) {
            codeSpan.textContent = data.map_code || '';
        }
    }
    
    if (islandDescriptionElement) {
        islandDescriptionElement.textContent = apiData.description || 'No description available';
    }
    
    if (islandPublishedElement) {
        islandPublishedElement.textContent = apiData.publishedDate || 'Unknown';
    }
    
    if (islandVersionElement) {
        islandVersionElement.textContent = apiData.version || 'Unknown';
    }
    
    // Update tags if container exists
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        
        if (apiData.tags && Array.isArray(apiData.tags) && apiData.tags.length > 0) {
            apiData.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.classList.add('tag');
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
        } else {
            tagsContainer.innerHTML = '<p>No tags available</p>';
        }
    }
}

// Update Player Stats Tab
function updatePlayerStats(data) {
    console.log('Updating player stats with data:', data);
    
    // Handle various data formats that might come from the API
    let playerData = [];
    
    if (data.player_data) {
        // If player_data is already an array, use it directly
        if (Array.isArray(data.player_data)) {
            playerData = data.player_data;
            console.log('Player data is an array with length:', playerData.length);
        } 
        // If it's an object with numeric keys (like {"0": {...}, "1": {...}}), convert to array
        else if (typeof data.player_data === 'object') {
            playerData = Object.values(data.player_data);
            console.log('Converted object player_data to array with length:', playerData.length);
        }
    } else if (data.scraped_data) {
        // Check for legacy data format with scraped_data structure
        console.log('Legacy data format detected (scraped_data)');
        if (Array.isArray(data.scraped_data)) {
            const scrapedData = data.scraped_data[0] || {};
            if (scrapedData.player_stats) {
                console.log('Using player_stats from scraped_data');
                // Create compatible structure from legacy format
                playerData = scrapedData.table_rows || [];
            }
        } else if (typeof data.scraped_data === 'object') {
            const scrapedData = data.scraped_data || {};
            if (scrapedData.player_stats) {
                console.log('Using player_stats from scraped_data object');
                // Create compatible structure from legacy format
                playerData = scrapedData.table_rows || [];
            }
        }
    }
    
    console.log('Processed player data:', playerData);
    
    const statsCardsContainer = document.getElementById('stats-cards-container');
    const playerDataTable = document.getElementById('player-data-table');
    const playerStatsDiv = document.getElementById('player-stats');
    
    // Check if the elements exist before using them
    if (!statsCardsContainer) {
        console.error('stats-cards-container element not found');
        tryCreateErrorMessage('Unable to display player stats container. Please try refreshing the page.');
        return;
    }
    
    // Clear previous content
    statsCardsContainer.innerHTML = '';
    
    // Check if player-data-table exists
    if (!playerDataTable) {
        console.error('player-data-table element not found');
        tryCreateErrorMessage('Unable to display player data table. Please try refreshing the page.');
        return;
    }
    
    const tableBody = playerDataTable.querySelector('tbody');
    if (!tableBody) {
        console.error('tbody element not found in player-data-table');
        tryCreateErrorMessage('Unable to display player data. Please try refreshing the page.');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (!playerStatsDiv) {
        console.error('player-stats element not found');
        tryCreateErrorMessage('Unable to display player stats. Please try refreshing the page.');
        return;
    }
    
    if (!playerData || playerData.length === 0) {
        playerStatsDiv.innerHTML = '<p>No player data available for this island.</p>';
        console.warn('No player data available to display');
        return;
    }
    
    // Calculate summary stats
    try {
        console.log('Calculating summary stats from player data');
        
        // Function to safely extract numeric values from different data formats
        const extractNumber = (entry, key) => {
            if (entry[key] !== undefined) {
                return safeParseInt(entry[key]);
            } else if (entry.peak_players !== undefined && key === 'peakPlayers') {
                return safeParseInt(entry.peak_players);
            } else if (entry.avg_players !== undefined && key === 'avgPlayers') {
                return safeParseInt(entry.avg_players);
            } else if (entry.player_gain !== undefined && key === 'playerGain') {
                return safeParseInt(entry.player_gain);
            } else if (entry.peak !== undefined && key === 'peakPlayers') {
                return safeParseInt(entry.peak);
            } else if (entry.average !== undefined && key === 'avgPlayers') {
                return safeParseInt(entry.average);
            } else if (entry.gain !== undefined && key === 'playerGain') {
                return safeParseInt(entry.gain);
            }
            return 0;
        };
        
        // Function to extract time label from different data formats
        const extractTimeLabel = (entry) => {
            return entry.time_label || entry.time || 'Unknown';
        };
        
        const peakPlayers = Math.max(...playerData.map(entry => extractNumber(entry, 'peakPlayers')));
        const avgPlayers = Math.round(playerData.reduce((sum, entry) => sum + extractNumber(entry, 'avgPlayers'), 0) / playerData.length);
        const totalPlayerGain = playerData.reduce((sum, entry) => sum + extractNumber(entry, 'playerGain'), 0);
        
        console.log('Calculated stats - Peak:', peakPlayers, 'Avg:', avgPlayers, 'Gain:', totalPlayerGain);
        
        // Create stats cards
        const statsCards = [
            { label: 'Peak Players', value: peakPlayers.toLocaleString() },
            { label: 'Average Players', value: avgPlayers.toLocaleString() },
            { label: 'Total Player Gain', value: totalPlayerGain > 0 ? `+${totalPlayerGain.toLocaleString()}` : totalPlayerGain.toLocaleString() }
        ];
        
        statsCards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.classList.add('stat-card');
            cardEl.innerHTML = `
                <div class="stat-value">${card.value}</div>
                <div class="stat-label">${card.label}</div>
            `;
            statsCardsContainer.appendChild(cardEl);
        });
        
        // Create table rows and collect chart data
        const tableRows = [];
        
        playerData.forEach(entry => {
            const timeLabel = extractTimeLabel(entry);
            const peakValue = extractNumber(entry, 'peakPlayers');
            const avgValue = extractNumber(entry, 'avgPlayers');
            const gainValue = extractNumber(entry, 'playerGain');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${timeLabel}</td>
                <td>${peakValue.toLocaleString()}</td>
                <td>${avgValue.toLocaleString()}</td>
                <td class="${gainValue >= 0 ? 'positive' : 'negative'}">${gainValue >= 0 ? `+${gainValue.toLocaleString()}` : gainValue.toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
            
            tableRows.push({
                time: timeLabel,
                peakPlayers: peakValue,
                avgPlayers: avgValue,
                playerGain: gainValue
            });
        });
        
        console.log('Created table rows:', tableRows);
        
        // Create chart with the data
        createPlayerChart(tableRows);
    } catch (error) {
        console.error('Error processing player data:', error);
        playerStatsDiv.innerHTML = '<p>Error processing player data. Please try again.</p>';
    }
}

// Create player chart
function createPlayerChart(tableRows) {
    const canvas = document.getElementById('player-chart');
    if (!canvas) {
        console.error('player-chart canvas element not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context from player-chart canvas');
        return;
    }
    
    // Sort data chronologically if possible
    tableRows.sort((a, b) => {
        const timeA = a.time;
        const timeB = b.time;
        return timeA.localeCompare(timeB);
    });
    
    // Prepare data for the chart
    const labels = tableRows.map(row => row.time);
    const peakData = tableRows.map(row => row.peakPlayers);
    const avgData = tableRows.map(row => row.avgPlayers);
    
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
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Average Players',
                    data: avgData,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

// Update Predictions Tab
function updatePredictions(data) {
    console.log('Prediction data received:', data);
    
    // Handle error state or empty data
    if (data.error || !data) {
        const explanationsContainer = safeGetElement('prediction-explanations');
        if (explanationsContainer) {
            explanationsContainer.innerHTML = `<p class="error-message">Error: ${data.error || 'Failed to receive valid prediction data'}</p>`;
            
            // Add debug button to inspect data structure
            const debugBtn = document.createElement('button');
            debugBtn.className = 'debug-btn';
            debugBtn.textContent = 'Show Raw Data';
            debugBtn.onclick = function() {
                alert(JSON.stringify(data, null, 2));
            };
            explanationsContainer.appendChild(debugBtn);
        }
        
        // Clear chart if it exists
        if (predictionChart) {
            predictionChart.destroy();
            predictionChart = null;
        }
        
        // Set default values for counters and meters
        const bestPlayerCountEl = safeGetElement('best-player-count');
        const confidenceValueEl = safeGetElement('confidence-value');
        const confidenceBarEl = safeGetElement('confidence-bar');
        
        if (bestPlayerCountEl) bestPlayerCountEl.textContent = '0';
        if (confidenceValueEl) confidenceValueEl.textContent = '0%';
        if (confidenceBarEl) confidenceBarEl.style.width = '0%';
        
        return;
    }

    // Enhanced nested data structure handling
    // There are multiple ways the prediction data could be structured:
    // 1. Direct response where data itself contains all fields
    // 2. Nested response where data.predictions is an object containing fields
    // 3. Response where data has a predictions array but other metadata at the top level
    let predictionsData = data;
    let predictionsArray = [];
    
    // Detect structure case 2: data.predictions is an object containing fields
    if (data.predictions && typeof data.predictions === 'object' && !Array.isArray(data.predictions)) {
        console.log('Case 2: Using nested predictions data structure');
        predictionsData = data.predictions;
    }
    
    // Find the predictions array, which could be in multiple places:
    if (Array.isArray(predictionsData.predictions)) {
        // Case 3: predictionsData has a predictions array property
        console.log('Case 3: Using predictions array property');
        predictionsArray = predictionsData.predictions;
    } else if (Array.isArray(data.predictions)) {
        // Alternative case 3: data has a predictions array property
        console.log('Alt Case 3: Using top-level predictions array');
        predictionsArray = data.predictions;
    } else if (predictionsData.historical && Array.isArray(predictionsData.historical)) {
        // Could be predictions in a historical array
        console.log('Using historical array for predictions');
        predictionsArray = predictionsData.historical.filter(item => item.is_prediction);
        
        // If no predictions were found in historical data, use all items
        if (predictionsArray.length === 0) {
            predictionsArray = predictionsData.historical;
        }
    }
    
    // Log the detected structure
    console.log('Using predictionsData:', predictionsData);
    console.log('Using predictionsArray:', predictionsArray);
    
    // If we have no valid predictions, show an error
    if (!predictionsArray || predictionsArray.length === 0) {
        const explanationsContainer = safeGetElement('prediction-explanations');
        if (explanationsContainer) {
            explanationsContainer.innerHTML = `<p class="error-message">No valid predictions available</p>`;
            
            // Add debug button to inspect data structure
            const debugBtn = document.createElement('button');
            debugBtn.className = 'debug-btn';
            debugBtn.textContent = 'Show Raw Data';
            debugBtn.onclick = function() {
                alert(JSON.stringify(data, null, 2));
            };
            explanationsContainer.appendChild(debugBtn);
        }
        return;
    }
    
    // Safe extraction of values with defaults
    // Try multiple potential property names for best player count
    const bestPlayerCount = 
        predictionsData.best_player_count || 
        data.best_player_count || 
        predictionsData.recommended_players || 
        data.recommended_players || 
        0;
    
    // Try multiple potential property names for confidence score
    const confidence = 
        predictionsData.confidence_score || 
        data.confidence_score || 
        predictionsData.confidence || 
        data.confidence || 
        0.7; // Default to 70% if no confidence is provided
    
    console.log('Using player count:', bestPlayerCount, 'confidence:', confidence);
    
    // Update summary card with null checks
    const bestPlayerCountEl = safeGetElement('best-player-count');
    const confidenceValueEl = safeGetElement('confidence-value');
    const confidenceBarEl = safeGetElement('confidence-bar');
    
    if (bestPlayerCountEl) bestPlayerCountEl.textContent = bestPlayerCount.toLocaleString();
    if (confidenceValueEl) confidenceValueEl.textContent = `${Math.round(confidence * 100)}%`;
    if (confidenceBarEl) confidenceBarEl.style.width = `${confidence * 100}%`;
    
    // Update explanation with null check
    const explanationsContainer = safeGetElement('prediction-explanations');
    
    if (explanationsContainer) {
        explanationsContainer.innerHTML = '';
        
        // Add debug button to inspect data structure
        const debugBtn = document.createElement('button');
        debugBtn.className = 'debug-btn';
        debugBtn.textContent = 'Debug Data';
        debugBtn.onclick = function() {
            alert(JSON.stringify(data, null, 2));
        };
        
        // Find explanations from multiple possible locations
        const explanations = 
            (predictionsData.explanations && Array.isArray(predictionsData.explanations)) ? predictionsData.explanations :
            (data.explanations && Array.isArray(data.explanations)) ? data.explanations :
            (predictionsData.explanation) ? [predictionsData.explanation] :
            (data.explanation) ? [data.explanation] :
            ['No explanation available for this prediction.'];
        
        // Render explanations
        explanations.forEach(explanation => {
            const p = document.createElement('p');
            p.textContent = explanation;
            explanationsContainer.appendChild(p);
        });
        
        // Add warning if present (checking multiple locations)
        const warning = predictionsData.warning || data.warning;
        if (warning) {
            const warningEl = document.createElement('p');
            warningEl.className = 'warning-message';
            warningEl.textContent = warning;
            explanationsContainer.appendChild(warningEl);
        }
        
        // Add the debug button at the end
        explanationsContainer.appendChild(debugBtn);
    }
    
    // Create chart with prediction data
    createPredictionChart(predictionsArray);
}

// Create prediction chart
function createPredictionChart(predictions) {
    console.log('Creating prediction chart with data:', predictions);
    
    const canvas = document.getElementById('prediction-chart');
    if (!canvas) {
        console.error('prediction-chart canvas element not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2d context from prediction-chart canvas');
        return;
    }
    
    // Add validation to ensure predictions is an array
    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
        console.error('No valid prediction data to chart');
        if (predictionChart) {
            predictionChart.destroy();
            predictionChart = null;
        }
        
        // Display a "no data" message in the chart area
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.fillText('No prediction data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Check if predictions have required properties
    const hasValidPredictions = predictions.every(p => 
        p.hasOwnProperty('time') && 
        (p.hasOwnProperty('value') || p.hasOwnProperty('predicted_players') || p.hasOwnProperty('yhat'))
    );
    
    if (!hasValidPredictions) {
        console.error('Prediction data missing required properties (time and value)');
        if (predictionChart) {
            predictionChart.destroy();
            predictionChart = null;
        }
        
        // Display an error message in the chart area
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.fillText('Invalid prediction data format', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Prepare data for the chart - handle different property names
    const labels = predictions.map(p => p.time || p.time_label || '');
    const predictedData = predictions.map(p => p.value || p.predicted_players || p.yhat || 0);
    
    // Use lower/upper bounds if available, otherwise fallback to +/- 10%
    const lowerBoundData = predictions.map((p, i) => {
        if (p.hasOwnProperty('lower') || p.hasOwnProperty('lower_bound')) {
            return p.lower || p.lower_bound || Math.max(0, predictedData[i] * 0.9);
        }
        return Math.max(0, predictedData[i] * 0.9);
    });
    
    const upperBoundData = predictions.map((p, i) => {
        if (p.hasOwnProperty('upper') || p.hasOwnProperty('upper_bound')) {
            return p.upper || p.upper_bound || predictedData[i] * 1.1; 
        }
        return predictedData[i] * 1.1;
    });
    
    // Log data being charted
    console.log('Chart data:', {labels, predictedData, lowerBoundData, upperBoundData});
    
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
                    label: 'Predicted Players',
                    data: predictedData,
                    borderColor: '#5643CC',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#5643CC',
                    tension: 0.4
                },
                {
                    label: 'Confidence Interval',
                    data: upperBoundData,
                    borderColor: 'rgba(86, 67, 204, 0.3)',
                    backgroundColor: 'rgba(86, 67, 204, 0.1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: '+1',
                    tension: 0.4
                },
                {
                    label: 'Lower Bound',
                    data: lowerBoundData,
                    borderColor: 'rgba(86, 67, 204, 0.3)',
                    backgroundColor: 'rgba(86, 67, 204, 0.1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        filter: function(legendItem, chartData) {
                            return legendItem.text !== 'Lower Bound';
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toLocaleString();
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Safely parse integers
function safeParseInt(value) {
    if (typeof value === 'number') return value;
    
    // Remove commas and convert 'K' to thousands
    const cleaned = String(value).replace(/,/g, '');
    if (cleaned.endsWith('K')) {
        return parseInt(parseFloat(cleaned.slice(0, -1)) * 1000);
    }
    return parseInt(cleaned) || 0;
}

// UI Helper Functions
function resetUI() {
    hideError();
    hideResults();
}

function showLoading() {
    if (loading) loading.classList.remove('hidden');
}

function hideLoading() {
    if (loading) loading.classList.add('hidden');
}

function showError(message) {
    if (!errorText || !errorMessage) {
        console.error('Error message elements not found');
        return;
    }
    
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    if (errorMessage) errorMessage.classList.add('hidden');
}

function showResults() {
    if (resultsContainer) resultsContainer.classList.remove('hidden');
}

function hideResults() {
    if (resultsContainer) resultsContainer.classList.add('hidden');
}

// Helper function to try creating an error message in the results container
function tryCreateErrorMessage(message) {
    try {
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            resultsContainer.appendChild(errorDiv);
        }
    } catch (error) {
        console.error('Failed to create error message element:', error);
    }
}

// Helper function to safely get a DOM element, logging errors if not found
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with ID "${id}" not found in the DOM`);
        return null;
    }
    return element;
}

// Helper function to safely get a child element, logging errors if not found
function safeGetChildElement(parent, selector) {
    if (!parent) return null;
    
    const element = parent.querySelector(selector);
    if (!element) {
        console.error(`Element matching selector "${selector}" not found in parent`, parent);
        return null;
    }
    return element;
} 