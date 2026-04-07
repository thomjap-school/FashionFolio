import { useEffect, useState } from "react";
import { api } from "../services/api";

type Trend = {
  title?: string;
  description?: string;
};
// Explore page that fetches and displays fashion trends from the backend service
export function ExplorePage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [error, setError] = useState<string | null>(null);

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/external/trends", {
          headers: authHeaders()
        });
        const data = res.data;
        setTrends(Array.isArray(data) ? data : []);
      } catch {
        setError("Could not load trends. Are you logged in?");
      }
    }
    load();
  }, []);

  return (
    <section>
      <h1>Explore Trends</h1>
      <p>Live fashion trends fetched from your backend service.</p>

      {error && <p className="form-error">{error}</p>}

      {trends.length > 0 && (
        <div className="list">
          {trends.map((t, idx) => (
            <article key={idx} className="card">
              <p className="card-caption">{t.title || `Trend #${idx + 1}`}</p>
              {t.description && (
                <p className="card-meta">{t.description}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
