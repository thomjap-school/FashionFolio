# FashionFolio — API Backend

API IA pour générer et gérer des tenues personnalisées.

## Installation

```bash
cd fashionfolio-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Configuration

Créer un fichier `.env` :
```env
DATABASE_URL=postgresql://user:password@localhost:5432/fashionfolio
GOOGLE_API_KEY=votre_clé_api
SECRET_KEY=votre_clé_secrète
```

## Démarrage

```bash
python seed.py
uvicorn app.main:app --reload
```

API disponible sur `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Endpoints

- `GET /clothing` - Lister les vêtements
- `POST /clothing` - Créer un vêtement
- `POST /chat` - Envoyer un message
- `GET /chat/history` - Historique

## Stack

FastAPI, SQLAlchemy, PostgreSQL, Google GenAI
