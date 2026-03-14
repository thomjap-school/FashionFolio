"""app/schemas/chat.py -- Schémas pour les requêtes/réponses du chat."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Requête de chat pour générer une tenue."""

    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    """Réponse du chat avec la tenue générée."""

    session_id: str
    message: str
    outfit: dict
    occasion: str
