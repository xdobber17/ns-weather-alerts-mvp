// script.js
// Purpose: Fetches, parses, and displays severe weather alerts for Nova Scotia from Environment Canada.
// Implements robust fetching using a general federal RSS feed, filters for NS alerts,
// includes a loading spinner, a refresh button, and a fallback to sample data.

// Configuration constants
const EC_GENERAL_WARNINGS_FEED_URL = "https://weather.gc.ca/rss/warnings/all_e.xml"; // Official federal warnings feed URL
const NS_ALERT_KEYWORDS = ["Nova Scotia", "NS"]; // Keywords to identify NS-specific alerts in titles/descriptions
const ALERTS_CONTAINER_ID = "alerts"; // ID of the HTML div where alerts will be rendered
const LOADER_ID = "alerts-loader"; // ID of the HTML span for the loading indicator
const REFRESH_BTN_ID = "refreshBtn"; // ID of the refresh button element

// --- Helper Functions ---

/** Escapes HTML special characters to prevent XSS and ensure safe rendering. */
function escapeHtml(s) {
    if (!s) return "";
    // Basic sanitization: replace HTML special characters with their entity equivalents.
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Escapes characters for safe use in HTML attributes (e.g., href). */
function escapeAttr(s) {
    if (!s) return "";
    // Similar to escapeHtml, but specifically for attribute contexts.
    return String(s)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Determines if an alert item is relevant to Nova Scotia.
 * It checks for specified keywords in the alert's title and description.
 * @param {object} item - An alert item object containing alert details.
 * @returns {boolean} True if the alert is identified as relevant to Nova Scotia.
 */
function isNovaScotiaAlert(item) {
    if (!item || (!item.title && !item.description)) return false;

    const titleLower = item.title ? item.title.toLowerCase() : "";
    const descriptionLower = item.description ? item.description.toLowerCase() : "";

    // Iterate through keywords to find a match in either title or description.
    for (const keyword of NS_ALERT_KEYWORDS) {
        if (titleLower.includes(keyword.toLowerCase()) || descriptionLower.includes(keyword.toLowerCase())) {
            return true;
        }
    }
    return false;
}

/**
 * Formats a single parsed alert item into an HTML string ready for display.
 * Includes title, date, description, and a link if available.
 * @param {object} item - A parsed alert item object.
 * @returns {string} HTML string representing the formatted alert.
 */
function formatAlertItem(item) {
    const title = item.title || "Unknown Alert Title";
    // Format date to a user-friendly, locale-aware string.
    const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleString(navigator.language, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : "Unknown Date";
    
    const desc = item.description || item.content || "No description available.";
    const link = item.link || item.guid || ""; // Use guid as a fallback for link if not present.

    return `
        <div class="alert-item">
            <div class="alert-title">${escapeHtml(title)}</div>
            <div class="alert-date">${escapeHtml(pubDate)}</div>
            <div class="alert-desc">${escapeHtml(desc)}</div>
            ${link ? `<div class="alert-link"><a href="${escapeAttr(link)}" target="_blank" rel="noreferrer">More details</a></div>` : ""}
        </div>
    `;
}

/**
 * Renders the generated HTML content into the specified alerts container element on the page.
 * @param {string} html - The compiled HTML string for all alerts.
 */
function renderAlerts(html) {
    const container = document.getElementById(ALERTS_CONTAINER_ID);
    if (!container) {
        console.error(`Alerts container with ID "${ALERTS_CONTAINER_ID}" not found. Ensure it exists in your HTML.`);
        return;
    }
    container.innerHTML = html;
}

/**
 * Renders a predefined sample alert message. Used as a fallback when live data fetching fails.
 */
function renderSampleFallback() {
    const sampleAlerts = [
        {
            title: "Sample Alert: Weather Update",
            pubDate: new Date().toUTCString(), // Use current time for sample
            description: `Live Nova Scotia weather alerts could not be fetched at this time. This is a sample message. Please check the official Environment Canada website for current alerts.`,
            link: "https://weather.gc.ca/warnings/report_e.html" // Link to generic EC warnings page
        }
    ];
    const html = sampleAlerts.map(formatAlertItem).join("");
    renderAlerts(html);
}

/**
 * Parses raw XML/RSS text content into an array of structured alert item objects.
 * Handles potential parsing errors gracefully.
 * @param {string} text - The raw XML/RSS content fetched from the feed.
 * @returns {Array<object>} An array of parsed alert items, or an empty array on error.
 */
function parseRSS(text) {
    const items = [];
    try {
        const parser = new DOMParser();
        // Parse the text content as XML to correctly interpret feed structure.
        const doc = parser.parseFromString(text, "text/xml");
        const itemNodes = doc.querySelectorAll("item"); // Standard RSS/Atom tag for individual entries.
        
        itemNodes.forEach((node) => {
            const title = node.querySelector("title")?.textContent;
            const pubDate = node.querySelector("pubDate")?.textContent;
            const description = node.querySelector("description")?.textContent;
            const link = node.querySelector("link")?.textContent;
            
            items.push({ title, pubDate, description, link });
        });
    } catch (e) {
        console.error("Error parsing RSS feed content:", e);
    }
    return items;
}

/**
 * Manages the UI state for the loading spinner and the refresh button.
 * Shows/hides the spinner and enables/disables the button based on the loading status.
 * @param {boolean} isLoading - If true, shows the loader and disables the button; if false, hides loader and enables button.
 */
function setLoadingState(isLoading) {
    const loader = document.getElementById(LOADER_ID);
    const refreshBtn = document.getElementById(REFRESH_BTN_ID);

    if (loader) {
        loader.style.display = isLoading ? "inline-block" : "none"; // Show spinner
    }
    if (refreshBtn) {
        refreshBtn.disabled = isLoading; // Disable button while loading
        refreshBtn.textContent = isLoading ? "Refreshing…" : "Refresh Alerts"; // Update button text
    }
}

// --- Main Logic ---

/**
 * Orchestrates the process of fetching and loading weather alerts.
 * It first tries to fetch live data, filters it for Nova Scotia, and renders it.
 * If live data is unavailable or no NS alerts are found, it falls back to sample data.
 */
async function loadAlerts() {
    setLoadingState(true); // Start loading: show spinner, disable button
    let nsAlertsFound = []; // Array to store found Nova Scotia alerts

    try {
        // Attempt to fetch the general warnings feed.
        // 'no-store' cache directive ensures we always try to get fresh data.
        const resp = await fetch(EC_GENERAL_WARNINGS_FEED_URL, { cache: "no-store" });
        
        if (resp.ok) { // Check if the HTTP request was successful (status code 2xx)
            const text = await resp.text(); // Get the response body as text
            const allItems = parseRSS(text); // Parse the text into alert items
            
            // Filter the fetched items to find only those relevant to Nova Scotia.
            nsAlertsFound = allItems.filter(isNovaScotiaAlert);
            
            if (nsAlertsFound.length > 0) {
                console.log(`Found ${nsAlertsFound.length} Nova Scotia alerts from the feed.`);
                const html = nsAlertsFound.map(formatAlertItem).join(""); // Format each alert and join into a single HTML string
                renderAlerts(html); // Render the live alerts
                setLoadingState(false); // Loading complete: hide spinner, enable button
                return; // Exit function as alerts were successfully loaded and rendered
            } else {
                // Feed fetched and parsed, but no NS-specific alerts were identified.
                console.warn("Environment Canada feed fetched, but no Nova Scotia specific alerts were found.");
            }
        } else {
            // Handle non-OK HTTP responses (e.g., 404, 500).
            console.warn(`Failed to fetch feed from ${EC_GENERAL_WARNINGS_FEED_URL}. Status: ${resp.status} ${resp.statusText}`);
        }
    } catch (e) {
        // Catch any network errors or other exceptions during fetch/processing.
        console.error("An error occurred while fetching or processing the weather feed:", e);
    }

    // If we reach this point, it means live data was not successfully loaded or no NS alerts were found.
    // Fallback to displaying sample data to maintain UI functionality.
    renderSampleFallback();
    setLoadingState(false); // Ensure loading state is reset even after fallback
}

// --- Initialization ---

// Ensure the script runs only after the entire HTML document has been loaded and parsed.
document.addEventListener("DOMContentLoaded", () => {
    // Perform an initial load of alerts when the page first loads.
    loadAlerts();

    // Set up the event listener for the refresh button.
    const refreshBtn = document.getElementById(REFRESH_BTN_ID);
    if (refreshBtn) {
        // When the refresh button is clicked, call the loadAlerts function.
        refreshBtn.addEventListener("click", loadAlerts);
    } else {
        console.error(`Refresh button with ID "${REFRESH_BTN_ID}" not found in the DOM. The refresh functionality will not work.`);
    }
});