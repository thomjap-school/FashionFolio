"""app/schemas/clothing.py -- Schémas Pydantic pour les vêtements."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class ClothingCreate(BaseModel):
    """Schéma pour créer un vêtement."""

    name: str
    type: str
    color: str
    style: Optional[str] = None
    pattern: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class ClothingUpdate(BaseModel):
    """Schéma pour mise à jour partielle d'un vêtement."""

    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    style: Optional[str] = None
    pattern: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

    @field_validator(
            'name',
            'type',
            'color',
            'style',
            'pattern',
            'brand',
            'description',
            'image_url',
            mode='before'
        )
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "string" or v == "":
            return None
        return v


class ClothingResponse(BaseModel):
    """Schéma pour répondre avec les détails d'un vêtement."""

    id: int
    user_id: int
    name: str
    type: str
    color: str
    style: Optional[str] = None
    pattern: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_bg_removed_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
