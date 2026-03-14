"""app/services/trends_service.py"""

from pytrends.request import TrendReq


async def get_fashion_trends() -> dict:
    """Récupère les tendances mode actuelles via Google Trends."""
    try:
        pytrends = TrendReq(hl='fr-FR',
                            tz=60)

        keywords = ["mode 2026",
                    "tendances vestimentaires",
                    "style casual",
                    "outfit"]

        pytrends.build_payload(keywords,
                               cat=185,
                               timeframe='today 1-m',
                               geo='FR')

        interest = pytrends.interest_over_time()
        related = pytrends.related_queries()

        top_queries = []
        for kw in keywords:
            if kw in related and related[kw]['top'] is not None:
                top = related[kw]['top'].head(5)['query'].tolist()
                top_queries.extend(top)

        return {
            "keywords": keywords,
            "top_searches": list(set(top_queries))[:10],
        }
    except Exception as e:
        return {"error": str(e), "keywords": [], "top_searches": []}
