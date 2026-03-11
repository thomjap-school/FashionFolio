from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class FriendshipStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    friend_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(FriendshipStatus), default=FriendshipStatus.pending)
    created_at = Column(DateTime, server_default=func.now())

class OutfitPost(Base):
    __tablename__ = "outfit_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    outfit_data = Column(String)  # JSON stringify de la tenue
    caption = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    created_at = Column(DateTime, server_default=func.now())