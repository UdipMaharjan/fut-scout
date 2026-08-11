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
            # For rate limiting (429), return empty response instead of raising
            if e.response.status_code == 429:
                logger.warning(f"Rate limited on {endpoint}")
                return {"error": "rate_limited", "response": []}
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"API request failed: {e}")
            raise

    # ==================== PLAYER ENDPOINTS ====================

    async def search_players(self, query: str) -> Dict[str, Any]:
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

    async def get_player_logo(self, player_id: int) -> Optional[str]:
        """
        Get player image URL.
        GET /football-get-player-logo?playerid={id}
        """
        try:
            data = await self._request(
                "GET",
                "/football-get-player-logo",
                params={"playerid": player_id}
            )
            return data.get("response", {}).get("url") or data.get("response")
        except Exception as e:
            logger.warning(f"Player logo fetch failed: {e}")
            return None

    async def get_player_statistics(self, player_id: int, season: str = None) -> Dict[str, Any]:
        """
        Get player statistics (placeholder - actual stats not available from this API).
        """
        # This API doesn't provide player statistics
        # Return empty stats structure
        return {"seasons": [], "total": {}}

    async def get_team_squad(self, team_id: int) -> Dict[str, Any]:
        """
        Get team squad with player details including position.
        GET /football-get-list-player?teamid={id}
        """
        try:
            data = await self._request(
                "GET",
                "/football-get-list-player",
                params={"teamid": team_id}
            )
            return data
        except Exception as e:
            logger.warning(f"Team squad fetch failed: {e}")
            return {}

    async def find_player_in_squad(self, team_id: int, player_id: int) -> Optional[Dict[str, Any]]:
        """
        Find a specific player in a team's squad to get position data.
        """
        try:
            data = await self.get_team_squad(team_id)
            squad_data = data.get("response", {}).get("list", {}).get("squad", [])

            for section in squad_data:
                for member in section.get("members", []):
                    if str(member.get("id")) == str(player_id):
                        return member

            return None
        except Exception as e:
            logger.warning(f"Find player in squad failed: {e}")
            return None

    # ==================== TEAM ENDPOINTS ====================

    async def search_teams(self, query: str) -> Dict[str, Any]:
        """
        Search for teams by name.
        GET /football-teams-search?search={query}
        """
        try:
            data = await self._request(
                "GET",
                "/football-teams-search",
                params={"search": query}
            )
            return data
        except Exception as e:
            logger.warning(f"Team search failed: {e}")
            return {}

    async def get_team_logo(self, team_id: int) -> Optional[str]:
        """
        Get team logo URL.
        GET /football-team-logo?teamid={id}
        """
        try:
            data = await self._request(
                "GET",
                "/football-team-logo",
                params={"teamid": team_id}
            )
            return data.get("response", {}).get("url") or data.get("response")
        except Exception as e:
            logger.warning(f"Team logo fetch failed: {e}")
            return None

    async def get_team_details(self, team_id: int) -> Dict[str, Any]:
        """
        Get team details (stadium, capacity, country, etc.)
        GET /football-league-team?teamid={id}
        """
        try:
            data = await self._request(
                "GET",
                "/football-league-team",
                params={"teamid": team_id}
            )
            return data
        except Exception as e:
            logger.warning(f"Team details fetch failed: {e}")
            return {}

    async def get_league_teams(self, league_id: int) -> Dict[str, Any]:
        """
        Get all teams in a league.
        GET /football-get-list-all-team?leagueid={id}
        """
        try:
            data = await self._request(
                "GET",
                "/football-get-list-all-team",
                params={"leagueid": league_id}
            )
            return data
        except Exception as e:
            logger.warning(f"League teams fetch failed: {e}")
            return {}

    # ==================== LEAGUE ENDPOINTS ====================

    async def get_popular_leagues(self) -> Dict[str, Any]:
        """
        Get popular leagues.
        GET /football-popular-leagues
        """
        try:
            data = await self._request(
                "GET",
                "/football-popular-leagues",
                params={}
            )
            return data
        except Exception as e:
            logger.warning(f"Popular leagues fetch failed: {e}")
            return {}

    async def get_league_seasons(self, league_id: int) -> Dict[str, Any]:
        """
        Get all seasons for a league.
        GET /football-league-all-seasons?leagueid={id}
        """
        try:
            data = await self._request(
                "GET",
                "/football-league-all-seasons",
                params={"leagueid": league_id}
            )
            return data
        except Exception as e:
            logger.warning(f"League seasons fetch failed: {e}")
            return {}

    async def get_countries(self) -> Dict[str, Any]:
        """
        Get all countries.
        GET /football-get-all-countries
        """
        try:
            data = await self._request(
                "GET",
                "/football-get-all-countries",
                params={}
            )
            return data
        except Exception as e:
            logger.warning(f"Countries fetch failed: {e}")
            return {}


# Singleton instance
rapidapi_client = RapidAPIClient()
