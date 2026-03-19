// script.js
// Purpose: Fetch, parse, and display severe weather alerts for Nova Scotia from Environment Canada.
// Features: Uses a general RSS feed (all_e.xml), filters for NS-specific alerts,
// includes a loading spinner, a refresh button, and a fallback to sample data.

const EC_GENERAL_WARNINGS_FEED_URL = "https://weather.gc.ca/rss/warnings/all_e.xml"; // Official federal warnings feed
const NS_ALERT_KEYWORDS = ["Nova Scotia", "NS"]; // Keywords to identify NS-specific alerts in titles/descriptions
const ALERTS_CONTAINER_ID = "alerts"; // ID of the div where alerts will be rendered
const LOADER_ID = "alerts-loader"; // ID of the span for the loading indicator
const REFRESH_BTN_ID = "refreshBtn"; // ID of the refresh button

// --- Helper Functions ---

/** Escapes HTML special characters for safe rendering. */
function escapeHtml(s) {
    if (!s) return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Escapes characters for safe use in HTML attributes. */
function escapeAttr(s) {
    if (!s) return "";
    return String(s)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Checks if an alert item is relevant to Nova Scotia based on keywords.
 * @param {object} item - An alert item object with title, description, etc.
 * @returns {boolean} True if the alert is likely for Nova Scotia.
 */
function isNovaScotiaAlert(item) {
    if (!item || (!item.title && !item.description)) return false;

    const titleLower = item.title ? item.title.toLowerCase() : "";
    const descriptionLower = item.description ? item.description.toLowerCase() : "";

    // Check for any of the NS keywords in the title or description
    for (const keyword of NS_ALERT_KEYWORDS) {
        if (titleLower.includes(keyword.toLowerCase()) || descriptionLower.includes(keyword.toLowerCase())) {
            return true;
        }
    }
    return false;
}

/**
 * Formats a single alert item into an HTML string for display.
 * @param {object} item - An alert item object.
 * @returns {string} HTML string for the alert item.
 */
function formatAlertItem(item) {
    const title = item.title || "Unknown Alert Title";
    // Formats the date using the user's locale settings for better readability.
    const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleString(navigator.language, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : "Unknown Date";
    
    const desc = item.description || item.content || "No description available.";
    const link = item.link || item.guid || ""; // Use guid if link is missing

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
 * Renders the generated HTML content into the alerts container element.
 * @param {string} html - The HTML string to render.
 */
function renderAlerts(html) {
    const container = document.getElementById(ALERTS_CONTAINER_ID);
    if (!container) {
        console.error(`Alerts container with ID "${ALERTS_CONTAINER_ID}" not found.`);
        return;
    }
    container.innerHTML = html;
}

/**
 * Renders a fallback alert message when live data cannot be fetched.
 */
function renderSampleFallback() {
    const sampleAlerts = [
        {
            title: "Sample Alert: Weather Update",
            pubDate: new Date().toUTCString(),
            description: `Live Nova Scotia weather alerts could not be fetched. This is a sample message. Please check the official Environment Canada website for current alerts.`,
            link: "https://weather.gc.ca/warnings/report_e.html" // Link to generic warnings page
        }
    ];
    const html = sampleAlerts.map(formatAlertItem).join("");
    renderAlerts(html);
}

/**
 * Parses raw XML/RSS text content into an array of alert item objects.
 * @param {string} text - The raw XML/RSS content.
 * @returns {Array<object>} An array of parsed alert items.
 */
function parseRSS(text) {
    const items = [];
    try {
        const parser = new DOMParser();
        // Attempt to parse as XML; "text/xml" is generally safer for RSS/feeds
        const doc = parser.parseFromString(text, "text/xml");
        const itemNodes = doc.querySelectorAll("item");
        
        itemNodes.forEach((node) => {
            const title = node.querySelector("title")?.textContent;
            const pubDate = node.querySelector("pubDate")?.textContent;
            const description = node.querySelector("description")?.textContent;
            const link = node.querySelector("link")?.textContent;
            
            items.push({ title, pubDate, description, link });
        });
    } catch (e) {
        console.error("Error parsing RSS feed:", e);
    }
    return items;
}

/**
 * Manages the visibility and state of the loading spinner and refresh button.
 * @param {boolean} isLoading - True to show the loader and disable the button, false otherwise.
 */
function setLoadingState(isLoading) {
    const loader = document.getElementById(LOADER_ID);
    const refreshBtn = document.getElementById(REFRESH_BTN_ID);

    if (loader) {
        loader.style.display = isLoading ? "inline-block" : "none";
    }
    if (refreshBtn) {
        refreshBtn.disabled = isLoading;
        refreshBtn.textContent = isLoading ? "Refreshing…" : "Refresh Alerts";
    }
}

// --- Main Logic ---

/**
 * Fetches and loads weather alerts. Attempts to use the live feed first,
 * then falls back to sample data if unsuccessful.
 */
async function loadAlerts() {
    setLoadingState(true); // Show loader and disable button
    let nsAlertsFound = [];

    try {
        // Fetch the general warnings feed
        const resp = await fetch(EC_GENERAL_WARNINGS_FEED_URL, { cache: "no-store" }); // 'no-store' to get fresh data
        
        if (resp.ok) {
            const text = await resp.text();
            const allItems = parseRSS(text);
            
            // Filter the fetched items to find alerts relevant to Nova Scotia
            nsAlertsFound = allItems.filter(isNovaScotiaAlert);
            
            if (nsAlertsFound.length > 0) {
                console.log(`Found ${nsAlertsFound.length} Nova Scotia alerts.`);
                const html = nsAlertsFound.map(formatAlertItem).join("");
                renderAlerts(html);
                setLoadingState(false); // Hide loader, enable button
                return; // Successfully loaded and rendered NS alerts
            } else {
                console.warn("Feed fetched successfully, but no Nova Scotia specific alerts were found in the current feed.");
            }
        } else {
            console.warn(`Failed to fetch feed from ${EC_GENERAL_WARNINGS_FEED_URL}. Status: ${resp.status} ${resp.statusText}`);
        }
    } catch (e) {
        console.error("An error occurred while fetching or processing the weather feed:", e);
    }

    // If we reach this point, it means live alerts couldn't be loaded or none were found for NS.
    // Fall back to displaying sample data.
    renderSampleFallback();
    setLoadingState(false); // Hide loader, enable button
}

// --- Initialization ---

// Ensure the script runs after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Perform an initial load of alerts when the page first loads
    loadAlerts();

    // Attach the loadAlerts function to the refresh button's click event
    const refreshBtn = document.getElementById(REFRESH_BTN_ID);
    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadAlerts);
    } else {
        console.error(`Refresh button with ID "${REFRESH_BTN_ID}" not found in the DOM.`);
    }
});