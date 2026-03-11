from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.social import Friendship, FriendshipStatus, OutfitPost, Message
from schemas.social import (
    FriendRequestCreate, FriendRequestResponse,
    OutfitPostCreate, OutfitPostResponse,
    MessageCreate, MessageResponse
)

router = APIRouter(prefix="/social", tags=["social"])


# ─── FRIENDSHIP ───────────────────────────────────────────

@router.post("/friends/request/{friend_id}", response_model=FriendRequestResponse)
def send_friend_request(friend_id: int, db: Session = Depends(get_db)):
    # TODO: remplacer 1 par l'id de l'utilisateur connecté quand le JWT sera dispo
    friendship = Friendship(user_id=1, friend_id=friend_id)
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return friendship


@router.post("/friends/accept/{friend_id}", response_model=FriendRequestResponse)
def accept_friend_request(friend_id: int, db: Session = Depends(get_db)):
    friendship = db.query(Friendship).filter(
        Friendship.user_id == friend_id,
        Friendship.friend_id == 1
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Demande d'ami introuvable")
    friendship.status = FriendshipStatus.accepted
    db.commit()
    db.refresh(friendship)
    return friendship


@router.get("/friends", response_model=list[FriendRequestResponse])
def get_friends(db: Session = Depends(get_db)):
    friends = db.query(Friendship).filter(
        Friendship.user_id == 1,
        Friendship.status == FriendshipStatus.accepted
    ).all()
    return friends


# ─── OUTFIT POSTS ─────────────────────────────────────────

@router.post("/posts", response_model=OutfitPostResponse)
def create_post(post: OutfitPostCreate, db: Session = Depends(get_db)):
    new_post = OutfitPost(user_id=1, **post.model_dump())
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.get("/feed", response_model=list[OutfitPostResponse])
def get_feed(db: Session = Depends(get_db)):
    friends = db.query(Friendship).filter(
        Friendship.user_id == 1,
        Friendship.status == FriendshipStatus.accepted
    ).all()
    friend_ids = [f.friend_id for f in friends]
    posts = db.query(OutfitPost).filter(
        OutfitPost.user_id.in_(friend_ids)
    ).order_by(OutfitPost.created_at.desc()).all()
    return posts


@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(OutfitPost).filter(
        OutfitPost.id == post_id,
        OutfitPost.user_id == 1
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    db.delete(post)
    db.commit()
    return {"message": "Post supprimé"}


# ─── MESSAGES ─────────────────────────────────────────────

@router.post("/messages/{receiver_id}", response_model=MessageResponse)
def send_message(receiver_id: int, message: MessageCreate, db: Session = Depends(get_db)):
    new_message = Message(sender_id=1, receiver_id=receiver_id, **message.model_dump())
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


@router.get("/messages/{receiver_id}", response_model=list[MessageResponse])
def get_messages(receiver_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        ((Message.sender_id == 1) & (Message.receiver_id == receiver_id)) |
        ((Message.sender_id == receiver_id) & (Message.receiver_id == 1))
    ).order_by(Message.created_at.asc()).all()
    return messages