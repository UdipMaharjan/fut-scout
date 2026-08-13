"""
FutScout - API-Football Client
"""
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from app.config import API_FOOTBALL_KEY, API_FOOTBALL_HOST, API_FOOTBALL_BASE_URL
from app.services.cache import CacheService

logger = logging.getLogger(__name__)


class APIClient:
    """Client for API-Football."""

    def __init__(self):
        self.base_url = API_FOOTBALL_BASE_URL
        self.headers = {
            "x-apisports-key": API_FOOTBALL_KEY,
        }
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=self.headers,
                timeout=30.0,
                follow_redirects=True
            )
        return self._client

    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _request(self, method: str, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        """Make API request with usage tracking."""
        client = await self._get_client()
        url = f"{self.base_url}{endpoint}"

        try:
            # Track API usage
            usage = CacheService.get_api_usage()
            if usage["remaining"] <= 0:
                logger.warning(f"API daily limit reached ({usage['limit']}/{usage['limit']})")
                return {"error": "daily_limit_reached", "response": [], "results": 0}

            response = await client.get(url, params=params)
            response.raise_for_status()

            # Increment usage counter
            CacheService.increment_api_usage()

            return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"API request failed: {e}")
            raise

    # ==================== PLAYER ENDPOINTS ====================

    # Popular leagues to search
    POPULAR_LEAGUES = [39, 140, 61, 135, 78]  # Premier League, La Liga, Ligue 1, Serie A, Bundesliga

    async def search_players(self, query: str, league: int = None, season: int = None) -> Dict[str, Any]:
        """
        Search for players by name.
        GET /players?search={query}&league={league}&season={season}

        If no league specified, searches in multiple popular leagues to find the player.
        This ensures players like Mbappé (Ligue 1), Bellingham (La Liga) are found.
        """
        params = {"search": query}

        # Add league filter if specified
        if league:
            params["league"] = league
        else:
            # Search multiple leagues to find players across top European leagues
            params["league"] = self.POPULAR_LEAGUES[0]  # Default to Premier League

        if season:
            params["season"] = season

        data = await self._request("GET", "/players", params)
        return data

    async def search_players_multi_league(self, query: str, season: int = None) -> Dict[str, Any]:
        """
        Search for players across multiple leagues.
        Makes parallel requests to find players regardless of league.

        Note: This uses multiple API calls. Use sparingly for best player matches.
        """
        import asyncio

        async def search_league(league_id: int):
            params = {"search": query}
            if season:
                params["season"] = season
            return await self._request("GET", "/players", {"search": query, "league": league_id, **( {"season": season} if season else {} )})

        # Search top 5 leagues in parallel
        tasks = [search_league(lid) for lid in self.POPULAR_LEAGUES]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Merge and deduplicate results
        all_players = {}
        for result in results:
            if isinstance(result, dict) and result.get("response"):
                for item in result["response"]:
                    player = item.get("player", {})
                    player_id = player.get("id")
                    if player_id and player_id not in all_players:
                        all_players[player_id] = item

        return {"response": list(all_players.values()), "results": len(all_players)}

    async def get_player(self, player_id: int, season: int = None) -> Dict[str, Any]:
        """
        Get player details with statistics.
        GET /players?id={id}&season={season}
        """
        params = {"id": player_id}
        if season:
            params["season"] = season

        data = await self._request("GET", "/players", params)
        return data

    async def get_player_seasons(self, player_id: int) -> Dict[str, Any]:
        """
        Get player seasons (available data).
        GET /players/{id}/seasons
        """
        data = await self._request("GET", f"/players/{player_id}/seasons")
        return data

    # ==================== TEAM ENDPOINTS ====================

    async def get_team(self, team_id: int) -> Dict[str, Any]:
        """
        Get team details.
        GET /teams?id={id}
        """
        data = await self._request("GET", "/teams", {"id": team_id})
        return data

    async def search_teams(self, query: str) -> Dict[str, Any]:
        """
        Search for teams by name.
        GET /teams?search={query}
        """
        data = await self._request("GET", "/teams", {"search": query})
        return data

    async def get_team_squad(self, team_id: int, season: int = None) -> Dict[str, Any]:
        """
        Get team squad (players).
        GET /players?team={team_id}&season={season}
        """
        params = {"team": team_id}
        if season:
            params["season"] = season

        data = await self._request("GET", "/players", params)
        return data

    # ==================== LEAGUE ENDPOINTS ====================

    async def get_leagues(self, season: int = None, country: str = None) -> Dict[str, Any]:
        """
        Get available leagues.
        GET /leagues?season={season}&country={country}
        """
        params = {}
        if season:
            params["season"] = season
        if country:
            params["country"] = country

        data = await self._request("GET", "/leagues", params)
        return data

    async def get_league(self, league_id: int, season: int = None) -> Dict[str, Any]:
        """
        Get league details.
        GET /leagues?id={id}&season={season}
        """
        params = {"id": league_id}
        if season:
            params["season"] = season

        data = await self._request("GET", "/leagues", params)
        return data

    # ==================== STANDINGS ENDPOINTS ====================

    async def get_standings(self, league_id: int, season: int = None) -> Dict[str, Any]:
        """
        Get league standings.
        GET /standings?league={id}&season={season}
        """
        params = {"league": league_id}
        if season:
            params["season"] = season

        data = await self._request("GET", "/standings", params)
        return data

    # ==================== TOP SCORERS ====================

    async def get_top_scorers(self, league_id: int, season: int = None) -> Dict[str, Any]:
        """
        Get top scorers for a league.
        GET /players?league={id}&season={season}&sort=goals
        """
        params = {"league": league_id, "sort": "goals"}
        if season:
            params["season"] = season

        data = await self._request("GET", "/players", params)
        return data


# Singleton instance
api_client = APIClient()
