"""Routes de l'API."""

from .chat import router as chat_router
from .clothing import router as clothing_router

__all__ = ["chat_router", "clothing_router"]
