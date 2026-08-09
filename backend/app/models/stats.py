"""
FutScout - Player Statistics Model
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class PlayerStats(Base):
    """Player statistics model."""
    __tablename__ = "player_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    season = Column(String(10), index=True)  # e.g., "2024"
    competition = Column(String(100))

    # Match statistics
    appearances = Column(Integer, default=0)
    minutes_played = Column(Integer, default=0)
    goals = Column(Integer, default=0)
    assists = Column(Integer, default=0)

    # Cards
    yellow_cards = Column(Integer, default=0)
    red_cards = Column(Integer, default=0)

    # Goals by type (if available)
    goals_penalties = Column(Integer, default=0)
    goals_open_play = Column(Integer, default=0)

    # Minutes per goal/assist
    minutes_per_goal = Column(Integer)
    minutes_per_assist = Column(Integer)

    # Player relation
    player = relationship("Player", back_populates="stats")

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def goals_per_90(self):
        """Calculate goals per 90 minutes."""
        if self.minutes_played >= 90:
            return round((self.goals / self.minutes_played) * 90, 2)
        return 0

    @property
    def assists_per_90(self):
        """Calculate assists per 90 minutes."""
        if self.minutes_played >= 90:
            return round((self.assists / self.minutes_played) * 90, 2)
        return 0

    def __repr__(self):
        return f"<PlayerStats(player_id={self.player_id}, season='{self.season}')>"
