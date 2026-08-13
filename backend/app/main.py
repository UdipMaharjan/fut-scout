"""
FutScout - Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import CORS_ORIGINS, ENVIRONMENT
from app.database import init_db
from app.services.rapidapi import rapidapi_client
from app.services.api_football import api_client
from app.services.cache import cache
from app.routers import players, teams, leagues, compare, scout, health, player

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events."""
    # Startup
    logger.info("Starting FutScout API...")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Log cache directory
    logger.info(f"Cache directory: {cache.directory}")

    yield

    # Shutdown
    logger.info("Shutting down FutScout API...")
    await rapidapi_client.close()
    await api_client.close()


# Create FastAPI app
app = FastAPI(
    title="FutScout API",
    description="AI-powered football scouting and player intelligence platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api")
app.include_router(players.router, prefix="/api")
app.include_router(player.router, prefix="/api")
app.include_router(teams.router, prefix="/api")
app.include_router(leagues.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(scout.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=ENVIRONMENT == "development"
    )
