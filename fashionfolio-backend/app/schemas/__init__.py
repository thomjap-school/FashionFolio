"""Schémas Pydantic pour les requêtes et réponses API."""

from .chat import ChatRequest, ChatResponse
from .clothing import ClothingCreate, ClothingResponse, ClothingUpdate

__all__ = [
    "ChatRequest",
    "ChatResponse",
    "ClothingCreate",
    "ClothingResponse",
    "ClothingUpdate",
]