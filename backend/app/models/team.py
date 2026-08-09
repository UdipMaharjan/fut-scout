"""
FutScout - Team Model
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Team(Base):
    """Team model."""
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)  # API team ID
    name = Column(String(255), nullable=False, index=True)
    short_name = Column(String(50))
    logo_url = Column(String(500))

    # League info
    league = Column(String(100))
    league_id = Column(String(50))
    country = Column(String(100))

    # Players relation
    players = relationship("Player", back_populates="team")

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Cache metadata
    cached_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<Team(id={self.id}, name='{self.name}')>"
