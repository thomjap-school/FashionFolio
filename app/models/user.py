"""app/models/user.py"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean
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

    # Premium
    is_premium = Column(Boolean, default=False)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)

    clothings = relationship("Clothing", back_populates="user")
    outfits = relationship("Outfit", back_populates="user")
