from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: str


class OutfitResponse(BaseModel):
    session_id: str
    message: str
    outfit: dict
    occasion: str
