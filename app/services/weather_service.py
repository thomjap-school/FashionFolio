"""app/services/weather_services.py"""

import os
import httpx

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")


async def get_weather(city: str = "Paris") -> dict:
    """Récupère la météo actuelle pour une ville."""
    url = f"https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": WEATHER_API_KEY,
        "units": "metric",
        "lang": "fr"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()

    return {
        "city": city,
        "temperature": data["main"]["temp"],
        "description": data["weather"][0]["description"],
        "humidity": data["main"]["humidity"],
    }
