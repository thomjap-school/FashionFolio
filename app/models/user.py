from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True)
    password_hash = Column(String)
    profile_picture = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    clothings = relationship("Clothing", back_populates="user")
    # outfits = relationship("Outfit", back_populates="user")
