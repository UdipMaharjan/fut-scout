"""
FutScout - Statistics Utilities
"""
from typing import Dict, Any, List, Optional


def calculate_per_90(minutes: int, value: int) -> float:
    """Calculate per 90 minutes statistic."""
    if minutes <= 0 or minutes < 90:
        return 0.0
    return round((value / minutes) * 90, 2)


def format_market_value(value: int) -> str:
    """Format market value in millions/thousands."""
    if value >= 1_000_000:
        return f"€{value / 1_000_000:.1f}m"
    elif value >= 1_000:
        return f"€{value / 1_000:.0f}k"
    else:
        return f"€{value}"


def parse_market_value(value_str: str) -> int:
    """Parse market value string to integer."""
    if not value_str:
        return 0

    value_str = value_str.replace("€", "").replace(",", "").strip()

    multiplier = 1
    if "m" in value_str.lower():
        multiplier = 1_000_000
        value_str = value_str.lower().replace("m", "")
    elif "k" in value_str.lower():
        multiplier = 1_000
        value_str = value_str.lower().replace("k", "")

    try:
        return int(float(value_str) * multiplier)
    except (ValueError, TypeError):
        return 0


def infer_position_group(position: str) -> str:
    """Infer position group from detailed position."""
    if not position:
        return "MID"  # Default

    position_lower = position.lower()

    # Goalkeepers
    if any(gk in position_lower for gk in ["goalkeeper", "gk"]):
        return "GK"

    # Defenders
    if any(def_pos in position_lower for def_pos in ["back", "defender", "centre-back", "full-back", "center-back"]):
        return "DEF"

    # Attackers
    if any(att_pos in position_lower for att_pos in ["forward", "striker", "attacker", "winger"]):
        return "ATT"

    # Attacking Midfield
    if any(am_pos in position_lower for am_pos in ["attacking mid", "number 10", "cam", "trequartista"]):
        return "AM"

    # Default to Midfielder
    return "MID"


def get_position_group_name(group: str) -> str:
    """Get full name for position group."""
    names = {
        "GK": "Goalkeeper",
        "DEF": "Defender",
        "MID": "Midfielder",
        "ATT": "Forward",
        "AM": "Attacking Midfielder"
    }
    return names.get(group, group)


def aggregate_stats(stats_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregate multiple season stats into total."""
    total = {
        "appearances": 0,
        "minutes_played": 0,
        "goals": 0,
        "assists": 0,
        "yellow_cards": 0,
        "red_cards": 0
    }

    for stats in stats_list:
        total["appearances"] += stats.get("appearances", 0)
        total["minutes_played"] += stats.get("minutes_played", 0)
        total["goals"] += stats.get("goals", 0)
        total["assists"] += stats.get("assists", 0)
        total["yellow_cards"] += stats.get("yellow_cards", 0)
        total["red_cards"] += stats.get("red_cards", 0)

    return total


def calculate_similarity_score(player_a: Dict[str, Any], player_b: Dict[str, Any]) -> float:
    """
    Calculate similarity score between two players.
    Uses simplified feature comparison.
    """
    score = 0.0
    factors = 0

    stats_a = player_a.get("stats", {}).get("total", {})
    stats_b = player_b.get("stats", {}).get("total", {})

    # Position match
    if player_a.get("position_group") == player_b.get("position_group"):
        score += 0.3
    factors += 0.3

    # Age similarity (within 3 years = full points)
    age_diff = abs(player_a.get("age", 0) - player_b.get("age", 0))
    age_score = max(0, 0.15 - (age_diff * 0.05))
    score += age_score
    factors += 0.15

    # Goals per game similarity
    apps_a = max(1, stats_a.get("appearances", 1))
    apps_b = max(1, stats_b.get("appearances", 1))

    gpg_a = stats_a.get("goals", 0) / apps_a
    gpg_b = stats_b.get("goals", 0) / apps_b

    if gpg_a > 0 and gpg_b > 0:
        gpg_diff = abs(gpg_a - gpg_b) / max(gpg_a, gpg_b)
        gpg_score = max(0, 0.2 - (gpg_diff * 0.3))
        score += gpg_score
    factors += 0.2

    # Assists per game similarity
    apg_a = stats_a.get("assists", 0) / apps_a
    apg_b = stats_b.get("assists", 0) / apps_b

    if apg_a > 0 and apg_b > 0:
        apg_diff = abs(apg_a - apg_b) / max(apg_a, apg_b)
        apg_score = max(0, 0.2 - (apg_diff * 0.3))
        score += apg_score
    factors += 0.2

    # Nationality similarity
    if player_a.get("nationality") == player_b.get("nationality"):
        score += 0.1
    factors += 0.1

    # Normalize score to 0-1 range
    if factors > 0:
        return round(score / factors, 3)
    return 0.0
