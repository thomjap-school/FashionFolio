"""
app/auth.py

Middleware d'authentification JWT.
À connecter avec le module Auth de la Personne 1.
"""

import os
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change_me_in_production")

# auto_error=False → ne bloque plus si le token est absent (mode MVP)
bearer = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> int:
    """
    Stub MVP : retourne toujours user_id = 1 sans vérifier le token.

    TODO (Personne 1) : remplacer par la vraie validation JWT :
        from jose import jwt, JWTError
        try:
            payload = jwt.decode(credentials.credentials,
                                 SECRET_KEY, algorithms=["HS256"])
            return int(payload["sub"])
        except JWTError:
            raise HTTPException(status_code=401, detail="Token invalide.")
    """
    return 1
