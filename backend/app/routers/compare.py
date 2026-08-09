"""
FutScout - Player Comparison Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
import logging

from app.database import get_db
from app.models.player import Player
from app.models.stats import PlayerStats
from app.services.llm import llm_service
from app.services.cache import cache_service
from app.utils.stats import calculate_similarity_score

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/compare", tags=["Comparison"])


@router.get("/{player_id_a}/{player_id_b}")
async def compare_players(
    player_id_a: int,
    player_id_b: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Compare two players side by side.
    """
    try:
        # Fetch both players
        player_a = await db.get(Player, player_id_a)
        player_b = await db.get(Player, player_id_b)

        if not player_a or not player_b:
            raise HTTPException(status_code=404, detail="One or both players not found")

        # Fetch stats
        stats_query_a = select(PlayerStats).where(PlayerStats.player_id == player_id_a)
        stats_query_b = select(PlayerStats).where(PlayerStats.player_id == player_id_b)

        result_a = await db.execute(stats_query_a)
        result_b = await db.execute(stats_query_b)

        stats_a = result_a.scalars().all()
        stats_b = result_b.scalars().all()

        # Build comparison
        comparison = _build_comparison(player_a, player_b, stats_a, stats_b)

        return {
            "players": [
                {
                    "id": player_a.id,
                    "name": player_a.name,
                    "position": player_a.position,
                    "age": player_a.age,
                    "nationality": player_a.nationality,
                    "team": player_a.team.name if player_a.team else None,
                    "stats": _aggregate_stats([s.__dict__ for s in stats_a])
                },
                {
                    "id": player_b.id,
                    "name": player_b.name,
                    "position": player_b.position,
                    "age": player_b.age,
                    "nationality": player_b.nationality,
                    "team": player_b.team.name if player_b.team else None,
                    "stats": _aggregate_stats([s.__dict__ for s in stats_b])
                }
            ],
            "comparison": comparison
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compare players failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def compare_multiple_players(
    player_ids: List[int],
    db: AsyncSession = Depends(get_db)
):
    """
    Compare multiple players (up to 4).
    """
    try:
        if len(player_ids) < 2:
            raise HTTPException(status_code=400, detail="At least 2 players required")
        if len(player_ids) > 4:
            raise HTTPException(status_code=400, detail="Maximum 4 players allowed")

        players_data = []

        for pid in player_ids:
            player = await db.get(Player, pid)
            if not player:
                raise HTTPException(status_code=404, detail=f"Player {pid} not found")

            stats_query = select(PlayerStats).where(PlayerStats.player_id == pid)
            result = await db.execute(stats_query)
            stats = result.scalars().all()

            players_data.append({
                "id": player.id,
                "name": player.name,
                "position": player.position,
                "age": player.age,
                "nationality": player.nationality,
                "team": player.team.name if player.team else None,
                "market_value": player.market_value,
                "stats": _aggregate_stats([s.__dict__ for s in stats])
            })

        return {"players": players_data}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Compare multiple players failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id_a}/{player_id_b}/similarity")
