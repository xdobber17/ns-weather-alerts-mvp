// script.js
// This script fetches severe weather alerts for Nova Scotia from Environment Canada's RSS feeds,
// parses them, displays them, and includes a refresh button with a loading indicator.

const EC_WARNINGS_FEED_URL = "https://weather.gc.ca/rss/warnings/all_e.xml"; // General federal warnings feed
const NS_REGION_KEYWORDS = ["Nova Scotia", "NS"]; // Keywords to identify NS-specific alerts
const ALERTS_CONTAINER_ID = "alerts";
const LOADER_ID = "alerts-loader";
const REFRESH_BTN_ID = "refreshBtn";

// --- Helper Functions ---
function escapeHtml(s) {
    if (!s) return "";
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeAttr(s) {
    if (!s) return "";
    return String(s)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Checks if an alert item is relevant to Nova Scotia
function isNovaScotiaAlert(item) {
    const title = item.title ? item.title.toLowerCase() : "";
    const description = item.description ? item.description.toLowerCase() : "";
    
    // Check for keywords in title or description
    for (const keyword of NS_REGION_KEYWORDS) {
        if (title.includes(keyword.toLowerCase()) || description.includes(keyword.toLowerCase())) {
            return true;
        }
    }
    return false;
}

function formatAlertItem(item) {
    const title = item.title || "Unknown Alert Title";
    // Attempt to format date more cleanly for the user
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

function renderAlerts(html) {
    const container = document.getElementById(ALERTS_CONTAINER_ID);
    if (!container) {
        console.error(`Alerts container with ID "${ALERTS_CONTAINER_ID}" not found.`);
        return;
    }
    container.innerHTML = html;
}

function renderSampleFallback() {
    const sampleAlerts = [
        {
            title: "Sample Alert: Weather Advisory",
            pubDate: new Date().toUTCString(),
            description: `This is a sample alert. The live feed for Nova Scotia severe weather alerts via Environment Canada may be temporarily unavailable.`,
            link: "https://weather.gc.ca/warnings/report_e.html" // Link to generic warnings page
        }
    ];
    const html = sampleAlerts.map(formatAlertItem).join("");
    renderAlerts(html);
}

// Parses RSS/XML content. Returns an array of alert items.
function parseRSS(text) {
    const items = [];
    try {
        const parser = new DOMParser();
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

// Manages UI state for loading
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
async function loadAlerts() {
    setLoadingState(true);
    let foundAlerts = [];

    try {
        // Attempt to fetch the general warnings feed
        const resp = await fetch(EC_WARNINGS_FEED_URL, { cache: "no-store" });
        
        if (resp.ok) {
            const text = await resp.text();
            const allItems = parseRSS(text);
            
            // Filter for Nova Scotia specific alerts
            foundAlerts = allItems.filter(isNovaScotiaAlert);
            
            if (foundAlerts.length > 0) {
                const html = foundAlerts.map(formatAlertItem).join("");
                renderAlerts(html);
                setLoadingState(false);
                return; // Successfully loaded and rendered NS alerts
            } else {
                // Feed fetched, parsed, but no NS alerts found.
                console.warn("No Nova Scotia specific alerts found in the feed.");
            }
        } else {
            console.warn(`Failed to fetch feed from ${EC_WARNINGS_FEED_URL}: ${resp.status} ${resp.statusText}`);
        }
    } catch (e) {
        console.error("Error fetching or processing weather feed:", e);
    }

    // If no live alerts were loaded and rendered, fall back to sample data
    renderSampleFallback();
    setLoadingState(false);
}

// Initialize event listeners when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Initial load of alerts
    loadAlerts();

    // Setup refresh button functionality
    const refreshBtn = document.getElementById(REFRESH_BTN_ID);
    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadAlerts);
    } else {
        console.error(`Refresh button with ID "${REFRESH_BTN_ID}" not found.`);
    }
});