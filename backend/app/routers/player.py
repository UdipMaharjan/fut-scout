"""
FutScout - Comprehensive Player Endpoint
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
import logging

from app.services.rapidapi import rapidapi_client
from app.services.cache import cache_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/player", tags=["Player"])


def parse_player_detail(response: Dict[str, Any]) -> Dict[str, Any]:
    """Parse player detail API response."""
    result = {}
    details = response.get("response", {}).get("detail", [])

    for item in details:
        title = item.get("title", "").lower()
        value_data = item.get("value", {})
        translation_key = item.get("translationKey", "")

        if translation_key == "height_sentencecase":
            result["height_cm"] = value_data.get("numberValue")
        elif translation_key == "age_sentencecase":
            result["age"] = value_data.get("fallback")
        elif translation_key == "preferred_foot":
            result["preferred_foot"] = value_data.get("key") or value_data.get("fallback")
        elif translation_key == "country_sentencecase":
            result["nationality"] = value_data.get("fallback")
        elif translation_key == "transfer_value":
            result["market_value"] = value_data.get("fallback")
        elif translation_key == "shirt":
            result["shirt_number"] = value_data.get("fallback")
        elif translation_key == "contract_end":
            result["contract_until"] = value_data.get("dateValue")

    return result


def parse_squad_player(member: Dict[str, Any]) -> Dict[str, Any]:
    """Parse player data from squad response."""
    return {
        "position": member.get("positionIdsDesc") or member.get("role", {}).get("fallback"),
        "position_id": member.get("positionId"),
        "position_ids": member.get("positionIds"),
        "date_of_birth": member.get("dateOfBirth"),
        "nationality": member.get("cname"),
        "country_code": member.get("ccode"),
        "height_cm": member.get("height"),
        "shirt_number": member.get("shirtNumber"),
        "transfer_value": member.get("transferValue"),
        "goals": member.get("goals"),
        "assists": member.get("assists"),
        "rating": member.get("rating"),
        "yellow_cards": member.get("ycards"),
        "red_cards": member.get("rcards"),
    }


@router.get("/{player_id}")
async def get_player_full(player_id: int):
    """
    Get comprehensive player data from multiple sources.
    Merges data from search, detail, and squad endpoints.
    """
    try:
        # Check cache first
        cached = cache_service.get(f"player_full:{player_id}")
        if cached:
            return {**cached, "cached": True}

        result = {
            "id": player_id,
            "name": None,
            "team_id": None,
            "team_name": None,
            "team_logo": None,
            "league_id": None,
            "league_name": None,
            "image_url": None,
            "position": None,
            "position_id": None,
            "position_ids": None,
            "age": None,
            "date_of_birth": None,
            "nationality": None,
            "country_code": None,
            "height_cm": None,
            "preferred_foot": None,
            "market_value": None,
            "shirt_number": None,
            "contract_until": None,
            "stats": {
                "goals": 0,
                "assists": 0,
                "rating": None,
                "yellow_cards": 0,
                "red_cards": 0
            }
        }

        # Try to get player detail (has market value, preferred foot)
        try:
            detail_response = await rapidapi_client.get_player_detail(player_id)
            detail_data = parse_player_detail(detail_response)
            result.update(detail_data)
        except Exception as e:
            logger.warning(f"Player detail fetch failed: {e}")

        # Get player image
        try:
            image_url = await rapidapi_client.get_player_logo(player_id)
            if image_url:
                result["image_url"] = image_url
        except Exception as e:
            logger.warning(f"Player image fetch failed: {e}")

        # Try to find player in squad for position data
        # We need team_id first - it's available in search but not in detail
        # For now, we'll set position as null and let frontend enrich it
        # when coming from search results

        # Cache the result
        cache_service.set(f"player_full:{player_id}", result, ttl=3600)  # 1 hour

        return {**result, "cached": False}

    except Exception as e:
        logger.error(f"Get player failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}/from-search")
async def enrich_player_from_search(
    player_id: int,
    name: str = None,
    team_id: int = None,
    team_name: str = None
):
    """
    Enrich player data using information from search results.
    Call this after a search to get complete player data.
    """
    try:
        # Build result with search data
        result = {
            "id": player_id,
            "name": name,
            "team_id": team_id,
            "team_name": team_name,
            "team_logo": None,
            "league_id": None,
            "league_name": None,
            "image_url": None,
            "position": None,
            "position_id": None,
            "age": None,
            "date_of_birth": None,
            "nationality": None,
            "height_cm": None,
            "preferred_foot": None,
            "market_value": None,
            "shirt_number": None,
            "contract_until": None,
            "stats": {
                "goals": 0,
                "assists": 0
            }
        }

        # Get player detail (has age, market value, preferred foot, height)
        try:
            detail_response = await rapidapi_client.get_player_detail(player_id)
            detail_data = parse_player_detail(detail_response)
            result.update(detail_data)
        except Exception as e:
            logger.warning(f"Player detail failed: {e}")

        # Get player image
        try:
            image_url = await rapidapi_client.get_player_logo(player_id)
            if image_url:
                result["image_url"] = image_url
        except Exception as e:
            logger.warning(f"Player image failed: {e}")

        # Get team squad to find position and other player data
        if team_id:
            try:
                squad_player = await rapidapi_client.find_player_in_squad(team_id, player_id)
                if squad_player:
                    squad_data = parse_squad_player(squad_player)
                    result.update(squad_data)
                    result["stats"]["goals"] = squad_player.get("goals", 0) or 0
                    result["stats"]["assists"] = squad_player.get("assists", 0) or 0
            except Exception as e:
                logger.warning(f"Squad player lookup failed: {e}")

            # Get team logo
            try:
                team_logo = await rapidapi_client.get_team_logo(team_id)
                if team_logo:
                    result["team_logo"] = team_logo
            except Exception as e:
                logger.warning(f"Team logo failed: {e}")

            # Get team details (for league info)
            try:
                team_details = await rapidapi_client.get_team_details(team_id)
                details = team_details.get("response", {}).get("details", {})
                result["league_id"] = details.get("leagueId")
                result["league_name"] = details.get("leagueName")
            except Exception as e:
                logger.warning(f"Team details failed: {e}")

        return result

    except Exception as e:
        logger.error(f"Enrich player failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
