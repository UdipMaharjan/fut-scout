# FutScout - AI-Powered Football Scouting Platform

A modern football scouting and player intelligence platform built with FastAPI, React, and AI.

## Features

- **Player Search** - Search football players by name
- **Player Profiles** - View detailed player information and statistics
- **Player Comparison** - Side-by-side comparison of player stats
- **AI Scouting Reports** - LLM-generated player analysis
- **Similar Players** - Find players with similar profiles

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: SQLite (with SQLAlchemy)
- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Groq (LLM for scouting reports)
- **API**: RapidAPI Football Data

## Project Structure

```
futscout/
├── backend/
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # External services (RapidAPI, LLM, Cache)
│   │   ├── models/       # Database models
│   │   ├── utils/        # Utility functions
│   │   ├── main.py       # FastAPI application
│   │   └── config.py     # Configuration
│   ├── scripts/
│   │   └── seed_players.py
│   └── requirements.txt
├── frontend/
│   └── ...
└── data/
```

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
pip install -r requirements.txt
python -m scripts.seed_players  # Seed initial data
uvicorn app.main:app --reload   # Run server
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with backend URL
npm install
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/players` - List/search players
- `GET /api/players/{id}` - Get player details
- `GET /api/players/{id}/stats` - Get player statistics
- `GET /api/players/search?q={query}` - Search via API
- `GET /api/compare/{id1}/{id2}` - Compare two players
- `POST /api/scout` - Generate scouting report
- `GET /api/teams` - List teams
- `GET /api/teams/{id}` - Get team details

## Environment Variables

### Backend (.env)

```env
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=free-api-live-football-data.p.rapidapi.com
GROQ_API_KEY=your_groq_api_key
CORS_ORIGINS=http://localhost:5173
DATABASE_URL=sqlite+aiosqlite:///./futscout.db
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## License

MIT
