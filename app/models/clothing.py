from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Clothing(Base):
    __tablename__ = "clothing"

    id = Column(Integer, primary_key=True, index=True)
    # FK vers users supprimée pour le MVP
    user_id = Column(Integer, ForeignKey("users.id"),
                     nullable=False, index=True)
    user = relationship("User", back_populates="clothings")

    name = Column(String(100), nullable=False)
    # top, bottom, shoes, outerwear, dress, accessory, other
    type = Column(String(50), nullable=False)
    color = Column(String(50), nullable=False)
    # casual, formal, sportswear, elegant…
    style = Column(String(50), nullable=True)
    pattern = Column(String(50), nullable=True)    # plain, striped, floral…
    brand = Column(String(100), nullable=True)
    price = Column(Float, nullable=True)
    description = Column(Text, nullable=True)

    image_url = Column(String(500), nullable=True)
    image_bg_removed_url = Column(String(500), nullable=True)
    auto_detected = Column(String(1), default="0")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
