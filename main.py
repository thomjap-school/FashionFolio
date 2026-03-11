from fastapi import FastAPI
from database import Base, engine
import models.user
import models.social
from routes.social import router as social_router

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(social_router)

@app.get("/")
def root():
    return {"message": "FashionFolio API is running 🚀"}