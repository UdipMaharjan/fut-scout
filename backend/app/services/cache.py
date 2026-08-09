"""
FutScout - Cache Service
"""
import json
from datetime import datetime, timedelta
from typing import Optional, Any, Dict
from diskcache import Cache
import logging

from app.config import (
    CACHE_TTL_PLAYER_DETAIL,
    CACHE_TTL_PLAYER_STATS,
    CACHE_TTL_SEARCH,
    CACHE_TTL_TEAM
)

logger = logging.getLogger(__name__)

# Create cache directory
cache = Cache("./.cache")


class CacheService:
    """Service for caching API responses."""

    @staticmethod
    def get(key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            return cache.get(key)
        except Exception as e:
            logger.warning(f"Cache get failed: {e}")
            return None

    @staticmethod
    def set(key: str, value: Any, ttl: int = None):
        """Set value in cache."""
        try:
            cache.set(key, value, expire=ttl)
        except Exception as e:
            logger.warning(f"Cache set failed: {e}")

    @staticmethod
    def delete(key: str):
        """Delete value from cache."""
        try:
            cache.delete(key)
        except Exception as e:
            logger.warning(f"Cache delete failed: {e}")

    @staticmethod
    def exists(key: str) -> bool:
        """Check if key exists in cache."""
        try:
            return cache.exists(key)
        except Exception as e:
            logger.warning(f"Cache exists check failed: {e}")
            return False

    @staticmethod
    def clear():
        """Clear all cache."""
        try:
            cache.clear()
        except Exception as e:
            logger.warning(f"Cache clear failed: {e}")

    # ==================== PLAYER CACHE ====================

    @staticmethod
    def get_player_detail(player_id: int) -> Optional[Dict]:
        """Get cached player detail."""
        key = f"player_detail:{player_id}"
        return CacheService.get(key)

    @staticmethod
    def set_player_detail(player_id: int, data: Dict):
        """Cache player detail."""
        key = f"player_detail:{player_id}"
        CacheService.set(key, data, ttl=CACHE_TTL_PLAYER_DETAIL)

    @staticmethod
    def get_player_stats(player_id: int, season: str = None) -> Optional[Dict]:
        """Get cached player stats."""
        key = f"player_stats:{player_id}:{season or 'all'}"
        return CacheService.get(key)

    @staticmethod
    def set_player_stats(player_id: int, data: Dict, season: str = None):
        """Cache player stats."""
        key = f"player_stats:{player_id}:{season or 'all'}"
        CacheService.set(key, data, ttl=CACHE_TTL_PLAYER_STATS)

    @staticmethod
    def get_player_image(player_id: int) -> Optional[str]:
        """Get cached player image URL."""
        key = f"player_image:{player_id}"
        return CacheService.get(key)

    @staticmethod
    def set_player_image(player_id: int, url: str):
        """Cache player image URL."""
        key = f"player_image:{player_id}"
        CacheService.set(key, url, ttl=CACHE_TTL_PLAYER_DETAIL)

    # ==================== SEARCH CACHE ====================

    @staticmethod
    def get_search(query: str) -> Optional[Dict]:
        """Get cached search results."""
        key = f"search:{query.lower().strip()}"
        return CacheService.get(key)

    @staticmethod
    def set_search(query: str, data: Dict):
        """Cache search results."""
        key = f"search:{query.lower().strip()}"
        CacheService.set(key, data, ttl=CACHE_TTL_SEARCH)

    # ==================== TEAM CACHE ====================

    @staticmethod
    def get_team_detail(team_id: int) -> Optional[Dict]:
        """Get cached team detail."""
        key = f"team_detail:{team_id}"
        return CacheService.get(key)

    @staticmethod
    def set_team_detail(team_id: int, data: Dict):
        """Cache team detail."""
        key = f"team_detail:{team_id}"
        CacheService.set(key, data, ttl=CACHE_TTL_TEAM)

    @staticmethod
    def get_team_image(team_id: int) -> Optional[str]:
        """Get cached team image URL."""
        key = f"team_image:{team_id}"
        return CacheService.get(key)

    @staticmethod
    def set_team_image(team_id: int, url: str):
        """Cache team image URL."""
        key = f"team_image:{team_id}"
        CacheService.set(key, url, ttl=CACHE_TTL_TEAM)

    # ==================== AI REPORT CACHE ====================

    @staticmethod
    def get_scout_report(player_id: int, report_type: str = "scouting") -> Optional[Dict]:
        """Get cached scouting report."""
        key = f"scout_report:{player_id}:{report_type}"
        return CacheService.get(key)

    @staticmethod
    def set_scout_report(player_id: int, data: Dict, report_type: str = "scouting"):
        """Cache scouting report (permanent)."""
        key = f"scout_report:{player_id}:{report_type}"
        CacheService.set(key, data)  # No TTL - permanent cache


# Singleton instance
cache_service = CacheService()
