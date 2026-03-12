from fastapi import FastAPI
from app.database import engine, Base
from app.routes.chat import router as chat_router

# Crée les tables au démarrage (remplacer par Alembic en prod)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FashionFolio API",
    description="Backend IA pour la génération de tenues personnalisées.",
    version="1.0.0",
)

app.include_router(chat_router)


@app.get("/health")
def health():
    return {"status": "ok"}
