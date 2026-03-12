from google import genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def build_prompt(wardrobe: list, history: list, user_message: str) -> str:
    
    wardrobe_text = json.dumps(wardrobe, ensure_ascii=False, indent=2)
    history_text = json.dumps(history, ensure_ascii=False) if history else "Aucune tenue suggérée pour le moment."

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

def generate_outfit(wardrobe: list, history: list, user_message: str):
    
    prompt = build_prompt(wardrobe, history, user_message)
    
    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL"),
        contents=prompt
    )

    raw = response.text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    
    outfit = json.loads(raw)
    return outfit