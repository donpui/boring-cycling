# Boring Bicycle Dash

An endless runner game where you control a bicycle and avoid obstacles. Built with vanilla JavaScript and HTML5 Canvas.

## Features

- 🚴 Endless bicycle runner gameplay
- 📊 Score tracking and leaderboard
- 📱 Mobile-friendly touch controls
- ⌨️ Desktop keyboard controls (arrow keys)
- 💾 Persistent score storage with Turso database

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
export TURSO_DATABASE_URL="your-turso-database-url"
export TURSO_DB_NAME="boring-cycling"  # optional
```

3. Initialize the database:
```bash
npm run setup-db
```

4. Serve the application (using your preferred static file server or deploy to a platform like Vercel/Netlify)

```bash
vercel dev
```

## How to Play

- **Desktop**: Use arrow keys to move your bicycle
- **Mobile**: Use the on-screen control buttons
- Avoid obstacles and see how long you can ride!
- Save your score with an optional name to appear on the leaderboard

## Tech Stack

- Vanilla JavaScript (ES6 modules)
- HTML5 Canvas
- Turso (libSQL) for database
- Serverless API endpoints for score management

