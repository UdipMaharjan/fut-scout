"""
FutScout - Player Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
import logging

from app.database import get_db
from app.models.player import Player
from app.models.stats import PlayerStats
from app.services.rapidapi import rapidapi_client
from app.services.cache import cache_service
from app.utils.formatting import parse_player_detail_response, build_player_response, build_stats_response
from app.utils.stats import infer_position_group, parse_market_value, format_market_value

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/players", tags=["Players"])


@router.get("/")
async def search_players(
    q: Optional[str] = Query(None, description="Search query"),
    position: Optional[str] = Query(None, description="Position filter: GK, DEF, MID, ATT, AM"),
    team_id: Optional[int] = Query(None, description="Team ID filter"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Search players from local database.
    For enhanced search, use /search endpoint.
    """
    try:
        # Build query
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
            "players": [build_player_response(p) for p in players],
            "count": total or 0,
            "page": page,
            "limit": limit,
            "total_pages": ((total or 0) + limit - 1) // limit if total else 0
        }

    except Exception as e:
        logger.error(f"Search players failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def api_search_players(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Search players via RapidAPI.
    Results are cached for future requests.
    """
    try:
        # Check cache first
        cached = cache_service.get_search(q)
        if cached:
            return {**cached, "cached": True}

        # Make API request
        response = await rapidapi_client.search_players(q)

        # Cache the results
        cache_service.set_search(q, response)

        return {**response, "cached": False}

    except Exception as e:
        logger.error(f"API search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}")
async def get_player(
    player_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get player details from local database.
    Falls back to API if not found locally.
    """
    try:
        # Try local database first
        query = select(Player).options(
            selectinload(Player.stats)
        ).where(Player.id == player_id)

        result = await db.execute(query)
        player = result.scalar_one_or_none()

        if player:
            return {
                **build_player_response(player),
                "stats": build_stats_response([s.__dict__ for s in player.stats]) if player.stats else {"seasons": [], "total": {}},
                "cached": True
            }

        # Not found locally - try API
        try:
            response = await rapidapi_client.get_player_detail(player_id)
            parsed = parse_player_detail_response(response)

            # Get image
            try:
                image_url = await rapidapi_client.get_player_image(player_id)
                cache_service.set_player_image(player_id, image_url)
            except:
                image_url = None

            player_data = {
                "id": player_id,
                "name": f"Player {player_id}",  # API doesn't return name
                "age": parsed.get("age_sentencecase"),
                "height_cm": parsed.get("height_sentencecase"),
                "preferred_foot": parsed.get("preferred_foot"),
                "nationality": parsed.get("country_sentencecase"),
                "market_value": parsed.get("transfer_value"),
                "market_value_display": parsed.get("transfer_value"),
                "image_url": image_url,
                "position_group": "MID"  # Default
            }

            return {**player_data, "stats": {"seasons": [], "total": {}}, "cached": False}

        except Exception as api_error:
            logger.error(f"API fetch failed: {api_error}")
            raise HTTPException(status_code=404, detail="Player not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get player failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}/stats")
async def get_player_stats(
    player_id: int,
    season: Optional[str] = Query(None, description="Season (e.g., '2024')"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get player statistics from local database.
    Falls back to API if not found locally.
    """
    try:
        # Try local database first
        query = select(PlayerStats).where(PlayerStats.player_id == player_id)

        if season:
            query = query.where(PlayerStats.season == season)

        result = await db.execute(query)
        stats = result.scalars().all()

        if stats:
            return {
                "player_id": player_id,
                "stats": build_stats_response([s.__dict__ for s in stats]),
                "cached": True
            }

        # Not found locally - try API
        try:
            response = await rapidapi_client.get_player_statistics(player_id, season)
            cache_service.set_player_stats(player_id, response, season)

            return {
                "player_id": player_id,
                "stats": response,
                "cached": False
            }

        except Exception as api_error:
            logger.error(f"API stats fetch failed: {api_error}")
            return {
                "player_id": player_id,
                "stats": {"seasons": [], "total": {}},
                "cached": False,
                "message": "No statistics available"
            }

    except Exception as e:
        logger.error(f"Get player stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{player_id}/save")
async def save_player_to_db(
    player_id: int,
    name: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Save player from API to local database.
    Used for populating the local database.
    """
    try:
        # Check if already exists
        existing = await db.get(Player, player_id)
        if existing:
            return {"message": "Player already exists", "player_id": player_id}

        # Fetch from API
        detail_response = await rapidapi_client.get_player_detail(player_id)
        parsed = parse_player_detail_response(detail_response)

        image_url = None
        try:
            image_url = await rapidapi_client.get_player_image(player_id)
        except:
            pass

        # Create player record
        player = Player(
            id=player_id,
            name=name,
            age=parsed.get("age_sentencecase"),
            height_cm=parsed.get("height_sentencecase"),
            preferred_foot=parsed.get("preferred_foot"),
            nationality=parsed.get("country_sentencecase"),
            market_value=parsed.get("transfer_value"),
            market_value_display=parsed.get("transfer_value"),
            image_url=image_url,
            position_group=infer_position_group(parsed.get("position_sentencecase", ""))
        )

        db.add(player)
        await db.commit()

        return {"message": "Player saved", "player_id": player_id}

    except Exception as e:
        logger.error(f"Save player failed: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
