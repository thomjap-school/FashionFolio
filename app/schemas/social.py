"""app/schemas/social.py"""

from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class FriendshipStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"


# Friendship
class FriendRequestCreate(BaseModel):
    friend_id: int


class FriendRequestResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: FriendshipStatus
    created_at: datetime

    class Config:
        from_attributes = True


# OutfitPost
class OutfitPostCreate(BaseModel):
    outfit_data: str
    caption: str | None = None


class OutfitPostResponse(BaseModel):
    id: int
    user_id: int
    outfit_data: str
    caption: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# Message
class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
