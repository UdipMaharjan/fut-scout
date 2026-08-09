"""
FutScout - Player Model
"""
from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Player(Base):
    """Player model."""
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)  # API player ID
    name = Column(String(255), nullable=False, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    position = Column(String(50))  # GK, DEF, MID, FWD
    position_detailed = Column(String(100))

    # Physical/Bio
    nationality = Column(String(100))
    age = Column(Integer)
    height_cm = Column(Integer)
    weight_kg = Column(Integer)
    preferred_foot = Column(String(20))  # Left, Right, Both

    # Contract/Value
    market_value = Column(Integer)  # In EUR
    market_value_display = Column(String(50))  # "€9.9m"
    contract_until = Column(Date)

    # Image
    image_url = Column(String(500))

    # Team relation
    team_id = Column(Integer, ForeignKey("teams.id"))
    team = relationship("Team", back_populates="players")

    # Stats relation
    stats = relationship("PlayerStats", back_populates="player", cascade="all, delete-orphan")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Cache metadata
    detail_cached_at = Column(DateTime(timezone=True))
    stats_cached_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<Player(id={self.id}, name='{self.name}')>"
