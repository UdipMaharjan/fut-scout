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


@router.get("/search/local")
async def local_search_players(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Search players in local database (fallback when API is unavailable).
    """
    try:
        search_term = f"%{q}%"
        query = select(Player).filter(
            or_(
                Player.name.ilike(search_term),
                Player.first_name.ilike(search_term),
                Player.last_name.ilike(search_term)
            )
        ).limit(limit)

        result = await db.execute(query)
        players = result.scalars().all()

        return {
            "response": [build_player_response(p) for p in players],
            "count": len(players),
            "query": q,
            "source": "local_db"
        }

    except Exception as e:
        logger.error(f"Local search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def api_search_players(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Search players via RapidAPI.
    Results are cached for future requests.
    Falls back to sample data when API is rate limited.
    """
    try:
        # Check cache first
        cached = cache_service.get_search(q)
        if cached:
            return {**cached, "cached": True}

        # Make API request
        response = await rapidapi_client.search_players(q)

        # Parse the response to extract player data
        # RapidAPI returns: { "status": "success", "response": { "suggestions": [...] } }
        suggestions = []
        if isinstance(response, dict):
            resp_data = response.get("response", {})
            # Handle "suggestions" array from RapidAPI
            if isinstance(resp_data, dict):
                suggestions = resp_data.get("suggestions", [])
            elif isinstance(resp_data, list):
                suggestions = resp_data

        # Handle if response itself has suggestions (alternative structure)
        if not suggestions and isinstance(response, dict):
            suggestions = response.get("suggestions", response.get("response", []))

        # Transform to consistent format with id, name, etc.
        players = []
        for item in suggestions[:limit]:
            if isinstance(item, dict):
                player = {
                    "id": item.get("id"),
                    "name": item.get("name"),
                    "position": item.get("position") or "Unknown",
                    "age": item.get("age"),
                    "nationality": item.get("nationality"),
                    "market_value": item.get("market_value"),
                    "market_value_display": item.get("market_value_display") or item.get("market_value"),
                    "image_url": item.get("image_url") or item.get("photo"),
                    "team_name": item.get("teamName") or item.get("team_name") or item.get("team") or "Unknown"
                }
                if player["id"]:
                    # Convert id to int if it's a string
                    try:
                        player["id"] = int(player["id"])
                    except (ValueError, TypeError):
                        pass
                    players.append(player)

        result = {
            "response": players,
            "count": len(players),
            "query": q,
            "source": "rapidapi"
        }

        # Cache the results
        cache_service.set_search(q, result)

        return {**result, "cached": False}

    except Exception as e:
        logger.error(f"API search failed: {e}")

        # Return sample data as fallback when rate limited
        sample_players = get_sample_players(q)
        if sample_players:
            return {
                "response": sample_players,
                "count": len(sample_players),
                "query": q,
                "source": "sample_data",
                "note": "Using sample data due to API rate limiting"
            }

        # Return empty result if no sample data matches
        return {
            "response": [],
            "count": 0,
            "query": q,
            "source": "error",
            "error": str(e)
        }


def get_sample_players(query: str):
    """Get sample player data for demo purposes when API is unavailable."""
    query_lower = query.lower()

    # Sample player database
    sample_db = [
        {
            "id": 737066, "name": "Erling Haaland", "position": "ST",
            "age": "24", "nationality": "Norway", "market_value": "€180M",
            "market_value_display": "€180M", "image_url": "https://images.fotmob.com/image_resources/playerimages/737066.png",
            "team_name": "Manchester City", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8456_large.png",
            "rating": 91, "club": "Manchester City", "league": "Premier League"
        },
        {
            "id": 459007, "name": "Kylian Mbappé", "position": "ST",
            "age": "26", "nationality": "France", "market_value": "€180M",
            "market_value_display": "€180M", "image_url": "https://images.fotmob.com/image_resources/playerimages/459007.png",
            "team_name": "Real Madrid", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8633_large.png",
            "rating": 92, "club": "Real Madrid", "league": "La Liga"
        },
        {
            "id": 238883, "name": "Jude Bellingham", "position": "CM",
            "age": "21", "nationality": "England", "market_value": "€180M",
            "market_value_display": "€180M", "image_url": "https://images.fotmob.com/image_resources/playerimages/238883.png",
            "team_name": "Real Madrid", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8633_large.png",
            "rating": 90, "club": "Real Madrid", "league": "La Liga"
        },
        {
            "id": 525971, "name": "Vinícius Jr", "position": "LW",
            "age": "24", "nationality": "Brazil", "market_value": "€150M",
            "market_value_display": "€150M", "image_url": "https://images.fotmob.com/image_resources/playerimages/525971.png",
            "team_name": "Real Madrid", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8633_large.png",
            "rating": 91, "club": "Real Madrid", "league": "La Liga"
        },
        {
            "id": 527826, "name": "Bukayo Saka", "position": "RW",
            "age": "23", "nationality": "England", "market_value": "€140M",
            "market_value_display": "€140M", "image_url": "https://images.fotmob.com/image_resources/playerimages/527826.png",
            "team_name": "Arsenal", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/9825_large.png",
            "rating": 88, "club": "Arsenal", "league": "Premier League"
        },
        {
            "id": 547816, "name": "Pedri", "position": "CM",
            "age": "22", "nationality": "Spain", "market_value": "€100M",
            "market_value_display": "€100M", "image_url": "https://images.fotmob.com/image_resources/playerimages/547816.png",
            "team_name": "Barcelona", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8637_large.png",
            "rating": 88, "club": "Barcelona", "league": "La Liga"
        },
        {
            "id": 538486, "name": "Jamal Musiala", "position": "CAM",
            "age": "21", "nationality": "Germany", "market_value": "€130M",
            "market_value_display": "€130M", "image_url": "https://images.fotmob.com/image_resources/playerimages/538486.png",
            "team_name": "Bayern Munich", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/9829_large.png",
            "rating": 88, "club": "Bayern Munich", "league": "Bundesliga"
        },
        {
            "id": 513394, "name": "Phil Foden", "position": "CAM",
            "age": "24", "nationality": "England", "market_value": "€150M",
            "market_value_display": "€150M", "image_url": "https://images.fotmob.com/image_resources/playerimages/513394.png",
            "team_name": "Manchester City", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8456_large.png",
            "rating": 89, "club": "Manchester City", "league": "Premier League"
        },
        {
            "id": 521967, "name": "Florian Wirtz", "position": "CAM",
            "age": "21", "nationality": "Germany", "market_value": "€130M",
            "market_value_display": "€130M", "image_url": "https://images.fotmob.com/image_resources/playerimages/521967.png",
            "team_name": "Bayer Leverkusen", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/10442_large.png",
            "rating": 87, "club": "Bayer Leverkusen", "league": "Bundesliga"
        },
        {
            "id": 742877, "name": "Lamine Yamal", "position": "RW",
            "age": "17", "nationality": "Spain", "market_value": "€150M",
            "market_value_display": "€150M", "image_url": "https://images.fotmob.com/image_resources/playerimages/742877.png",
            "team_name": "Barcelona", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8637_large.png",
            "rating": 86, "club": "Barcelona", "league": "La Liga"
        },
        {
            "id": 405905, "name": "Mohamed Salah", "position": "RW",
            "age": "32", "nationality": "Egypt", "market_value": "€55M",
            "market_value_display": "€55M", "image_url": "https://images.fotmob.com/image_resources/playerimages/405905.png",
            "team_name": "Liverpool", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8586_large.png",
            "rating": 89, "club": "Liverpool", "league": "Premier League"
        },
        {
            "id": 702584, "name": "William Saliba", "position": "CB",
            "age": "23", "nationality": "France", "market_value": "€90M",
            "market_value_display": "€90M", "image_url": "https://images.fotmob.com/image_resources/playerimages/702584.png",
            "team_name": "Arsenal", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/9825_large.png",
            "rating": 87, "club": "Arsenal", "league": "Premier League"
        },
        {
            "id": 481632, "name": "Rodri", "position": "CDM",
            "age": "28", "nationality": "Spain", "market_value": "€130M",
            "market_value_display": "€130M", "image_url": "https://images.fotmob.com/image_resources/playerimages/481632.png",
            "team_name": "Manchester City", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8456_large.png",
            "rating": 90, "club": "Manchester City", "league": "Premier League"
        },
        {
            "id": 503565, "name": "Achraf Hakimi", "position": "RB",
            "age": "26", "nationality": "Morocco", "market_value": "€70M",
            "market_value_display": "€70M", "image_url": "https://images.fotmob.com/image_resources/playerimages/503565.png",
            "team_name": "Paris Saint-Germain", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8488_large.png",
            "rating": 86, "club": "Paris Saint-Germain", "league": "Ligue 1"
        },
        {
            "id": 431616, "name": "Thibaut Courtois", "position": "GK",
            "age": "32", "nationality": "Belgium", "market_value": "€25M",
            "market_value_display": "€25M", "image_url": "https://images.fotmob.com/image_resources/playerimages/431616.png",
            "team_name": "Real Madrid", "team_logo": "https://images.fotmob.com/image_resources/logo/teamlogo/8633_large.png",
            "rating": 89, "club": "Real Madrid", "league": "La Liga"
        }
    ]

    # Filter by query match
    matches = []
    for player in sample_db:
        name_lower = player["name"].lower()
        if (query_lower in name_lower or
            query_lower in player["nationality"].lower() or
            query_lower in player["position"].lower() or
            query_lower in player["team_name"].lower() or
            query_lower in player["club"].lower()):
            matches.append(player)

    # If no specific matches, return top players
    if not matches:
        return sample_db[:8]

    return matches[:10]


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
                image_url = await rapidapi_client.get_player_logo(player_id)
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
            image_url = await rapidapi_client.get_player_logo(player_id)
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
