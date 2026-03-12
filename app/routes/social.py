from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

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
    tags=["Friends"]
)
def send_friend_request(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Crée une relation d'amitié entre
    l'utilisateur connecté et un autre utilisateur.
    """
    # 1. Vérification de sécurité (ne pas s'ajouter soi-même)
    if friend_id == current_user.id:
        raise HTTPException(status_code=400,
                            detail="You cannot friend yourself")

    # 2. Création de l'entrée
    friendship = Friendship(user_id=current_user.id, friend_id=friend_id)

    db.add(friendship)
    db.commit()
    db.refresh(friendship)

    return friendship


@router.post("/friends/accept/{friend_id}",
             response_model=FriendRequestResponse)
def accept_friend_request(friend_id: int,
                          db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    friendship = db.query(Friendship).filter(
        Friendship.user_id == friend_id,
        Friendship.friend_id == current_user.id
    ).first()
    if not friendship:
        raise HTTPException(status_code=404,
                            detail="Demande d'ami introuvable")
    friendship.status = FriendshipStatus.accepted
    db.commit()
    db.refresh(friendship)
    return friendship


@router.get("/friends", response_model=list[FriendRequestResponse])
def get_friends(db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    friends = db.query(Friendship).filter(
        Friendship.user_id == current_user.id,
        Friendship.status == FriendshipStatus.accepted
    ).all()
    return friends


# ─── OUTFIT POSTS ─────────────────────────────────────────

@router.post("/posts", response_model=OutfitPostResponse)
def create_post(post: OutfitPostCreate,
                db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    new_post = OutfitPost(user_id=current_user.id, **post.model_dump())
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.get("/feed", response_model=list[OutfitPostResponse])
def get_feed(db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    friends = db.query(Friendship).filter(
        Friendship.user_id == current_user.id,
        Friendship.status == FriendshipStatus.accepted
    ).all()
    friend_ids = [f.friend_id for f in friends]
    posts = db.query(OutfitPost).filter(
        OutfitPost.user_id.in_(friend_ids)
    ).order_by(OutfitPost.created_at.desc()).all()
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
    # Sécurité : Empêcher l'envoi à soi-même
    if receiver_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot send a message to yourself."
        )

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
    # On définit les conditions dans des variables ou on aligne proprement
    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(Message.sender_id == current_user.id,
                     Message.receiver_id == receiver_id),
                and_(Message.sender_id == receiver_id,
                     Message.receiver_id == current_user.id)
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )
    return messages
