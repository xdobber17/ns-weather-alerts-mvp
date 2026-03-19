// script.js

// --- Configuration & Constants ---
// In a real Vercel deployment, API keys should be stored as environment variables
// accessible via process.env. For local development, use a .env file with a tool like 'dotenv'.
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'YOUR_EC_API_KEY_HERE'; // Replace or set env var
const EC_API_BASE_URL = 'https://api.weather.gc.ca/weather/weather_forecasts/hourly'; // Example base URL for EC hourly data
// NOTE: You may need to find the correct EC API endpoint and potentially use a specific location code or lat/lon.
// Example search might involve: "Environment Canada weather API", "EC weather data access".
// Public data might not require an API key, or it might be for specific services.
// This example assumes a direct fetch might work for public data or a proxied endpoint.

const TARGET_LOCATION_LAT = 45.0; // Example: Approximate latitude for Nova Scotia
const TARGET_LOCATION_LON = -63.0; // Example: Approximate longitude for Nova Scotia

// --- Sample Data for Fallback ---
const sampleWeatherData = {
    location: "Halifax, NS",
    temperature: "10°C",
    condition: "Partly Cloudy",
    humidity: "60%",
    wind: "20 km/h NW",
    pressure: "1012 hPa",
    uvIndex: "3 (Moderate)"
};

const sampleAlerts = [
    {
        id: "alert-ns-001",
        level: "Warning",
        message: "Strong winds expected along the Atlantic coast this evening. Small craft warning in effect.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
        source: "Environment Canada"
    },
    {
        id: "alert-ns-002",
        level: "Information",
        message: "Ideal lobster fishing conditions predicted for tomorrow morning.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        source: "Marine Forecast"
    }
];

// --- DOM Elements ---
const weatherDisplay = document.getElementById('weather-display');
const alertLog = document.getElementById('alert-log');

// --- Helper Functions ---

/**
 * Safely gets a nested property from an object.
 * @param {object} obj - The object to traverse.
 * @param {string[]} path - Array of keys.
 * @param {*} defaultValue - Value to return if path not found.
 * @returns {*} The value at the path or the default value.
 */
function getNested(obj, path, defaultValue = 'N/A') {
    return path.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : defaultValue, obj);
}

/**
 * Formats temperature.
 * @param {number} tempC - Temperature in Celsius.
 * @returns {string} Formatted temperature string.
 */
function formatTemperature(tempC) {
    return `${tempC.toFixed(1)}°C`;
}

/**
 * Formats wind speed.
 * @param {number} speedKph - Speed in km/h.
 * @param {string} direction - Wind direction.
 * @returns {string} Formatted wind string.
 */
function formatWind(speedKph, direction) {
    return `${speedKph.toFixed(0)} km/h ${direction}`;
}

/**
 * Formats pressure.
 * @param {number} pressureHpa - Pressure in hPa.
 * @returns {string} Formatted pressure string.
 */
function formatPressure(pressureHpa) {
    return `${pressureHpa.toFixed(0)} hPa`;
}


// --- Core Functions ---

/**
 * Renders the current weather data to the page.
 * @param {object} data - Weather data object.
 */
function displayWeather(data) {
    if (!weatherDisplay) {
        console.error("Weather display element not found.");
        return;
    }
    weatherDisplay.innerHTML = `
        <p>Location: <strong>${data.location}</strong></p>
        <p>
