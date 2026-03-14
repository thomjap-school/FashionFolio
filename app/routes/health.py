"""app/routes/health.py -- Endpoint pour check les stats de l'API"""

from fastapi import APIRouter
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    return {
        "status": "ok",
        "database": db_status
    }
