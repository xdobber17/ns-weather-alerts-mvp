// script.js
// Goal: fetch Nova Scotia severe weather alerts from Environment Canada, parse RSS/XML when possible,
// fallback to sample data, with a refresh button and a loading spinner.

const NS_FEED_URLS = [
  "https://weather.gc.ca/rss/alerts/ns_e.xml", // Environment Canada NS alerts (RSS)
  // Additional fallback feed candidates (if available)
  "https://weather.gc.ca/rss/alerts/ns_w.xml",
  // Generic warnings page as last-resort (may require HTML parsing)
  "https://weather.gc.ca/warnings/report_e.xml"
];

const ALERTS_CONTAINER_ID = "alerts";
const LOADER_ID = "alerts-loader";

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

function formatAlertItem(item) {
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

function renderAlerts(html) {
  const container = document.getElementById(ALERTS_CONTAINER_ID);
  if (!container) return;
  container.innerHTML = html;
}

function renderSampleFallback() {
  const sample = [
    {
      title: "Severe Weather (Sample)",
      pubDate: new Date().toUTCString(),
      description: "Sample: Nova Scotia weather alert. Verify feed availability.",
      link: "https://example.com/sample-alert"
    }
  ];
  const html = sample.map(formatAlertItem).join("");
  renderAlerts(html);
}

function parseRSS(text) {
  const items = [];
  try {
    const doc = new DOMParser().parseFromString(text, "text/xml");
    const nodeItems = doc.querySelectorAll("item");
    nodeItems.forEach((node) => {
      const title = node.querySelector("title")?.textContent;
      const pubDate = node.querySelector("pubDate")?.textContent;
      const description = node.querySelector("description")?.textContent;
      const link = node.querySelector("link")?.textContent;
      items.push({ title, pubDate, description, link });
    });
  } catch (e) {
    // ignore parse errors
  }
  return items;
}

async function loadAlerts() {
  // Show loader
  const loader = document.getElementById(LOADER_ID);
  if (loader) loader.style.display = "inline-block";

  for (const url of NS_FEED_URLS) {
    try {
      const resp = await fetch(url, { cache: "no-store" });
      if (!resp.ok) continue;
      const text = await resp.text();

      const items = parseRSS(text);
      if (items && items.length > 0) {
        const html = items.map(formatAlertItem).join("");
        renderAlerts(html);
        if (loader) loader.style.display = "none";
        return;
      }
    } catch (e) {
      // try next URL
    }
  }

  // If we reach here, nothing loaded; use sample
  renderSampleFallback();
  if (loader) loader.style.display = "none";
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Initial load
  loadAlerts();

  // Wire up refresh
  const btn = document.getElementById("refreshBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      btn.disabled = true;
      btn.textContent = "Refreshing…";
      loadAlerts().finally(() => {
        btn.disabled = false;
        btn.textContent = "Refresh Alerts";
      });
    });
  }
});
