# Groupe de massal_j 1071814
# FashionFolio — Backend

Petit backend Flask pour le projet FashionFolio (gestion de vêtements, tenues et chat/assistant).

**Principales fonctionnalités**
- Gestion des utilisateurs, vêtements et tenues
- API REST pour CRUD vêtements / tenues
- Intégration d'un service LLM pour chat (app/services/llm_service.py)
- Service de suppression d'arrière-plan d'image (app/services/remove_bg_service.py)
- Stockage des images dans `uploads/`

**Prérequis**
- Python 3.10+ (ou 3.9 suivant l'environnement)
- Voir les dépendances : [fashionfolio-backend/requirements.txt](fashionfolio-backend/requirements.txt)

**Installation rapide**
1. Créez un environnement virtuel et activez-le :

```bash
python -m venv .venv
source .venv/bin/activate
```
2. Installez les dépendances :

```bash
pip install -r requirements.txt
```

**Configuration**
- Variables d'environnement utiles : `FLASK_APP`, `FLASK_ENV`, `DATABASE_URL` (selon `app/database.py`).
- Exemple (macOS/Linux) :

```bash
export FLASK_APP=app.main
export FLASK_ENV=development
```

**Démarrer l'application**
1. Lancer Flask (depuis le dossier `fashionfolio-backend`) :

```bash
cd fashionfolio-backend
flask run
```

2. Endpoints principaux : voir `fashionfolio-backend/app/routes/` pour la liste des routes (chat, clothing, ...).

**Initialiser les données**
- Un script de seed est fourni :

```bash
python seed.py
```
or
```bash
uvicorn app.main:app --reload
```
**Structure du projet (essentiel)**
- `app/` : application Flask
- `app/models/` : modèles (user, clothing, outfit)
- `app/routes/` : routes API (chat.py, clothing.py, ...)
- `app/schemas/` : schémas/serializers
- `app/services/` : intégrations externes (LLM, suppression BG)
- `uploads/` : stockage des images utilisateur

**Tests & qualité**
- Aucun framework de test inclus par défaut. Ajouter `pytest` si nécessaire et écrire des tests dans un dossier `tests/`.

**Contribution**
- Forkez, créez une branche feature, ouvrez une MR. Respectez PEP8 et ajoutez des tests pour les fonctionnalités critiques.

**Licence**
- Indiquer la licence souhaitée (MIT/Apache/etc.). Par défaut, pas de licence précisée.

**Contact / Aide**
- Pour toute question, ouvrir une issue dans ce dépôt ou contacter l'équipe projet.

---

Fichier mis à jour : [tr/README.md](tr/README.md)