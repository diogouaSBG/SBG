# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**INETUM Viagens** is a single-page React application for coordinating weekly train/carpool trips between Lisbon and Porto for INETUM consultants. It is **client-side only** — all data lives in component state and is lost on page refresh. There is no backend or database.

## Commands

```bash
npm install       # Install dependencies
npm start         # Dev server at http://localhost:3000
npm run build     # Production build → build/
npm test          # Jest test runner (no tests currently exist)
```

No linter or formatter is configured beyond Create React App defaults.

## Architecture

The app is built with **Create React App** (React 18, react-scripts 5). All logic lives in four source files:

- **`src/App.js`** — The entire UI (~400 lines). Contains state, event handlers, and all sub-components (`Avatar`, `Label`, `Section`, etc.) defined inline. No external state management.
- **`src/useTeams.js`** — Custom hook that initializes `@microsoft/teams-js` SDK and exposes `teamsContext`, `isTeams`, and `theme`. The hook is defined but **not yet wired into `App.js`**.
- **`src/teamsNotify.js`** — Three webhook notification functions (`notifyNewTrip`, `notifyCarReady`, `notifyTripRemoved`) that POST to `REACT_APP_TEAMS_WEBHOOK`. These are defined but **not yet called from `App.js`**.
- **`src/index.js`** — Standard React 18 root render entry point.

### State shape in App.js

```js
trips = {
  "Segunda": [{ id, name, zone, departDay, departTime, returnDay, returnTime, nights, portoType, portoOther, portoLocation }],
  "Terça": [...],
  // Mon–Fri keys
}
```

Key derived logic:
- **Carpool threshold**: 3+ people departing same day → transport switches from train to car (`transport()` helper).
- **Nights**: `nightsBetween(departDay, returnDay)` uses hardcoded day-order array.
- **Validation**: duplicate name+day, missing required fields, return before departure, custom hotel name required when `portoType === "other"`.

### Teams & Webhook integration

Both integrations are optional and gracefully no-op when env vars are absent. To activate:
- Copy `.env.example` → `.env`
- Set `REACT_APP_TEAMS_WEBHOOK` to an Incoming Webhook URL from a Teams channel
- Set `REACT_APP_URL` to the deployed app domain

### Styling conventions

All styling is inline CSS-in-JS. Color palette:
- Background: `#0c0e16` (dark)
- Primary/accent: `#6366f1` / `#8b5cf6` (indigo/purple)
- Train/hotel highlight: `#f59e0b` (amber)
- Car/carpool highlight: `#22c55e` (green)
- Font: DM Sans (loaded via Google Fonts in `public/index.html`)

### Deployment

Target: **Azure Static Web Apps** (free tier). Before deploying:
1. Run `npm run build`
2. Deploy `build/` to Azure Static Web Apps
3. Update `YOUR_APP_URL` and `YOUR_APP_DOMAIN` placeholders in `teams-manifest/manifest.json`
4. Zip and upload the manifest to Microsoft Teams (or add as a web tab URL)

Hardcoded consultant names (`Ana Silva`, `Bruno Costa`, etc.) and hotel defaults (`Holiday Inn Express Exponor`) are in `App.js` and must be updated to reflect the actual team.
