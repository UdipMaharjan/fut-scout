"""
FutScout - RapidAPI Football Client
"""
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from app.config import RAPIDAPI_KEY, RAPIDAPI_HOST, RAPIDAPI_BASE_URL

logger = logging.getLogger(__name__)


class RapidAPIClient:
    """Client for RapidAPI Football Data."""

    def __init__(self):
        self.base_url = RAPIDAPI_BASE_URL
        self.headers = {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
            "Content-Type": "application/json"
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

    async def _request(self, method: str, endpoint: str, params: Dict = None, data: Dict = None) -> Dict[str, Any]:
        """Make API request."""
        client = await self._get_client()
        url = f"{self.base_url}{endpoint}"

        try:
            if method.upper() == "GET":
                response = await client.get(url, params=params)
            elif method.upper() == "POST":
                response = await client.post(url, json=data)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"API request failed: {e}")
            raise

    # ==================== PLAYER ENDPOINTS ====================

    async def search_players(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for players by name.
        GET /football-players-search?search={query}
        """
        data = await self._request(
            "GET",
            "/football-players-search",
            params={"search": query}
        )
        return data

    async def get_player_detail(self, player_id: int) -> Dict[str, Any]:
        """
        Get player details (bio, age, height, market value, etc.)
        GET /football-get-player-detail?playerid={id}
        """
        data = await self._request(
            "GET",
            "/football-get-player-detail",
            params={"playerid": player_id}
        )
        return data

    async def get_player_image(self, player_id: int) -> str:
        """
        Get player image URL.
        GET /football-get-player-image?playerid={id}
        """
        data = await self._request(
            "GET",
            "/football-get-player-image",
            params={"playerid": player_id}
        )
        return data.get("response", "")

    async def get_player_statistics(self, player_id: int, season: str = None) -> Dict[str, Any]:
        """
        Get player statistics.
        GET /football-get-player-statistics?playerid={id}&season={season}
        """
        params = {"playerid": player_id}
        if season:
            params["season"] = season

        data = await self._request(
            "GET",
            "/football-get-player-statistics",
            params=params
        )
        return data

    async def get_player_matches(self, player_id: int, page: int = 1) -> Dict[str, Any]:
        """
        Get player's match history.
        GET /football-get-matchs-by-player-id?playerid={id}&page={page}
        """
        data = await self._request(
            "GET",
            "/football-get-matchs-by-player-id",
            params={"playerid": player_id, "page": page}
        )
        return data

    # ==================== TEAM ENDPOINTS ====================

    async def get_team_detail(self, team_id: int) -> Dict[str, Any]:
        """
        Get team details.
        GET /football-get-team-detail?teamid={id}
        """
        data = await self._request(
            "GET",
            "/football-get-team-detail",
            params={"teamid": team_id}
        )
        return data

    async def get_team_image(self, team_id: int) -> str:
        """
        Get team logo URL.
        GET /football-get-team-image?teamid={id}
        """
        data = await self._request(
            "GET",
            "/football-get-team-image",
            params={"teamid": team_id}
        )
        return data.get("response", "")

    async def get_team_matches(self, team_id: int, page: int = 1) -> Dict[str, Any]:
        """
        Get team's match history.
        GET /football-get-matchs-by-team-id?teamid={id}&page={page}
        """
        data = await self._request(
            "GET",
            "/football-get-matchs-by-team-id",
            params={"teamid": team_id, "page": page}
        )
        return data

    # ==================== LEAGUE ENDPOINTS ====================

    async def get_standings(self, league_id: int) -> Dict[str, Any]:
        """
        Get league standings.
        GET /football-get-standing?leagueid={id}
        """
        data = await self._request(
            "GET",
            "/football-get-standing",
            params={"leagueid": league_id}
        )
        return data

    async def get_league_matches(self, league_id: int, page: int = 1) -> Dict[str, Any]:
        """
        Get league matches.
        GET /football-get-matchs-by-league-id?leagueid={id}&page={page}
        """
        data = await self._request(
            "GET",
            "/football-get-matchs-by-league-id",
            params={"leagueid": league_id, "page": page}
        )
        return data


# Singleton instance
rapidapi_client = RapidAPIClient()
