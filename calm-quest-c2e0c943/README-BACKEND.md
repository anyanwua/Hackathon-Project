# Calm Quest - Backend Integration

This project now includes a backend server that provides API endpoints for:
- User data management (XP, levels, streaks, badges)
- Biological impact score calculation
- Daily check-in submission
- Gamification system

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Start the Backend Server

In one terminal:

```bash
cd server
npm start
```

The server will run on `http://localhost:3001`

### 3. Start the Frontend

In another terminal:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is taken)

## API Endpoints

### GET `/api/user/:userId?`
Get user data (defaults to 'default' user if no userId provided)

### POST `/api/calculate-score`
Calculate biological impact score from wellness factors

**Request Body:**
```json
{
  "sleepHours": 8,
  "stressLevel": 3,
  "screenTimeHours": 6,
  "exerciseMinutes": 30,
  "moodLevel": 3
}
```

**Response:**
```json
{
  "score": 45,
  "category": "Moderate",
  "message": "...",
  "persona": "🧘 Resilient Baseline",
  "personaDescription": "..."
}
```

### POST `/api/checkin`
Submit daily check-in and update gamification

**Request Body:**
```json
{
  "userId": "default",
  "sleepHours": 8,
  "stressLevel": 3,
  "screenTimeHours": 6,
  "exerciseMinutes": 30,
  "moodLevel": 3,
  "score": 45
}
```

**Response:**
```json
{
  "userData": { ... },
  "xpGains": [
    { "amount": 5, "reason": "Daily Login" },
    { "amount": 10, "reason": "Daily Tasks Completed" }
  ],
  "levelUp": null,
  "newBadges": []
}
```

## Data Storage

User data is stored in `server/data.json`. This file is automatically created on first run.

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:3001
```

## Features

- ✅ Real-time XP and level tracking
- ✅ Streak system (daily check-ins)
- ✅ Badge unlocking system
- ✅ Biological impact score calculation
- ✅ Persona classification
- ✅ Persistent data storage

