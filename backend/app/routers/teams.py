"""
FutScout - Team Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from app.services.api_football import api_client
from app.services.cache import cache_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/teams", tags=["Teams"])


@router.get("/search")
async def search_teams(
    q: str = Query(..., min_length=1, description="Search query")
):
    """
    Search for teams by name.
    """
    try:
        # Check cache
        cached = cache_service.get(f"team_search:{q}")
        if cached:
            return {**cached, "cached": True}

        # Search teams
        response = await api_client.search_teams(q)
        results = response.get("response", [])

        teams = []
        for item in results:
            team = item.get("team", {})
            teams.append({
                "id": team.get("id"),
                "name": team.get("name"),
                "logo": team.get("logo"),
                "country": item.get("country"),
            })

        result = {
            "response": teams,
            "count": len(teams),
            "query": q,
        }

        # Cache for 30 days
        cache_service.set(f"team_search:{q}", result, ttl=3600 * 24 * 30)

        return {**result, "cached": False}

    except Exception as e:
        logger.error(f"Team search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{team_id}")
async def get_team(team_id: int):
    """
    Get team details with squad.
    """
    try:
        # Check cache
        cached = cache_service.get(f"team:{team_id}")
        if cached:
            return {**cached, "cached": True}

        # Get team
        response = await api_client.get_team(team_id)
        results = response.get("response", [])

        if not results:
            raise HTTPException(status_code=404, detail="Team not found")

        item = results[0]
        team = item.get("team", {})
        venue = item.get("venue", {})

        team_data = {
            "id": team.get("id"),
            "name": team.get("name"),
            "logo": team.get("logo"),
            "country": item.get("country"),
            "founded": item.get("founded"),
            "venue": {
                "name": venue.get("name"),
                "city": venue.get("city"),
                "capacity": venue.get("capacity"),
                "image": venue.get("image"),
            }
        }

        # Cache for 30 days
        cache_service.set(f"team:{team_id}", team_data, ttl=3600 * 24 * 30)

        return {**team_data, "cached": False}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get team failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{team_id}/squad")
async def get_team_squad(
    team_id: int,
    season: int = Query(2024, description="Season year")
):
    """
    Get team squad (players with their stats).
    """
    try:
        # Check cache
        cached = cache_service.get(f"team_squad:{team_id}:{season}")
        if cached:
            return {**cached, "cached": True}

        # Get squad
        response = await api_client.get_team_squad(team_id, season=season)
        results = response.get("response", [])

        players = []
        for item in results:
            player = item.get("player", {})
            stats = item.get("statistics", [])

            # Get main stats
            main_stats = stats[0] if stats else {}
            games = main_stats.get("games", {})

            players.append({
                "id": player.get("id"),
                "name": player.get("name"),
                "photo": player.get("photo"),
                "age": player.get("age"),
                "position": games.get("position"),
                "team_id": team_id,
                "appearances": games.get("appearences", 0),
                "rating": games.get("rating"),
                "goals": main_stats.get("goals", {}).get("total", 0),
                "assists": main_stats.get("goals", {}).get("assists", 0),
            })

        # Sort by position then name
        position_order = {"Goalkeeper": 0, "Defender": 1, "Midfielder": 2, "Attacker": 3}
        players.sort(key=lambda p: (position_order.get(p["position"], 99), p["name"]))

        result = {
            "team_id": team_id,
            "players": players,
            "count": len(players),
        }

        # Cache for 1 day
        cache_service.set(f"team_squad:{team_id}:{season}", result, ttl=3600 * 24)

        return {**result, "cached": False}

    except Exception as e:
        logger.error(f"Get team squad failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{team_id}/players")
async def get_team_players(
    team_id: int,
    season: int = Query(2024, description="Season year")
):
    """
    Get players from a team - alias for squad endpoint.
    """
    return await get_team_squad(team_id, season=season)
