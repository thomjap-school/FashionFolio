import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.clothing import Clothing


"""
seed.py — Insère des vêtements de test en base pour user_id = 1
Lancer : python seed.py
"""


load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL",
                         "postgresql://user:password@localhost/fashionfolio")
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)
db = Session()

# Vêtements de test pour user_id = 1
vetements = [
    Clothing(user_id=1, name="T-shirt blanc",
             type="top",       color="blanc",  style="casual"),
    Clothing(user_id=1, name="T-shirt noir",
             type="top",       color="noir",   style="casual"),
    Clothing(user_id=1, name="Chemise bleue",
             type="top",       color="bleu",   style="formal"),
    Clothing(user_id=1, name="Jean slim bleu",
             type="bottom",    color="bleu",   style="casual"),
    Clothing(user_id=1, name="Chino beige",
             type="bottom",    color="beige",  style="casual"),
    Clothing(user_id=1, name="Pantalon noir",
             type="bottom",    color="noir",   style="formal"),
    Clothing(user_id=1, name="Baskets blanches",
             type="shoes",     color="blanc",  style="casual"),
    Clothing(user_id=1, name="Derby noires",
             type="shoes",     color="noir",   style="formal"),
    Clothing(user_id=1, name="Veste noire",
             type="outerwear", color="noir",   style="casual"),
    Clothing(user_id=1, name="Manteau gris",
             type="outerwear", color="gris",   style="formal"),
]

db.add_all(vetements)
db.commit()
db.close()

print(f"{len(vetements)} vêtements insérés pour user_id = 1 !")
