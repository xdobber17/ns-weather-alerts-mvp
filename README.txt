# Lobster Weather Alerts MVP (Nova Scotia)

This project is a minimal, front-end MVP that shows current weather conditions and a list of weather alerts tailored for Nova Scotia lobster operations. It is designed to be easy to deploy on Vercel and easy to connect to a GitHub repository for rapid iteration.

What you get
- A clean, responsive HTML UI showing:
  - Current weather (sample data with a real Environment Canada (EC) fetch path outlined)
  - Active alerts (sample NS alerts with a path to add real EC data later)
- Lightweight CSS for a lobster/Nova Scotia themed UI
- JavaScript with sample data, a fallback path, and a scaffold to fetch Environment Canada data
- A ready-to-publish README with exact Vercel deployment steps and repo connection instructions

Project structure (at a glance)
- index.html: Main UI
- styles.css: Styling for the UI
- script.js: Client-side logic, including sample data and an EC fetch path
- README.md: This document, with deployment steps

Important notes
- This MVP uses sample data for offline/offline-friendly development. It includes a scaffold for Environment Canada (EC) data fetch.
- For live EC data, you will typically fetch from Environment Canada’s weather data endpoints (adjust for your target product). Ensure you comply with EC’s data usage policies and any required API keys or access methods.
- Do not hard-code API keys in client-side code for production. Use a serverless function or a proxy to securely fetch data in production (see EC fetch guidance in script.js comments).

Prerequisites
- GitHub account
- Vercel account
- Basic knowledge of pushing to GitHub and connecting to Vercel

Deployment steps (one-click via Vercel)
1) Ensure your repository on GitHub is ready and contains the MVP files (index.html, styles.css, script.js, README.md).
2) Go to Vercel (https://vercel.com) and sign in.
3) Click the “New Project” button.
4) Import the repository:
   - Connect your GitHub account if not already connected.
   - Select the repository that contains this MVP (e.g., xdobber17/ns-weather-alerts-mvp).
5) Configure the project:
   - Framework preset: Static (or "Other" if it doesn’t auto-detect)
   - Build Command: Leave blank or set to a no-op if you have no build step
   - Output Directory: (root) or specify if using a specific folder
6) Environment Variables (optional for EC data)
   - If you plan to fetch EC data via a key or proxy, add it here as needed:
     - NAME: EC_API_KEY
     - VALUE: your_api_key_here
   - The provided sample script.js uses a placeholder for EC data fetch. Do not expose real API keys in client-side code.
7) Deploy:
   - Click deploy and wait for the build to complete.
   - Vercel will provide a live URL. You can share this URL or link to your domain if you have one.
8) Optional: set up a custom domain via Vercel’s dashboard if you have one.

Connecting the repo to Vercel (step-by-step)
- After clicking “New Project” on Vercel:
  - Choose the GitHub repository (xdobber17/ns-weather-alerts-mvp).
  - Follow the prompts to authorize Vercel to access the repo (one-time setup).
  - Confirm the project settings (framework, build, output dir).
  - Click “Deploy” to publish. Future pushes to the repo will trigger redeploys automatically.

Environment and security considerations
- For client-side demo data, this MVP uses sample data. When wiring up EC data:
  - Use a serverless function (e.g., Vercel Serverless Functions) or a small proxy to fetch EC data securely.
  - Do not ship API keys in front-end code. Use environment variables in the serverless function or a secured backend.
- If you expose an API endpoint in EC data fetch, ensure proper CORS settings and rate limiting.

Development and testing notes
- You can run this locally by serving the root directory with a static server (e.g., npx serve) if you want to test before pushing to GitHub.
- The sample data includes Nova Scotia locations and generic alerts. You can extend or replace with real EC alerts as you integrate the EC API (Environment Canada data is illustrative in this MVP).

File overview (for quick reference)
- index.html: Main page structure and script inclusion.
- styles.css: Palette and responsive styling to fit Nova Scotia vibe.
- script.js: Contains:
  - sampleWeatherData: Fallback local weather data
  - sampleAlerts: Nova Scotia-based alerts
  - displayWeather() and displayAlerts() to render UI
  - fetchWeatherData() scaffold for EC fetch (to be wired to a serverless function or proxy)
  - Initialization code to render sample data on load
- README.md: This document (deployment steps included)