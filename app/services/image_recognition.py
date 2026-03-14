"""app/services/image_recognition.py"""

import os
import base64
import json
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


async def recognize_clothing(image_path: str) -> dict:
    """
    Analyse une image de vêtement via Gemini Vision
    et retourne ses attributs détectés.
    """
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    prompt = """
Tu es un expert en mode. Analyse cette image de
    vêtement et retourne UNIQUEMENT un JSON avec ces champs :
{
  "name": "nom court et descriptif du vêtement",
  "type": "top | bottom | shoes | outerwear | dress | accessory | other",
  "color": "couleur principale en français",
  "style": "casual | formal | sportswear | elegant | streetwear | other",
  "pattern": "plain | striped | floral | checkered | graphic | other",
  "brand": "marque si visible sinon null",
  "description": "description courte en français"
}
Réponds UNIQUEMENT en JSON, rien d'autre.
"""

    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL"),
        contents=[
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": image_data
                        }
                    }
                ]
            }
        ]
    )

    raw = response.text.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)
