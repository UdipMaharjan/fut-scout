"""
FutScout - Team Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import logging

from app.database import get_db
from app.models.team import Team
from app.models.player import Player
from app.services.rapidapi import rapidapi_client
from app.services.cache import cache_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/teams", tags=["Teams"])


@router.get("/")
async def list_teams(
    league: Optional[str] = Query(None, description="Filter by league"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List teams from local database.
    """
    try:
        query = select(Team)

        if league:
            query = query.filter(Team.league.ilike(f"%{league}%"))

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)

        # Paginate
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit).order_by(Team.name)

        result = await db.execute(query)
        teams = result.scalars().all()

        return {
            "teams": [
                {
                    "id": t.id,
                    "name": t.name,
                    "short_name": t.short_name,
                    "logo_url": t.logo_url,
                    "league": t.league,
                    "country": t.country
                }
                for t in teams
            ],
            "count": total or 0,
            "page": page,
            "limit": limit
        }

    except Exception as e:
        logger.error(f"List teams failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{team_id}")
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get team details from local database.
    Falls back to API if not found.
    """
    try:
        team = await db.get(Team, team_id)

        if team:
            # Get players
            players_query = select(Player).where(Player.team_id == team_id)
            players_result = await db.execute(players_query)
            players = players_result.scalars().all()

            return {
                "id": team.id,
                "name": team.name,
                "short_name": team.short_name,
                "logo_url": team.logo_url,
                "league": team.league,
                "league_id": team.league_id,
                "country": team.country,
                "players": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "position": p.position
                    }
                    for p in players
                ],
                "cached": True
            }

        # Try API
        try:
            response = await rapidapi_client.get_team_detail(team_id)
            logo_url = None
            try:
                logo_url = await rapidapi_client.get_team_image(team_id)
            except:
                pass

            return {
                "id": team_id,
                "response": response,
                "logo_url": logo_url,
                "cached": False
            }

        except Exception as api_error:
            logger.error(f"API team fetch failed: {api_error}")
            raise HTTPException(status_code=404, detail="Team not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get team failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{team_id}/players")
async def get_team_players(
    team_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all players for a team.
    """
    try:
        query = select(Player).where(Player.team_id == team_id)
        result = await db.execute(query)
        players = result.scalars().all()

        return {
            "team_id": team_id,
            "players": [
                {
                    "id": p.id,
                    "name": p.name,
                    "position": p.position,
                    "age": p.age,
                    "nationality": p.nationality
                }
                for p in players
            ],
            "count": len(players)
        }

    except Exception as e:
        logger.error(f"Get team players failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{team_id}/save")
async def save_team_to_db(
    team_id: int,
    name: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Save team from API to local database.
    """
    try:
        # Check if exists
        existing = await db.get(Team, team_id)
        if existing:
            return {"message": "Team already exists", "team_id": team_id}

        # Fetch from API
        response = await rapidapi_client.get_team_detail(team_id)
        logo_url = None
        try:
            logo_url = await rapidapi_client.get_team_image(team_id)
        except:
            pass

        team = Team(
            id=team_id,
            name=name,
            logo_url=logo_url,
            cached_at=None
        )

        db.add(team)
        await db.commit()

        return {"message": "Team saved", "team_id": team_id}

    except Exception as e:
        logger.error(f"Save team failed: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
