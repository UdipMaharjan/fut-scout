"""
FutScout - Scouting Report Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.database import get_db
from app.models.player import Player
from app.models.stats import PlayerStats
from app.services.llm import llm_service
from app.services.cache import cache_service
from app.utils.formatting import build_stats_response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scout", tags=["Scouting"])


@router.post("/")
async def generate_scouting_report(
    player_id: int = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate AI-powered scouting report for a player.
    Reports are cached permanently.
    """
    try:
        # Check cache first
        cached = cache_service.get_scout_report(player_id, "scouting")
        if cached:
            return {**cached, "cached": True}

        # Fetch player from database
        player = await db.get(Player, player_id)

        if not player:
            raise HTTPException(status_code=404, detail="Player not found in database. Save the player first using POST /players/{id}/save")

        # Fetch stats
        stats_query = select(PlayerStats).where(PlayerStats.player_id == player_id)
        result = await db.execute(stats_query)
        stats = result.scalars().all()

        # Build player data for LLM
        player_data = {
            "id": player.id,
            "name": player.name,
            "position": player.position or "Unknown",
            "age": player.age,
            "nationality": player.nationality,
            "team_name": player.team.name if player.team else "Unknown",
            "market_value_display": player.market_value_display,
            "stats": build_stats_response([s.__dict__ for s in stats])
        }

        # Generate report
        report = await llm_service.generate_scouting_report(player_data)

        result_data = {
            "player_id": player_id,
            "player_name": player.name,
            "report_type": "scouting",
            "content": report,
            "model_used": "llama-3.1-8b-instant",
            "generated_at": None  # Will be set when cached
        }

        # Cache it permanently
        cache_service.set_scout_report(player_id, result_data, "scouting")

        return {**result_data, "cached": False}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate scouting report failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}")
async def get_cached_report(
    player_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get cached scouting report if available.
    Returns 404 if no report has been generated yet.
    """
    try:
        cached = cache_service.get_scout_report(player_id, "scouting")

        if cached:
            return {**cached, "cached": True}

        # Check if player exists
        player = await db.get(Player, player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")

        raise HTTPException(status_code=404, detail="No scouting report generated yet. POST to /scout to generate one.")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get cached report failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{player_id}")
async def delete_scouting_report(
    player_id: int
):
    """
    Delete cached scouting report for a player.
    """
    try:
        cache_service.delete(f"scout_report:{player_id}:scouting")
        return {"message": "Scouting report deleted", "player_id": player_id}
    except Exception as e:
        logger.error(f"Delete scouting report failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
