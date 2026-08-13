"""
FutScout - League Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from app.services.api_football import api_client
from app.services.cache import cache_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/leagues", tags=["Leagues"])


@router.get("/")
async def list_leagues(
    season: int = Query(2024, description="Season year"),
    country: Optional[str] = Query(None, description="Country filter")
):
    """
    Get available leagues.
    """
    try:
        # Check cache
        cache_key = f"leagues:{season}:{country}"
        cached = cache_service.get(cache_key)
        if cached:
            return {**cached, "cached": True}

        # Get leagues
        response = await api_client.get_leagues(season=season, country=country)
        results = response.get("response", [])

        leagues = []
        for item in results:
            league = item.get("league", {})
            country_data = item.get("country", {})

            leagues.append({
                "id": league.get("id"),
                "name": league.get("name"),
                "type": league.get("type"),
                "logo": league.get("logo"),
                "country": country_data.get("name"),
                "flag": country_data.get("flag"),
            })

        result = {
            "response": leagues,
            "count": len(leagues),
            "season": season,
        }

        # Cache for 30 days
        cache_service.set(cache_key, result, ttl=3600 * 24 * 30)

        return {**result, "cached": False}

    except Exception as e:
        logger.error(f"List leagues failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{league_id}")
async def get_league(
    league_id: int,
    season: int = Query(2024, description="Season year")
):
    """
    Get league details.
    """
    try:
        # Check cache
        cached = cache_service.get(f"league:{league_id}:{season}")
        if cached:
            return {**cached, "cached": True}

        # Get league
        response = await api_client.get_league(league_id, season=season)
        results = response.get("response", [])

        if not results:
            raise HTTPException(status_code=404, detail="League not found")

        item = results[0]
        league = item.get("league", {})
        country = item.get("country", {})

        league_data = {
            "id": league.get("id"),
            "name": league.get("name"),
            "type": league.get("type"),
            "logo": league.get("logo"),
            "country": country.get("name"),
            "flag": country.get("flag"),
            "season": season,
        }

        # Cache for 30 days
        cache_service.set(f"league:{league_id}:{season}", league_data, ttl=3600 * 24 * 30)

        return {**league_data, "cached": False}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get league failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{league_id}/standings")
async def get_league_standings(
    league_id: int,
    season: int = Query(2024, description="Season year")
):
    """
    Get league standings.
    """
    try:
        # Check cache
        cached = cache_service.get(f"standings:{league_id}:{season}")
        if cached:
            return {**cached, "cached": True}

        # Get standings
        response = await api_client.get_standings(league_id, season=season)

        # Parse standings
        results = response.get("response", [])
        standings = []

        for item in results:
            league = item.get("league", {})
            for standing in league.get("standings", []):
                for team_data in standing:
                    standings.append({
                        "rank": team_data.get("rank"),
                        "team_id": team_data.get("team", {}).get("id"),
                        "team_name": team_data.get("team", {}).get("name"),
                        "team_logo": team_data.get("team", {}).get("logo"),
                        "played": team_data.get("all", {}).get("played", 0),
                        "win": team_data.get("all", {}).get("win", 0),
                        "draw": team_data.get("all", {}).get("draw", 0),
                        "lose": team_data.get("all", {}).get("lose", 0),
                        "goals_for": team_data.get("all", {}).get("goals", {}).get("for", 0),
                        "goals_against": team_data.get("all", {}).get("goals", {}).get("against", 0),
                        "points": team_data.get("points"),
                        "form": team_data.get("form"),
                    })

        result = {
            "league_id": league_id,
            "season": season,
            "standings": standings,
        }

        # Cache for 1 day
        cache_service.set(f"standings:{league_id}:{season}", result, ttl=3600 * 24)

        return {**result, "cached": False}

    except Exception as e:
        logger.error(f"Get standings failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{league_id}/top-scorers")
async def get_league_top_scorers(
    league_id: int,
    season: int = Query(2024, description="Season year")
):
    """
    Get top scorers for a league.
    """
    try:
        # Check cache
        cached = cache_service.get(f"top_scorers:{league_id}:{season}")
        if cached:
            return {**cached, "cached": True}

        # Get top scorers
        response = await api_client.get_top_scorers(league_id, season=season)
        results = response.get("response", [])

        scorers = []
        for item in results:
            player = item.get("player", {})
            stats = item.get("statistics", [])

            if stats:
                main_stats = stats[0]
                goals = main_stats.get("goals", {})
                games = main_stats.get("games", {})

                scorers.append({
                    "rank": len(scorers) + 1,
                    "player_id": player.get("id"),
                    "player_name": player.get("name"),
                    "player_photo": player.get("photo"),
                    "team_id": main_stats.get("team", {}).get("id"),
                    "team_name": main_stats.get("team", {}).get("name"),
                    "team_logo": main_stats.get("team", {}).get("logo"),
                    "goals": goals.get("total", 0),
                    "assists": goals.get("assists", 0),
                    "appearances": games.get("appearences", 0),
                })

        # Sort by goals
        scorers.sort(key=lambda x: x["goals"], reverse=True)
        for i, scorer in enumerate(scorers):
            scorer["rank"] = i + 1

        result = {
            "league_id": league_id,
            "season": season,
            "scorers": scorers,
        }

        # Cache for 1 day
        cache_service.set(f"top_scorers:{league_id}:{season}", result, ttl=3600 * 24)

        return {**result, "cached": False}

    except Exception as e:
        logger.error(f"Get top scorers failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
