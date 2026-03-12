"""Service pour intégration avec l'API remove.bg."""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

REMOVE_BG_API_KEY = os.getenv("REMOVE_BG_API_KEY")
REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg"


async def remove_background(image_url: str) -> str:
    """
    Supprime le fond d'une image via remove.bg API.

    Args:
        image_url: URL de l'image originale

    Returns:
        URL de l'image avec fond transparent

    Raises:
        RuntimeError: Si l'API remove.bg échoue
    """
    if not REMOVE_BG_API_KEY:
        raise RuntimeError(
            "REMOVE_BG_API_KEY non configurée. "
            "Ajoute-la à ton .env"
        )

    try:
        response = requests.post(
            REMOVE_BG_API_URL,
            files={"image_url": (None, image_url)},
            headers={"X-API-Key": REMOVE_BG_API_KEY},
        )
        response.raise_for_status()

        # Retourner l'image PNG avec fond transparent
        # Note: En prod, tu voudrais probablement sauvegarder l'image
        # sur un stockage (S3, etc.) au lieu de la retourner
        return response.content

    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Erreur remove.bg: {str(e)}")


async def process_clothing_image(
    image_url: str,
    user_id: int,
) -> tuple[str, str]:
    """
    Traite une image de vêtement: sauvegarde l'original et génère la version sans fond.

    Args:
        image_url: URL de l'image originale
        user_id: ID de l'utilisateur

    Returns:
        Tuple (original_url, bg_removed_url)
    """
    original_url = image_url

    # TODO: Appeler Remove.bg et sauvegarder le résultat
    # img_no_bg = await remove_background(image_url)
    # bg_removed_url = save_image_to_storage(img_no_bg, user_id)

    bg_removed_url = image_url  # Placeholder

    return original_url, bg_removed_url
