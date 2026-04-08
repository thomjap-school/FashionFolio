from fastapi import FastAPI
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

# Configuration CORS (tu peux garder tes liens actuels, ça ne gêne pas)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # On simplifie pour le test mobile
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Tes routes API existantes
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(social_router)
app.include_router(clothing_router)
app.include_router(chat_router)
app.include_router(health_router)
app.include_router(trends_router)
app.include_router(payments.router)

# --- CONFIGURATION POUR LE FRONTEND (À AJOUTER ICI) ---

# On monte le dossier "static" qui contient ton build React (assets JS/CSS)
# Assure-toi d'avoir créé le dossier "static" à la racine et d'y avoir mis le contenu de ton "dist"
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="static")


@app.get("/")
def root():
    # Si le fichier index.html existe, on le sert, sinon on affiche le message de l'API
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "FashionFolio API is running 🚀 (Frontend non trouvé dans /static)"}


# Gestion du refresh (évite les erreurs 404 quand tu navigues dans l'app React)
@app.exception_handler(404)
async def not_found_exception_handler(request, exc):
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"detail": "Not Found"}
