# Caught @CBS

A party/social deduction game built for students at CBS (Calcutta Business School or similar). Players pass a device around; one player is secretly the Imposter who either has no word or a different "confusion" word. Everyone discusses and tries to identify the Imposter.

## Tech Stack

- **Framework**: React 19 + Vite 8
- **Language**: JavaScript (JSX)
- **Styling**: Inline CSS-in-JS via `<style>` tag (dark glassmorphism theme)
- **Package manager**: npm

## Project Structure

```
/
├── index.html          # Entry HTML
├── vite.config.js      # Vite config (port 5000, host 0.0.0.0, allowedHosts: true)
├── package.json        # Dependencies
├── public/             # Static assets
└── src/
    ├── main.jsx                # React entry point
    ├── CaughtAtCBSApp.jsx      # Main app component (all game logic + styles)
    ├── App.css
    └── index.css
```

## Running Locally

```bash
npm install
npm run dev
```

App runs on `http://0.0.0.0:5000`.

## Deployment

Configured as a **static** deployment:
- Build: `npm run build`
- Public dir: `dist`

## Game Mechanics

- 3–15 players enter their names
- One player is randomly chosen as the Imposter
- All players see the same "target word" except the Imposter
- 20% chance of "confusion mode": Imposter gets a related but different word
- Players discuss and vote to identify the Imposter
