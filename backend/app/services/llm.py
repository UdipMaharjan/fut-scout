"""
FutScout - LLM Service (Groq)
"""
from typing import Optional, Dict, Any
import logging
import os

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM interactions using Groq (free tier)."""

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.model = "llama-3.1-8b-instant"  # Free tier model
        self._client = None

    def _get_client(self):
        """Get Groq client."""
        if not self.api_key:
            logger.warning("GROQ_API_KEY not set. LLM features will be disabled.")
            return None

        if self._client is None:
            try:
                from groq import Groq
                self._client = Groq(api_key=self.api_key)
            except ImportError:
                logger.error("Groq package not installed. Run: pip install groq")
                return None

        return self._client

    async def generate_scouting_report(self, player_data: Dict[str, Any]) -> str:
        """
        Generate a scouting report for a player.

        Args:
            player_data: Processed player data including stats

        Returns:
            LLM-generated scouting report
        """
        client = self._get_client()
        if not client:
            return "AI scouting reports are currently unavailable."

        prompt = self._build_scouting_prompt(player_data)

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional football scout with decades of experience analyzing players across all major leagues. Provide concise, insightful, and data-driven scouting reports."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=800
            )
            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return f"Failed to generate scouting report: {str(e)}"

    async def explain_comparison(self, player_a: Dict, player_b: Dict) -> str:
        """
        Generate explanation for player comparison.

        Args:
            player_a: First player's data
            player_b: Second player's data

        Returns:
            LLM-generated comparison explanation
        """
        client = self._get_client()
        if not client:
            return "AI comparison is currently unavailable."

        prompt = self._build_comparison_prompt(player_a, player_b)

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional football analyst comparing two players. Focus on statistical differences and playing style implications."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,
                max_tokens=600
            )
            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"LLM comparison failed: {e}")
            return f"Failed to generate comparison: {str(e)}"

    def _build_scouting_prompt(self, player_data: Dict) -> str:
        """Build prompt for scouting report."""
        name = player_data.get("name", "Unknown Player")
        position = player_data.get("position", "Unknown")
        age = player_data.get("age", "Unknown")
        nationality = player_data.get("nationality", "Unknown")
        team = player_data.get("team_name", "Unknown")
        market_value = player_data.get("market_value_display", "Unknown")

        stats = player_data.get("stats", {})
        total_stats = stats.get("total", {})

        appearances = total_stats.get("appearances", 0)
        goals = total_stats.get("goals", 0)
        assists = total_stats.get("assists", 0)
        minutes = total_stats.get("minutes_played", 0)
        yellow_cards = total_stats.get("yellow_cards", 0)
        red_cards = total_stats.get("red_cards", 0)

        # Calculate per-90 stats
        if minutes > 0 and minutes >= 90:
            g_per_90 = round((goals / minutes) * 90, 2)
            a_per_90 = round((assists / minutes) * 90, 2)
        else:
            g_per_90 = 0
            a_per_90 = 0

        prompt = f"""Generate a professional scouting report for the following player:

**Player Information:**
- Name: {name}
- Position: {position}
- Age: {age}
- Nationality: {nationality}
- Team: {team}
- Market Value: {market_value}

**Season Statistics:**
- Appearances: {appearances}
- Goals: {goals}
- Assists: {assists}
- Minutes Played: {minutes}
- Goals per 90: {g_per_90}
- Assists per 90: {a_per_90}
- Yellow Cards: {yellow_cards}
- Red Cards: {red_cards}

Please provide a scouting report covering:
1. **Overview** - Brief summary of the player
2. **Strengths** - Key strengths based on statistics
3. **Areas for Development** - Weaknesses or areas to improve
4. **Playing Style** - How they play based on available data
5. **Verdict** - Overall assessment

Keep it concise (200-300 words) and professional."""
        return prompt

    def _build_comparison_prompt(self, player_a: Dict, player_b: Dict) -> str:
        """Build prompt for player comparison."""
        def format_player(p: Dict) -> str:
            name = p.get("name", "Unknown")
            position = p.get("position", "Unknown")
            stats = p.get("stats", {}).get("total", {})
            return f"{name} ({position}): G={stats.get('goals', 0)}, A={stats.get('assists', 0)}, Apps={stats.get('appearances', 0)}"

        prompt = f"""Compare these two football players:

**Player A:** {format_player(player_a)}

**Player B:** {format_player(player_b)}

Please provide:
1. **Statistical Comparison** - Who has the edge in key metrics
2. **Playing Style Differences** - How their approaches differ
3. **When to Prefer Each** - Situational recommendations
4. **Overall Verdict** - Who is currently performing better

Keep it concise (150-200 words) and insightful."""
        return prompt


# Singleton instance
llm_service = LLMService()
