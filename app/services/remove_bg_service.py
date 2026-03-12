"""Service pour intégration avec l'API remove.bg."""

import os
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

REMOVE_BG_API_KEY = os.getenv("REMOVE_BG_API_KEY")
REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg"


async def remove_background(image_path: str) -> bytes:
    """Supprime le fond d'une image locale via remove.bg API."""
    if not REMOVE_BG_API_KEY:
        raise RuntimeError("REMOVE_BG_API_KEY non configurée.")

    try:
        with open(image_path, "rb") as f:
            response = requests.post(
                REMOVE_BG_API_URL,
                files={"image_file": f},  # ← fichier binaire, pas une URL
                headers={"X-Api-Key": REMOVE_BG_API_KEY},
            )
        response.raise_for_status()
        return response.content  # PNG bytes

    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Erreur remove.bg: {str(e)}")


async def process_clothing_image(
    image_path: str,
    user_id: int
) -> tuple[str, str]:
    """Sauvegarde l'original et génère la version sans fond."""
# URLs pour la DB
    filename = Path(image_path).name
    original_url = f"/uploads/clothing/{user_id}/{filename}"
    no_bg_filename = f"no-bg-{Path(filename).stem}.png"
    no_bg_url = f"/uploads/clothing/{user_id}/{no_bg_filename}"

    # Appel remove.bg + sauvegarde
    img_bytes = await remove_background(image_path)
    no_bg_path = Path(image_path).parent / no_bg_filename
    with open(no_bg_path, "wb") as f:
        f.write(img_bytes)

    return original_url, no_bg_url
