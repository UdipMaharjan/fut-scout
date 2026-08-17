"""
FutScout - Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

# API-Football (REQUIRED)
API_FOOTBALL_KEY = os.getenv("API_FOOTBALL_KEY")
if not API_FOOTBALL_KEY:
    raise ValueError("API_FOOTBALL_KEY environment variable is required")

API_FOOTBALL_HOST = os.getenv("API_FOOTBALL_HOST", "v3.football.api-sports.io")
API_FOOTBALL_BASE_URL = f"https://{API_FOOTBALL_HOST}"

# LLM (Groq) - optional
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./futscout.db")

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Cache settings
CACHE_TTL_PLAYER_DETAIL = 60 * 60 * 24 * 7  # 7 days
CACHE_TTL_PLAYER_STATS = 60 * 60 * 24 * 3   # 3 days
CACHE_TTL_SEARCH = 60 * 60 * 24              # 1 day
CACHE_TTL_TEAM = 60 * 60 * 24 * 30           # 30 days
