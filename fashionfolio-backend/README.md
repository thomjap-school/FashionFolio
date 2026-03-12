# FashionFolio — Backend POC

## Stack
- Python + FastAPI
- SQLAlchemy (ORM)
- LLM via API externe

## Lancer le projet
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Structure
- `models/` → modèles BDD
- `routes/` → endpoints API
- `services/` → logique métier (LLM)
- `schemas/` → validation des données
