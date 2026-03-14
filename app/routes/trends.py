"""app/routes/trends.py"""

from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.trends_service import get_fashion_trends

router = APIRouter(prefix="/external", tags=["external"])


@router.get("/trends")
async def get_trends(current_user: User = Depends(get_current_user)):
    return await get_fashion_trends()
