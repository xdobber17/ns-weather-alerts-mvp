// script.js
// Assumes you have an element with id="alerts" to render alerts
// and a button with id="refreshBtn" to reload data.

const RSS_URL_NS = "https://weather.gc.ca/rss/alerts/ns_e.xml"; // Environment Canada NS alerts RSS
const ALERTS_CONTAINER_ID = "alerts";

function formatAlertItem(item) {
  // Normalize an RSS item into a displayable alert
  // item: object from parseRSS (title, pubDate, description/link)
  const title = item.title || "Severe Weather Alert";
  const date = item.pubDate ? new Date(item.pubDate).toLocaleString() : "";
  const desc = item.description || item.content || "";
  const link = item.link || item.guid || "";

  return `
    <div class="alert-item">
      <div class="alert-title">${escapeHtml(title)}</div>
      <div class="alert-date">${escapeHtml(date)}</div>
      <div class="alert-desc">${escapeHtml(desc)}</div>
      ${link ? `<div class="alert-link"><a href="${escapeAttr(link)}" target="_blank" rel="noreferrer">More details</a></div>` : ""}
    </div>
  `;
}

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

function renderAlerts(alertsHtml) {
  const container = document.getElementById(ALERTS_CONTAINER_ID);
  if (!container) return;
  container.innerHTML = alertsHtml;
}

function renderSampleFallback() {
  const sample = [
    {
      title: "Severe Thunderstorm Watch (Sample)",
      pubDate: new Date().toUTCString(),
      description: "Sample: Thunderstorms with potential damaging winds.",
      link: "https://example.com/sample-alert"
    }
  ];
  const html = sample.map(formatAlertItem).join("");
  renderAlerts(html);
}

async function parseRSS(text) {
  // Very lightweight RSS parser for limited scope
  // Returns array of items with title, pubDate, description, link
  const items = [];
  // Try to parse as XML
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
  // If nothing parsed, return empty
  return items;
}

async function loadAlerts() {
  // Try real RSS
  try {
    const resp = await fetch(RSS_URL_NS, { cache: "no-store" });
    if (!resp.ok) throw new Error("RSS fetch failed");
    const text = await resp.text();
    const items = await parseRSS(text);
    if (items && items.length > 0) {
      const html = items.map(formatAlertItem).join("");
      renderAlerts(html);
      return;
    }
    // If no items found, fallback to sample
    renderSampleFallback();
  } catch (e) {
    // Fallback to sample data
    renderSampleFallback();
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Initial load
  loadAlerts();

  // Wire up refresh
  const btn = document.getElementById("refreshBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      // Optional UX: disable button briefly to indicate loading
      btn.disabled = true;
      btn.textContent = "Refreshing...";
      loadAlerts().finally(() => {
        btn.disabled = false;
        btn.textContent = "Refresh Alerts";
      });
    });
  }
});
