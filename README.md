# SignalForge — Clocked Build Challenge 2026

**SignalForge** is a browser-based security operations dashboard that simulates incidents, ranks synthetic alerts by risk, lets analysts inspect evidence, and calls Clocked's security endpoints via a server-side Netlify Function. This repo contains the Netlify edition of the original Streamlit prototype.

## Demo use
1. Open the deployed site, click **Generate alerts**, and select an incident.
2. Click **Run Clocked check**; Email events call Guard (`/injection`), Endpoint events call Inspect (`/script`), and other events call Protect (`/pii`).
3. When a live API response succeeds, the displayed decision and risk score update; PII masks synthetic data when the API returns anonymized text.
4. **Export JSON** downloads the incident report. All incidents are synthetic.

## Deploy on Netlify
1. Import `https://github.com/Caz-Codehub/signalforge-clocked-2026` into Netlify.
2. The `netlify.toml` configuration publishes `site/`, deploys `netlify/functions/`, and redirects `/api/analyze` to the Function.
3. Set the private environment variable `CLOCKED_API_KEY` in Netlify, with access for Functions. **Never commit it or expose it to browser code.**
4. Deploy, run a real check for each endpoint, and verify that result-driven risk scores and redaction are displayed.
5. Keep the publicly reachable demo available through November 18, 2026.

## Scope and validation
- The browser's offline scenario generator does not contact real systems.
- Live Clocked results are only labeled as such after an actual endpoint response. Network errors and missing keys do not fabricate results.
- Endpoint decisions are advisory and not authorization for script execution.
- No live Clocked response or production deployment has been verified by the authoring assistant. Validate them before entering endpoint awards.
- The project must meet the organizer's October 21–November 10 new-application requirement; disclose any reused framework/components honestly.
- `npm test` runs syntax checks on client and function.

## Challenge categories
Best Overall App; Best Use of Protect, Guard, or Inspect if the deployed app meaningfully calls those endpoints.

## Stack
HTML, CSS, JavaScript, Netlify Functions, Clocked API. No browser API key.
