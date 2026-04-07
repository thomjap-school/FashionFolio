from fastapi import FastAPI
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
import os


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
from app.routes.trends import router as trends_router
from app.routes import payments

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FashionFolio API",
    version="0.1.0",
)

# Allow browser frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv("EXPO_PUBLIC_API_URL"),
        "http://localhost:8000",
        os.getenv("NGROK"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(social_router)
app.include_router(clothing_router)
app.include_router(chat_router)
app.include_router(health_router)
app.include_router(trends_router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {"message": "FashionFolio API is running 🚀"}
