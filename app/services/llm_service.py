import json
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Stockage en mémoire des historiques de session
_session_history: dict = {}

def clear_history(session_id: str):
    """Réinitialise l'historique d'une session."""
    _session_history.pop(session_id, None)


def build_prompt(wardrobe: list, history: list, user_message: str) -> str:
    """Construire le prompt pour le LLM avec le dressing et l'historique."""
    wardrobe_text = json.dumps(wardrobe, ensure_ascii=False, indent=2)
    history_text = (
        json.dumps(history, ensure_ascii=False)
        if history
        else "Aucune tenue suggérée pour le moment."
    )

    return f"""
Tu es un assistant mode pour l'application FashionFolio.

RÈGLES STRICTES :
- Tu génères UNIQUEMENT des tenues à partir des vêtements fournis ci-dessous
- Tu réponds TOUJOURS en JSON et rien d'autre
- Tu ne réponds PAS aux questions hors mode
- Tu n'inventes AUCUN vêtement inexistant dans le dressing
- Tu évites de répéter les tenues déjà suggérées

DRESSING DE L'UTILISATEUR :
{wardrobe_text}

TENUES DÉJÀ SUGGÉRÉES (à éviter) :
{history_text}

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{{
  "haut": {{"id": 1, "nom": "T-shirt blanc", "marque": "Zara"}},
  "bas": {{"id": 2, "nom": "Jean bleu", "marque": "Levi's"}},
  "chaussures": {{"id": 3, "nom": "Baskets blanches", "marque": "Nike"}},
  "accessoire": null,
  "description": "Tenue casual parfaite pour la journée"
}}

Demande utilisateur : {user_message}
"""


async def generate_outfit(
    user_message: str,
    wardrobe: list,
    session_id: str,
) -> dict:
    """Générer une tenue avec le LLM Gemini."""
    history = _session_history.get(session_id, [])
    prompt = build_prompt(wardrobe, history, user_message)

    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL"),
        contents=prompt
    )

    raw = response.text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    outfit = json.loads(raw)
    _session_history[session_id] = history + [outfit]

    return {
        "message": (
            f"Voici une tenue parfaite pour vous: "
            f"{outfit.get('description', '')}"
        ),
        "outfit": outfit,
        "occasion": "casual",
    }
