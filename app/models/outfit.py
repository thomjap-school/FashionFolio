"""app/models/outfit.py"""

from sqlalchemy import (Column,
                        Integer,
                        String,
                        Boolean,
                        DateTime,
                        ForeignKey,
                        Text
                        )
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    haut_id = Column(Integer, ForeignKey("clothing.id"), nullable=True)
    bas_id = Column(Integer, ForeignKey("clothing.id"), nullable=True)
    chaussures_id = Column(Integer, ForeignKey("clothing.id"), nullable=True)
    accessoire_id = Column(Integer, ForeignKey("clothing.id"), nullable=True)
    description = Column(Text, nullable=True)
    validated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="outfits")
