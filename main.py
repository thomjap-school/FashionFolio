from fastapi import FastAPI
from fastapi.security import HTTPBearer
from app.core.database import Base, engine
import app.models.user
import app.models.social
import app.models.clothing
import app.models.outfit
from app.routes.social import router as social_router
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.clothing import router as clothing_router
from app.routes.chat import router as chat_router
from app.routes.health import router as health_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FashionFolio API",
    version="0.1.0",
)

security = HTTPBearer()

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(social_router)
app.include_router(clothing_router)
app.include_router(chat_router)
app.include_router(health_router)

@app.get("/")
def root():
    return {"message": "FashionFolio API is running 🚀"}