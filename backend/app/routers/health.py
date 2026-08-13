"""
FutScout - Health Check Endpoints
"""
from fastapi import APIRouter
from app.services.cache import cache, CacheService
from app.config import API_FOOTBALL_KEY

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
    api_usage = CacheService.get_api_usage()

    return {
        "cache_entries": cache_size,
        "api_football_configured": bool(API_FOOTBALL_KEY),
        "environment": "development",
        "api_usage": api_usage
    }
