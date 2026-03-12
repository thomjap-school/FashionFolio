"""
app/services/llm_service.py
"""

import json
import re
import httpx
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.5-flash"
base_url = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_URL = f"{base_url}/models/{GEMINI_MODEL}:generateContent"

_session_history: dict[str, list[dict]] = {}

SYSTEM_PROMPT = """
Tu es un assistant styliste
    personnel pour l'application FashionFolio.

RÈGLES STRICTES :
- Tu génères UNIQUEMENT des tenues à partir
    des vêtements fournis par l'utilisateur.
- Tu ne proposes JAMAIS de vêtements qui n'existent pas dans son dressing.
- Tu ne réponds PAS aux questions hors du domaine de la mode et du style.
- Tu évites de répéter des tenues déjà proposées dans cette session.

FORMAT DE RÉPONSE :
Réponds UNIQUEMENT avec un objet JSON valide,
    sans texte autour, sans balises markdown :
{
  "message": "Un court message stylé (1-2 phrases)",
  "outfit": {
    "top":       { "id": 1, "name": "nom", "color": "couleur" },
    "bottom":    { "id": 2, "name": "nom", "color": "couleur" },
    "shoes":     { "id": 3, "name": "nom", "color": "couleur" },
    "outerwear": { "id": 4, "name": "nom", "color": "couleur" },
    "accessory": null
  },
  "occasion": "casual"
}
Les champs outerwear et accessory sont optionnels (null si non pertinent).
"""


def manage_history(session_id: str,
                   new_outfit: Optional[dict] = None) -> list[dict]:
    if session_id not in _session_history:
        _session_history[session_id] = []
    if new_outfit is not None:
        _session_history[session_id].append(new_outfit)
        _session_history[session_id] = _session_history[session_id][-10:]
    return _session_history[session_id]


def clear_history(session_id: str) -> None:
    _session_history.pop(session_id, None)


def _build_prompt(user_message: str,
                  wardrobe: list[dict], history: list[dict]) -> str:
    wardrobe_str = json.dumps(wardrobe, ensure_ascii=False, indent=2)
    history_str = ""
    if history:
        history_str = (
            "\n\nTENUES DÉJÀ PROPOSÉES (à ne pas répéter) :\n"
            + json.dumps(history, ensure_ascii=False, indent=2)
        )
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Demande : {user_message}\n\n"
        f"DRESSING DISPONIBLE :\n{wardrobe_str}"
        f"{history_str}"
    )


async def generate_outfit(user_message: str,
                          wardrobe: list[dict], session_id: str) -> dict:
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY non configurée dans le fichier .env"
        )
    history = manage_history(session_id)
    prompt = _build_prompt(user_message, wardrobe, history)

    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            GEMINI_URL,
            headers={"Content-Type": "application/json"},
            params={"key": GEMINI_API_KEY},
            json=payload,
        )

    if resp.status_code != 200:
        raise RuntimeError(
            f"Erreur API Gemini {resp.status_code}: {resp.text}"
            )

    raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    # Nettoyer les éventuelles balises markdown ```json ... ```
    raw_text = re.sub(r"```json|```", "", raw_text).strip()

    try:
        result = json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if match:
            result = json.loads(match.group())
        else:
            raise RuntimeError(f"Réponse non parseable : {raw_text}")

    if "outfit" in result:
        manage_history(session_id, result["outfit"])

    return result