async def get_similarity(
    player_id_a: int,
    player_id_b: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate similarity score between two players.
    """
    try:
        player_a = await db.get(Player, player_id_a)
        player_b = await db.get(Player, player_id_b)

        if not player_a or not player_b:
            raise HTTPException(status_code=404, detail="One or both players not found")

        # Build player dicts for comparison
        p_a_dict = _player_to_dict(player_a)
        p_b_dict = _player_to_dict(player_b)

        # Get stats
        stats_query_a = select(PlayerStats).where(PlayerStats.player_id == player_id_a)
        stats_query_b = select(PlayerStats).where(PlayerStats.player_id == player_id_b)

        result_a = await db.execute(stats_query_a)
        result_b = await db.execute(stats_query_b)

        p_a_dict["stats"] = {"total": _aggregate_stats([s.__dict__ for s in result_a.scalars().all()])}
        p_b_dict["stats"] = {"total": _aggregate_stats([s.__dict__ for s in result_b.scalars().all()])}

        similarity_score = calculate_similarity_score(p_a_dict, p_b_dict)

        return {
            "player_a": {"id": player_id_a, "name": player_a.name},
            "player_b": {"id": player_id_b, "name": player_b.name},
            "similarity_score": similarity_score
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get similarity failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{player_id_a}/{player_id_b}/explain")
async def explain_comparison(
    player_id_a: int,
    player_id_b: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI-powered explanation of why two players are similar/different.
    """
    try:
        player_a = await db.get(Player, player_id_a)
        player_b = await db.get(Player, player_id_b)

        if not player_a or not player_b:
            raise HTTPException(status_code=404, detail="One or both players not found")

        # Build player data for LLM
        p_a_dict = _player_to_dict(player_a)
        p_b_dict = _player_to_dict(player_b)

        # Get stats
        stats_query_a = select(PlayerStats).where(PlayerStats.player_id == player_id_a)
        stats_query_b = select(PlayerStats).where(PlayerStats.player_id == player_id_b)

        result_a = await db.execute(stats_query_a)
        result_b = await db.execute(stats_query_b)

        p_a_dict["stats"] = {"total": _aggregate_stats([s.__dict__ for s in result_a.scalars().all()])}
        p_b_dict["stats"] = {"total": _aggregate_stats([s.__dict__ for s in result_b.scalars().all()])}

        # Check cache first
        cache_key = f"{min(player_id_a, player_id_b)}_{max(player_id_a, player_id_b)}"
        cached = cache_service.get(f"comparison_explanation:{cache_key}")
        if cached:
            return {**cached, "cached": True}

        # Generate explanation
        explanation = await llm_service.explain_comparison(p_a_dict, p_b_dict)

        result = {
            "player_a": {"id": player_id_a, "name": player_a.name},
            "player_b": {"id": player_id_b, "name": player_b.name},
            "explanation": explanation,
            "model_used": "llama-3.1-8b-instant"
        }

        # Cache it
        cache_service.set(f"comparison_explanation:{cache_key}", result)

        return {**result, "cached": False}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Explain comparison failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== HELPER FUNCTIONS ====================

def _player_to_dict(player: Player) -> Dict[str, Any]:
    """Convert player model to dict."""
    return {
        "id": player.id,
        "name": player.name,
        "position": player.position,
        "position_group": player.position,
        "age": player.age,
        "nationality": player.nationality,
        "team_name": player.team.name if player.team else None
    }


def _aggregate_stats(stats_list: List[Dict[str, Any]]) -> Dict[str, int]:
    """Aggregate stats from multiple seasons."""
    total = {
        "appearances": 0,
        "goals": 0,
        "assists": 0,
        "minutes_played": 0,
        "yellow_cards": 0,
        "red_cards": 0
    }

    for s in stats_list:
        total["appearances"] += s.get("appearances", 0)
        total["goals"] += s.get("goals", 0)
        total["assists"] += s.get("assists", 0)
        total["minutes_played"] += s.get("minutes_played", 0)
        total["yellow_cards"] += s.get("yellow_cards", 0)
        total["red_cards"] += s.get("red_cards", 0)

    return total


def _build_comparison(player_a, player_b, stats_a, stats_b) -> Dict[str, Any]:
    """Build comparison metrics between two players."""
    agg_a = _aggregate_stats([s.__dict__ for s in stats_a])
    agg_b = _aggregate_stats([s.__dict__ for s in stats_b])

    def stat_comparison(metric: str) -> Dict[str, Any]:
        val_a = agg_a.get(metric, 0)
        val_b = agg_b.get(metric, 0)
        winner = player_a.name if val_a > val_b else player_b.name if val_b > val_a else "Tie"
        return {
            "player_a": val_a,
            "player_b": val_b,
            "winner": winner,
            "difference": abs(val_a - val_b)
        }

    def per_90_comparison(metric: str) -> Dict[str, Any]:
        mins_a = max(1, agg_a.get("minutes_played", 1))
        mins_b = max(1, agg_b.get("minutes_played", 1))

        val_a = round((agg_a.get(metric, 0) / mins_a) * 90, 2)
        val_b = round((agg_b.get(metric, 0) / mins_b) * 90, 2)

        winner = player_a.name if val_a > val_b else player_b.name if val_b > val_a else "Tie"
        return {
            "player_a": val_a,
            "player_b": val_b,
            "winner": winner,
            "difference": round(abs(val_a - val_b), 2)
        }

    return {
        "goals": stat_comparison("goals"),
        "assists": stat_comparison("assists"),
        "appearances": stat_comparison("appearances"),
        "goals_per_90": per_90_comparison("goals"),
        "assists_per_90": per_90_comparison("assists"),
        "yellow_cards": stat_comparison("yellow_cards"),  # Lower is better
        "red_cards": stat_comparison("red_cards")  # Lower is better
    }
