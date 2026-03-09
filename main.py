from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "FashionFolio API is running 🚀"}
