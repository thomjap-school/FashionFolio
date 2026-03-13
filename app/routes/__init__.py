"""
This package contains all the endpoints (routes) for the FastAPI application.

- auth.py: endpoints for authentication (register, login) with JWT.
- chat.py: endpoints for generating outfits using AI.
- clothing.py: endpoints for managing the user's wardrobe
  (CRUD for clothing and image uploads).
- social.py: endpoints for managing friends, outfit posts, and messages.
- users.py: endpoints for retrieving information about the logged-in user
  (e.g., /me).

Each file uses FastAPI APIRouter to organize routes
and SQLAlchemy to access the database.
"""
