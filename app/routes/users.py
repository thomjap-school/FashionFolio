"""app/routes/users.py"""

from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", )
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/search", response_model=list[UserResponse])
def search_users(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).filter(
        User.username.ilike(f"%{username}%"),
        User.id != current_user.id
    ).all()
    return users