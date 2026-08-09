"""
FutScout - Seed Data Script

This script populates the database with popular football players.
Run this once to set up the initial player database.

Usage:
    python -m scripts.seed_players
"""
import asyncio
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import async_session_maker, init_db
from app.models.player import Player
from app.models.team import Team
from app.services.rapidapi import rapidapi_client
from app.utils.stats import infer_position_group, parse_market_value


# Popular players to seed (ID, Name pairs)
# These should be real player IDs from the API
POPULAR_PLAYERS = [
    # Real Madrid
    {"id": 671529, "name": "Vladimir Vatsek", "team": "Real Madrid"},

    # More players will be added when discovered through search
]

# League IDs for major competitions
LEAGUE_IDS = {
    "Premier League": 1,
    "La Liga": 2,
    "Serie A": 3,
    "Bundesliga": 4,
    "Ligue 1": 5
}


async def seed_teams():
    """Seed teams from API."""
    print("Seeding teams...")

    async with async_session_maker() as session:
        for league_name, league_id in LEAGUE_IDS.items():
            try:
                response = await rapidapi_client.get_standings(league_id)
                print(f"  {league_name}: {len(response.get('response', {}).get('standings', []))} teams")

                # Parse and save teams (structure depends on API response)
                # This will need adjustment based on actual response format

            except Exception as e:
                print(f"  Error fetching {league_name}: {e}")


async def seed_player(player_data: dict):
    """Save a single player to database."""
    async with async_session_maker() as session:
        # Check if exists
        existing = await session.get(Player, player_data["id"])
        if existing:
            return f"Player {player_data['id']} already exists"

        # Fetch details from API
        try:
            detail_response = await rapidapi_client.get_player_detail(player_data["id"])
            image_url = None
            try:
                image_url = await rapidapi_client.get_player_image(player_data["id"])
            except:
                pass

            # Parse detail response
            detail = detail_response.get("response", {}).get("detail", [])

            # Extract values
            age = None
            height = None
            foot = None
            nationality = None
            market_value = None
            contract = None

            for item in detail:
                title = item.get("title", "").lower()
                value_data = item.get("value", {})

                if "age" in title:
                    age = value_data.get("numberValue")
                elif "height" in title:
                    height = value_data.get("numberValue")
                elif "foot" in title:
                    foot = value_data.get("key") or value_data.get("fallback")
                elif "country" in title:
                    nationality = value_data.get("fallback")
                elif "market" in title or "value" in title:
                    market_value_raw = value_data.get("fallback")
                    market_value = parse_market_value(str(market_value_raw)) if market_value_raw else None
                elif "contract" in title:
                    contract = value_data.get("dateValue")

            # Create player
            player = Player(
                id=player_data["id"],
                name=player_data["name"],
                age=age,
                height_cm=height,
                preferred_foot=foot,
                nationality=nationality,
                market_value=market_value,
                market_value_display=value_data.get("fallback"),
                image_url=image_url,
                position_group="MID",  # Default, can be updated
                team_id=player_data.get("team_id")
            )

            session.add(player)
            await session.commit()

            return f"Saved: {player_data['name']}"

        except Exception as e:
            await session.rollback()
            return f"Error saving {player_data['name']}: {e}"


async def search_and_seed(query: str, max_results: int = 10):
    """Search for players and seed them."""
    print(f"\nSearching for: {query}")

    try:
        response = await rapidapi_client.search_players(query)
        results = response.get("response", [])

        # Parse results based on actual structure
        # This will need adjustment based on actual search response format
        if isinstance(results, list):
            players_to_seed = results[:max_results]
        elif isinstance(results, dict):
            players_to_seed = results.get("results", [])[:max_results]
        else:
            players_to_seed = []

        print(f"  Found {len(players_to_seed)} players")

        for player in players_to_seed:
            # Extract ID and name (structure depends on API)
            player_id = player.get("id") or player.get("player_id")
            player_name = player.get("name") or player.get("full_name")

            if player_id and player_name:
                result = await seed_player({"id": player_id, "name": player_name})
                print(f"    {result}")

    except Exception as e:
        print(f"  Search failed: {e}")


async def main():
    """Main seed function."""
    print("=" * 50)
    print("FutScout - Database Seed Script")
    print("=" * 50)

    # Initialize database
    print("\nInitializing database...")
    await init_db()
    print("Database initialized!")

    # Search for popular players
    search_queries = [
        "bellingham",
        "mbappe",
        "haaland",
        "messi",
        "ronaldo",
        "pedri",
        "vinicius",
        "saka",
        "bruzusa",
        "bellingam"
    ]

    for query in search_queries:
        await search_and_seed(query, max_results=5)

    print("\n" + "=" * 50)
    print("Seeding complete!")
    print("=" * 50)

    # Cleanup
    await rapidapi_client.close()


if __name__ == "__main__":
    asyncio.run(main())
