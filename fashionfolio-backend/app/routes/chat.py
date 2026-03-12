import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.clothing import Clothing
from app.auth import get_current_user_id
from app.services.llm_service import generate_outfit, clear_history


"""
app/routes/chat.py

Endpoint POST /chat
"""


router = APIRouter(prefix="/chat", tags=["chat"])


# ─── Schémas ─────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None  # None = nouvelle session


class ChatResponse(BaseModel):
    session_id: str
    message: str
    outfit: dict
    occasion: str


# ─── Helper ───────────────────────────────────────

def _format_wardrobe(items: list[Clothing]) -> list[dict]:
    return [
        {
            "id":      item.id,
            "name":    item.name,
            "type":    item.type,
            "color":   item.color,
            "style":   item.style,
            "pattern": item.pattern,
            "brand":   item.brand,
        }
        for item in items
    ]


# ─── Routes ─────────────────────────────────────

@router.post("/", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Génère une tenue à partir du dressing et de la demande de l'utilisateur.
    Si session_id est absent → nouvelle session (historique vierge).
    Si session_id est fourni → continue la session (évite les répétitions).
    """
    session_id = body.session_id or str(uuid.uuid4())

    # Récupérer le dressing
    wardrobe_items = (
        db.query(Clothing).filter(Clothing.user_id == user_id).all()
    )

    if not wardrobe_items:
        raise HTTPException(
            status_code=400,
            detail="Ton dressing est vide. "
            "Ajoute des vêtements avant de générer une tenue.",
        )

    wardrobe = _format_wardrobe(wardrobe_items)

    # Appeler le LLM
    try:
        result = await generate_outfit(
            user_message=body.message,
            wardrobe=wardrobe,
            session_id=session_id,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return ChatResponse(
        session_id=session_id,
        message=result.get("message", ""),
        outfit=result.get("outfit", {}),
        occasion=result.get("occasion", "autre"),
    )


@router.delete("/{session_id}", status_code=204)
def reset_session(
    session_id: str,
    user_id: int = Depends(get_current_user_id),
):
    """Réinitialise l'historique d'une session (nouveau chat)."""
    clear_history(session_id)
