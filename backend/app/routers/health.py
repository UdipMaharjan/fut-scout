"""
FutScout - Health Check Endpoints
"""
from fastapi import APIRouter
from app.services.cache import cache
from app.config import RAPIDAPI_KEY

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "FutScout API",
        "version": "1.0.0"
    }


@router.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to FutScout API",
        "docs": "/docs",
        "health": "/health"
    }


@router.get("/stats")
async def get_stats():
    """Get API usage statistics."""
    cache_size = len(cache) if cache else 0

    return {
        "cache_entries": cache_size,
        "rapidapi_configured": bool(RAPIDAPI_KEY),
        "environment": "development"
    }
