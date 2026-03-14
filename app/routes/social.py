"""app/routes/social.py"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from typing import Any
import uuid
from pathlib import Path
from app.schemas.user import UserResponse
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.social import Friendship, FriendshipStatus, Message, OutfitPost
from app.models.user import User
from app.schemas.social import (
    FriendRequestCreate,
    FriendRequestResponse,
    MessageCreate,
    MessageResponse,
    OutfitPostCreate,
    OutfitPostResponse
)

router = APIRouter(prefix="/social", tags=["social"])


# ─── FRIENDSHIP ───────────────────────────────────────────

@router.post(
    "/friends/request/{friend_id}",
    response_model=FriendRequestResponse,
    summary="Envoie une demande d'ami",
)
def send_friend_request(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if friend_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot friend yourself")

    cond_a = and_(Friendship.user_id == current_user.id, Friendship.friend_id == friend_id)
    cond_b = and_(Friendship.user_id == friend_id, Friendship.friend_id == current_user.id)
    existing = db.query(Friendship).filter(or_(cond_a, cond_b)).first()

    if existing:
        if existing.status == FriendshipStatus.accepted:
            raise HTTPException(status_code=400, detail="You are already friends")
        else:
            raise HTTPException(status_code=400, detail="Friend request already exists")

    friendship = Friendship(user_id=current_user.id, friend_id=friend_id)
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return friendship


@router.post("/friends/accept/{friend_id}", response_model=FriendRequestResponse)
def accept_friend_request(friend_id: int,
                          db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    friendship = db.query(Friendship).filter(
        Friendship.user_id == friend_id,
        Friendship.friend_id == current_user.id
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Demande d'ami introuvable")
    friendship.status = FriendshipStatus.accepted
    db.commit()
    db.refresh(friendship)
    return friendship


@router.delete("/friends/request/{friend_id}/cancel")
def cancel_friend_request(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Annuler une demande d'ami envoyée."""
    friendship = db.query(Friendship).filter(
        Friendship.user_id == current_user.id,
        Friendship.friend_id == friend_id,
        Friendship.status == FriendshipStatus.pending
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    db.delete(friendship)
    db.commit()
    return {"message": "Friend request cancelled"}


@router.delete("/friends/request/{friend_id}/decline")
def decline_friend_request(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ignorer/refuser une demande d'ami reçue."""
    friendship = db.query(Friendship).filter(
        Friendship.user_id == friend_id,
        Friendship.friend_id == current_user.id,
        Friendship.status == FriendshipStatus.pending
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    db.delete(friendship)
    db.commit()
    return {"message": "Friend request declined"}


@router.get("/friends", response_model=list[UserResponse])
def get_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    friendships = (
        db.query(Friendship)
        .filter(
            or_(
                Friendship.user_id == current_user.id,
                Friendship.friend_id == current_user.id
            ),
            Friendship.status == FriendshipStatus.accepted
        )
        .all()
    )
    friend_ids = [
        f.friend_id if f.user_id == current_user.id else f.user_id
        for f in friendships
    ]
    friends = db.query(User).filter(User.id.in_(friend_ids)).all()
    return friends


@router.get("/friends/pending", response_model=list[FriendRequestResponse])
def get_pending_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pending = db.query(Friendship).filter(
        Friendship.friend_id == current_user.id,
        Friendship.status == FriendshipStatus.pending
    ).all()
    return pending


@router.delete("/friends/{friend_id}")
def remove_friend(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    friendship = (
        db.query(Friendship)
        .filter(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == current_user.id)
            ),
            Friendship.status == FriendshipStatus.accepted
        )
        .first()
    )
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend not found")
    db.delete(friendship)
    db.commit()
    return {"message": f"Friend {friend_id} removed"}


# ─── OUTFIT POSTS ─────────────────────────────────────────

@router.post("/posts", response_model=OutfitPostResponse)
async def create_post(
    outfit_data: str = Form(...),
    caption: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    photo_url = None
    if file:
        upload_dir = Path(f"uploads/posts/{current_user.id}")
        upload_dir.mkdir(parents=True, exist_ok=True)
        unique_prefix = uuid.uuid4().hex[:8]
        filename = f"{unique_prefix}_{file.filename}"
        file_path = upload_dir / filename
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        photo_url = f"/uploads/posts/{current_user.id}/{filename}"

    new_post = OutfitPost(
        user_id=current_user.id,
        outfit_data=outfit_data,
        caption=caption,
        photo_url=photo_url
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.get("/feed", response_model=list[OutfitPostResponse])
def get_feed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    friends = (
        db.query(Friendship)
        .filter(
            or_(
                Friendship.user_id == current_user.id,
                Friendship.friend_id == current_user.id
            ),
            Friendship.status == FriendshipStatus.accepted
        )
        .all()
    )
    friend_ids = list({
        f.friend_id if f.user_id == current_user.id else f.user_id
        for f in friends
    } | {current_user.id})
    posts = (
        db.query(OutfitPost)
        .filter(OutfitPost.user_id.in_(friend_ids))
        .order_by(OutfitPost.created_at.desc())
        .all()
    )
    return posts


@router.delete("/posts/{post_id}")
def delete_post(post_id: int,
                db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    post = db.query(OutfitPost).filter(
        OutfitPost.id == post_id,
        OutfitPost.user_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    db.delete(post)
    db.commit()
    return {"message": "Post supprimé"}


# ─── MESSAGES ─────────────────────────────────────────────

@router.post("/messages/{receiver_id}", response_model=MessageResponse)
def send_message(
    receiver_id: int,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot send a message to yourself.")

    new_message = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        **message.model_dump()
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


@router.get("/messages/{receiver_id}", response_model=list[MessageResponse])
def get_messages(
    receiver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == receiver_id),
                and_(Message.sender_id == receiver_id, Message.receiver_id == current_user.id)
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )
    return messages