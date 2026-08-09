"""
FutScout - Data Formatting Utilities
"""
from datetime import datetime
from typing import Dict, Any, Optional, List


def parse_api_date(date_str: Optional[str]) -> Optional[datetime]:
    """Parse date string to datetime."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return None


def format_date(date: Optional[datetime]) -> Optional[str]:
    """Format datetime to string."""
    if not date:
        return None
    return date.strftime("%Y-%m-%d")


def parse_player_detail_response(response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse player detail API response into clean format.

    Expected structure:
    {
        "status": "success",
        "response": {
            "detail": [
                {"title": "Height", "value": {"numberValue": 179, "fallback": "179 cm"}},
                ...
            ]
        }
    }
    """
    result = {}

    if not response or response.get("status") != "success":
        return result

    details = response.get("response", {}).get("detail", [])

    for item in details:
        title = item.get("title", "").lower().replace(" ", "_")
        value_data = item.get("value", {})

        # Extract value based on type
        if "numberValue" in value_data:
            result[title] = value_data["numberValue"]
        elif "dateValue" in value_data:
            result[title] = value_data["dateValue"]
        elif "key" in value_data and value_data["key"]:
            result[title] = value_data["key"]
        elif "fallback" in value_data:
            result[title] = value_data["fallback"]

    return result


def parse_player_search_response(response: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parse player search API response into clean format.

    Expected structure depends on actual API response.
    """
    if not response or response.get("status") != "success":
        return []

    # This will need to be adjusted based on actual search response format
    # For now, assume it returns an array in response.results or similar
    data = response.get("response", {})

    if isinstance(data, list):
        return data
    elif isinstance(data, dict):
        return data.get("results", data.get("players", []))
    return []


def build_player_response(player: Dict[str, Any], include_image: bool = True) -> Dict[str, Any]:
    """Build standardized player response."""
    return {
        "id": player.get("id"),
        "name": player.get("name"),
        "first_name": player.get("first_name"),
        "last_name": player.get("last_name"),
        "position": player.get("position"),
        "position_group": player.get("position_group"),
        "position_detailed": player.get("position_detailed"),
        "age": player.get("age"),
        "height_cm": player.get("height_cm"),
        "nationality": player.get("nationality"),
        "preferred_foot": player.get("preferred_foot"),
        "market_value": player.get("market_value"),
        "market_value_display": player.get("market_value_display"),
        "contract_until": player.get("contract_until"),
        "image_url": player.get("image_url"),
        "team": {
            "id": player.get("team_id"),
            "name": player.get("team_name") if hasattr(player, "team_name") else None
        } if player.get("team_id") else None
    }


def build_stats_response(stats: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Build standardized statistics response."""
    total_stats = {
        "appearances": 0,
        "minutes_played": 0,
        "goals": 0,
        "assists": 0,
        "yellow_cards": 0,
        "red_cards": 0
    }

    seasons = []

    for stat in stats:
        season = stat.get("season", "Unknown")
        seasons.append({
            "season": season,
            "competition": stat.get("competition"),
            "appearances": stat.get("appearances", 0),
            "minutes_played": stat.get("minutes_played", 0),
            "goals": stat.get("goals", 0),
            "assists": stat.get("assists", 0),
            "yellow_cards": stat.get("yellow_cards", 0),
            "red_cards": stat.get("red_cards", 0)
        })

        # Aggregate totals
        total_stats["appearances"] += stat.get("appearances", 0)
        total_stats["minutes_played"] += stat.get("minutes_played", 0)
        total_stats["goals"] += stat.get("goals", 0)
        total_stats["assists"] += stat.get("assists", 0)
        total_stats["yellow_cards"] += stat.get("yellow_cards", 0)
        total_stats["red_cards"] += stat.get("red_cards", 0)

    # Calculate per-90
    minutes = total_stats["minutes_played"]
    if minutes > 0 and minutes >= 90:
        total_stats["goals_per_90"] = round((total_stats["goals"] / minutes) * 90, 2)
        total_stats["assists_per_90"] = round((total_stats["assists"] / minutes) * 90, 2)
    else:
        total_stats["goals_per_90"] = 0
        total_stats["assists_per_90"] = 0

    return {
        "seasons": seasons,
        "total": total_stats
    }
