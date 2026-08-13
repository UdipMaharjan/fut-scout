"""
FutScout - Player Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
import logging

from app.database import get_db
from app.models.player import Player
from app.models.stats import PlayerStats
from app.services.api_football import api_client
from app.services.cache import cache_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/players", tags=["Players"])


def parse_api_player_response(data: dict) -> dict:
    """Parse API-Football player response to consistent format."""
    try:
        results = data.get("response", [])
        if not results:
            return None

        # Get first result
        player_data = results[0]
        player = player_data.get("player", {})
        statistics = player_data.get("statistics", [])

        # Get main league stats (usually first one)
        main_stats = None
        for stat in statistics:
            if stat.get("league", {}).get("name") not in ["Friendlies"]:
                main_stats = stat
                break
        if not main_stats and statistics:
            main_stats = statistics[0]

        # Parse position to short form
        position_map = {
            "Goalkeeper": "GK",
            "Defender": "DEF",
            "Midfielder": "MID",
            "Attacker": "ATT",
        }
        pos_raw = main_stats.get("games", {}).get("position", "") if main_stats else ""
        position = position_map.get(pos_raw, pos_raw[:3] if pos_raw else "N/A")

        return {
            "id": player.get("id"),
            "name": player.get("name"),
            "first_name": player.get("firstname"),
            "last_name": player.get("lastname"),
            "age": player.get("age"),
            "date_of_birth": player.get("birth", {}).get("date"),
            "nationality": player.get("nationality"),
            "height_cm": int(player.get("height", "0").replace("cm", "").strip()) if player.get("height") else None,
            "weight": player.get("weight"),
            "photo": player.get("photo"),
            "position": position,
            "position_raw": pos_raw,
            "team_id": main_stats.get("team", {}).get("id") if main_stats else None,
            "team_name": main_stats.get("team", {}).get("name") if main_stats else None,
            "team_logo": main_stats.get("team", {}).get("logo") if main_stats else None,
            "league_id": main_stats.get("league", {}).get("id") if main_stats else None,
            "league_name": main_stats.get("league", {}).get("name") if main_stats else None,
            "league_logo": main_stats.get("league", {}).get("logo") if main_stats else None,
            "rating": main_stats.get("games", {}).get("rating") if main_stats else None,
            "statistics": statistics,
            "main_stats": main_stats,
        }
    except Exception as e:
        logger.error(f"Failed to parse player response: {e}")
        return None


def parse_stats(statistics: List[dict]) -> dict:
    """Aggregate statistics from multiple leagues."""
    total = {
        "appearances": 0,
        "minutes": 0,
        "goals": 0,
        "assists": 0,
        "yellow_cards": 0,
        "red_cards": 0,
        "shots_total": 0,
        "shots_on": 0,
        "passes_total": 0,
        "passes_key": 0,
        "tackles_total": 0,
        "duels_won": 0,
        "dribbles_success": 0,
        "rating_avg": 0,
    }

    if not statistics:
        return {"seasons": [], "total": total}

    ratings = []
    for stat in statistics:
        games = stat.get("games", {})
        goals = stat.get("goals", {})
        cards = stat.get("cards", {})
        shots = stat.get("shots", {})
        passes = stat.get("passes", {})
        tackles = stat.get("tackles", {})
        duels = stat.get("duels", {})
        dribbles = stat.get("dribbles", {})

        total["appearances"] += games.get("appearences", 0) or 0
        total["minutes"] += games.get("minutes", 0) or 0
        total["goals"] += goals.get("total", 0) or 0
        total["assists"] += goals.get("assists", 0) or 0
        total["yellow_cards"] += cards.get("yellow", 0) or 0
        total["red_cards"] += cards.get("red", 0) or 0
        total["shots_total"] += shots.get("total", 0) or 0
        total["shots_on"] += shots.get("on", 0) or 0
        total["passes_total"] += passes.get("total", 0) or 0
        total["passes_key"] += passes.get("key", 0) or 0
        total["tackles_total"] += tackles.get("total", 0) or 0
        total["duels_won"] += duels.get("won", 0) or 0
        total["dribbles_success"] += dribbles.get("success", 0) or 0

        rating = games.get("rating")
        if rating:
            try:
                ratings.append(float(rating))
            except (ValueError, TypeError):
                pass

    if ratings:
        total["rating_avg"] = sum(ratings) / len(ratings)

    return {"seasons": [], "total": total}


@router.get("/search")
async def search_players(
    q: str = Query(..., min_length=1, description="Search query"),
    league: int = Query(None, description="League ID filter"),
    season: int = Query(2024, description="Season year"),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search players via API-Football.
    Results are cached for future requests.

    If no league specified, searches leagues one at a time until results found.
    """
    try:
        # Check cache first
        cache_key = f"{q}:{league}:{season}"
        cached = cache_service.get(f"search:{cache_key}")
        if cached:
            return {**cached, "cached": True}

        players = []

        # If league specified, search just that league
        if league:
            response = await api_client.search_players(q, league=league, season=season)
            results = response.get("response", []) or []
        else:
            # Search leagues one by one until we find results
            # Priority: Premier League -> La Liga -> Ligue 1 -> Serie A -> Bundesliga
            leagues_to_try = [
                (39, "Premier League"),
                (140, "La Liga"),
                (61, "Ligue 1"),
                (135, "Serie A"),
                (78, "Bundesliga"),
            ]

            results = []
            for league_id, league_name in leagues_to_try:
                if len(results) >= limit:
                    break
                try:
                    response = await api_client.search_players(q, league=league_id, season=season)
                    league_results = response.get("response", []) or []

                    # Add non-duplicate results
                    for item in league_results:
                        player_id = item.get("player", {}).get("id")
                        if player_id and not any(p.get("player", {}).get("id") == player_id for p in results):
                            results.append(item)

                    logger.info(f"Search '{q}' in {league_name}: {len(league_results)} results")

                    # If we found results in this league, we're done
                    # (Unless user wants more results than we found)
                    if results and len(results) >= 3:
                        break

                except Exception as e:
                    logger.warning(f"Search in league {league_name} failed: {e}")
                    continue

        # Parse response
        for item in results[:limit]:
            parsed = parse_api_player_response({"response": [item]})
            if parsed:
                players.append({
                    "id": parsed["id"],
                    "name": parsed["name"],
                    "photo": parsed.get("photo"),
                    "age": parsed["age"],
                    "nationality": parsed["nationality"],
                    "position": parsed["position"],
                    "team_name": parsed.get("team_name"),
                    "team_logo": parsed.get("team_logo"),
                    "league_name": parsed.get("league_name"),
                    "rating": parsed.get("rating"),
                    "image_url": parsed.get("photo"),
                    "_raw": parsed,
                })

        result = {
            "response": players,
            "count": len(players),
            "query": q,
            "source": "api-football"
        }

        # Cache the results
        cache_service.set(f"search:{cache_key}", result, ttl=3600 * 24)

        return {**result, "cached": False}

    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_players(
    q: Optional[str] = Query(None, description="Search query"),
    position: Optional[str] = Query(None, description="Position filter"),
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    league: Optional[int] = Query(None, description="League ID filter"),
    season: int = Query(2024, description="Season year"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List players from database or API.
    """
    # If search query provided, use API
    if q:
        return await search_players(q=q, league=league, season=season, limit=limit)

    # Otherwise, try local database
    try:
        query = select(Player)

        if q:
            search_term = f"%{q}%"
            query = query.filter(
                or_(
                    Player.name.ilike(search_term),
                    Player.first_name.ilike(search_term),
                    Player.last_name.ilike(search_term)
                )
            )

        if position:
            query = query.filter(Player.position == position)

        if team_id:
            query = query.filter(Player.team_id == team_id)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)

        # Paginate
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit).order_by(Player.name)

        result = await db.execute(query)
        players = result.scalars().all()

        return {
            "response": [
                {
                    "id": p.id,
                    "name": p.name,
                    "photo": p.image_url,
                    "age": p.age,
                    "nationality": p.nationality,
                    "position": p.position,
                    "team_name": p.team_name,
                    "market_value_display": p.market_value_display,
                }
                for p in players
            ],
            "count": total or 0,
            "page": page,
            "limit": limit,
            "source": "local_db"
        }

    except Exception as e:
        logger.error(f"List players failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}")
async def get_player(
    player_id: int,
    season: int = Query(2024, description="Season year"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get player details with statistics from API.
    """
    try:
        # Check cache first
        cached = cache_service.get(f"player:{player_id}:{season}")
        if cached:
            return {**cached, "cached": True}

        # Get from API
        response = await api_client.get_player(player_id, season=season)
        parsed = parse_api_player_response(response)

        if not parsed:
            raise HTTPException(status_code=404, detail="Player not found")

        # Parse statistics
        stats_data = parse_stats(parsed.get("statistics", []))

        player_data = {
            "id": parsed["id"],
            "name": parsed["name"],
            "first_name": parsed.get("first_name"),
            "last_name": parsed.get("last_name"),
            "age": parsed["age"],
            "date_of_birth": parsed.get("date_of_birth"),
            "nationality": parsed["nationality"],
            "height_cm": parsed.get("height_cm"),
            "weight": parsed.get("weight"),
            "image_url": parsed.get("photo"),
            "position": parsed["position"],
            "position_raw": parsed.get("position_raw"),
            "team_id": parsed.get("team_id"),
            "team_name": parsed.get("team_name"),
            "team_logo": parsed.get("team_logo"),
            "league_id": parsed.get("league_id"),
            "league_name": parsed.get("league_name"),
            "league_logo": parsed.get("league_logo"),
            "rating": parsed.get("rating"),
            "stats": stats_data,
        }

        # Cache the result
        cache_service.set(f"player:{player_id}:{season}", player_data, ttl=3600 * 24 * 7)

        return {**player_data, "cached": False}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get player failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}/stats")
async def get_player_stats(
    player_id: int,
    season: int = Query(2024, description="Season year"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get player statistics.
    """
    try:
        # Check cache
        cached = cache_service.get(f"player_stats:{player_id}:{season}")
        if cached:
            return {**cached, "cached": True}

        # Get from API
        response = await api_client.get_player(player_id, season=season)
        parsed = parse_api_player_response(response)

        if not parsed:
            raise HTTPException(status_code=404, detail="Player not found")

        # Build stats response
        stats = parsed.get("statistics", [])
        result = parse_stats(stats)

        # Group by league
        leagues = {}
        for stat in stats:
            league_info = stat.get("league", {})
            league_name = league_info.get("name", "Unknown")
            if league_name not in ["Friendlies"]:
                games = stat.get("games", {})
                goals = stat.get("goals", {})
                cards = stat.get("cards", {})
                shots = stat.get("shots", {})

                leagues[league_name] = {
                    "appearances": games.get("appearences", 0),
                    "minutes": games.get("minutes", 0),
                    "goals": goals.get("total", 0),
                    "assists": goals.get("assists", 0),
                    "yellow_cards": cards.get("yellow", 0),
                    "red_cards": cards.get("red", 0),
                    "shots_total": shots.get("total", 0),
                    "shots_on": shots.get("on", 0),
                    "rating": games.get("rating"),
                    "position": games.get("position"),
                }

        response_data = {
            "player_id": player_id,
            "stats": {
                "total": result["total"],
                "by_league": leagues,
                "all": stats
            }
        }

        # Cache
        cache_service.set(f"player_stats:{player_id}:{season}", response_data, ttl=3600 * 24 * 3)

        return {**response_data, "cached": False}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get player stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}/seasons")
async def get_player_seasons(player_id: int):
    """
    Get seasons available for a player.
    """
    try:
        response = await api_client.get_player_seasons(player_id)
        return {"player_id": player_id, "seasons": response.get("response", [])}
    except Exception as e:
        logger.error(f"Get player seasons failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{player_id}/save")
async def save_player_to_db(
    player_id: int,
    season: int = Query(2024, description="Season year"),
    db: AsyncSession = Depends(get_db)
):
    """
    Save player to local database from API.
    """
    try:
        # Check if already exists
        existing = await db.get(Player, player_id)
        if existing:
            return {"message": "Player already exists", "player_id": player_id}

        # Get from API
        response = await api_client.get_player(player_id, season=season)
        parsed = parse_api_player_response(response)

        if not parsed:
            raise HTTPException(status_code=404, detail="Player not found")

        # Create player record
        player = Player(
            id=player_id,
            name=parsed["name"],
            first_name=parsed.get("first_name"),
            last_name=parsed.get("last_name"),
            age=parsed["age"],
            nationality=parsed["nationality"],
            height_cm=parsed.get("height_cm"),
            image_url=parsed.get("photo"),
            position=parsed["position"],
            team_id=parsed.get("team_id"),
            team_name=parsed.get("team_name"),
        )

        db.add(player)
        await db.commit()

        return {"message": "Player saved", "player_id": player_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save player failed: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
