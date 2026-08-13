"""
FutScout - RapidAPI Football Client (Legacy - Now using API-Football)
This file is kept for backward compatibility but uses API-Football now.
"""
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from app.config import API_FOOTBALL_KEY, API_FOOTBALL_HOST, API_FOOTBALL_BASE_URL

logger = logging.getLogger(__name__)


class RapidAPIClient:
    """Client for RapidAPI Football Data - now using API-Football."""

    def __init__(self):
        self.base_url = API_FOOTBALL_BASE_URL
        self.headers = {
            "x-apisports-host": API_FOOTBALL_HOST,
            "x-apisports-key": API_FOOTBALL_KEY,
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
            if e.response.status_code == 429:
                logger.warning(f"Rate limited on {endpoint}")
                return {"error": "rate_limited", "response": []}
            logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"API request failed: {e}")
            raise

    # ==================== PLAYER ENDPOINTS ====================

    async def search_players(self, query: str, season: int = 2024) -> Dict[str, Any]:
        """Search for players by name."""
        data = await self._request(
            "GET",
            "/players",
            params={"search": query, "season": season}
        )
        return data

    async def get_player_detail(self, player_id: int, season: int = 2024) -> Dict[str, Any]:
        """Get player details."""
        data = await self._request(
            "GET",
            "/players",
            params={"id": player_id, "season": season}
        )
        return data

    async def get_player_logo(self, player_id: int) -> Optional[str]:
        """Get player image URL."""
        try:
            data = await self.get_player_detail(player_id)
            response = data.get("response", [])
            if response and len(response) > 0:
                return response[0].get("player", {}).get("photo")
        except Exception as e:
            logger.warning(f"Player logo fetch failed: {e}")
        return None

    async def get_player_statistics(self, player_id: int, season: int = 2024) -> Dict[str, Any]:
        """Get player statistics."""
        data = await self.get_player_detail(player_id, season)
        return data

    async def get_team_squad(self, team_id: int, season: int = 2024) -> Dict[str, Any]:
        """Get team squad with player details."""
        try:
            data = await self._request(
                "GET",
                "/players",
                params={"team": team_id, "season": season}
            )
            return data
        except Exception as e:
            logger.warning(f"Team squad fetch failed: {e}")
            return {}

    async def find_player_in_squad(self, team_id: int, player_id: int) -> Optional[Dict[str, Any]]:
        """Find a specific player in a team's squad."""
        try:
            data = await self.get_team_squad(team_id)
            squad_data = data.get("response", [])

            for item in squad_data:
                player = item.get("player", {})
                if str(player.get("id")) == str(player_id):
                    return player

            return None
        except Exception as e:
            logger.warning(f"Find player in squad failed: {e}")
            return None

    # ==================== TEAM ENDPOINTS ====================

    async def search_teams(self, query: str) -> Dict[str, Any]:
        """Search for teams by name."""
        try:
            data = await self._request(
                "GET",
                "/teams",
                params={"search": query}
            )
            return data
        except Exception as e:
            logger.warning(f"Team search failed: {e}")
            return {}

    async def get_team_logo(self, team_id: int) -> Optional[str]:
        """Get team logo URL."""
        try:
            data = await self._request(
                "GET",
                "/teams",
                params={"id": team_id}
            )
            response = data.get("response", [])
            if response and len(response) > 0:
                return response[0].get("team", {}).get("logo")
        except Exception as e:
            logger.warning(f"Team logo fetch failed: {e}")
        return None

    async def get_team_details(self, team_id: int) -> Dict[str, Any]:
        """Get team details."""
        try:
            data = await self._request(
                "GET",
                "/teams",
                params={"id": team_id}
            )
            return data
        except Exception as e:
            logger.warning(f"Team details fetch failed: {e}")
            return {}

    async def get_league_teams(self, league_id: int, season: int = 2024) -> Dict[str, Any]:
        """Get all teams in a league."""
        try:
            data = await self._request(
                "GET",
                "/teams",
                params={"league": league_id, "season": season}
            )
            return data
        except Exception as e:
            logger.warning(f"League teams fetch failed: {e}")
            return {}

    # ==================== LEAGUE ENDPOINTS ====================

    async def get_popular_leagues(self, season: int = 2024) -> Dict[str, Any]:
        """Get available leagues."""
        try:
            data = await self._request(
                "GET",
                "/leagues",
                params={"season": season}
            )
            return data
        except Exception as e:
            logger.warning(f"Leagues fetch failed: {e}")
            return {}

    async def get_league_seasons(self, league_id: int) -> Dict[str, Any]:
        """Get league info."""
        try:
            data = await self._request(
                "GET",
                "/leagues",
                params={"id": league_id}
            )
            return data
        except Exception as e:
            logger.warning(f"League seasons fetch failed: {e}")
            return {}

    async def get_countries(self) -> Dict[str, Any]:
        """Get all countries."""
        try:
            data = await self._request(
                "GET",
                "/leagues",
                params={}
            )
            return data
        except Exception as e:
            logger.warning(f"Countries fetch failed: {e}")
            return {}


# Singleton instance
rapidapi_client = RapidAPIClient()
