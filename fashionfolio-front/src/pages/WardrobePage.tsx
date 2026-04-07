import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";

type ClothingItem = {
  id: number;
  name: string;
  type: string;
  color: string;
  style?: string | null;
  brand?: string | null;
  image_url?: string | null;
  image_bg_removed_url?: string | null;
  is_favorite?: boolean;
};

export function WardrobePage() {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get auth headers with token from localStorage
  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function loadWardrobe() {
    try {
      const res = await api.get<ClothingItem[]>("/clothing/", {
        headers: authHeaders()
      });
      setItems(res.data);
    } catch {
      // ignore for now
    }
  }

  useEffect(() => {
    loadWardrobe();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!file) {
        setError("Please select a picture of your clothing item.");
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append("file", file);
      await api.post("/clothing/upload", form, {
        headers: {
          ...authHeaders()
        }
      });

      setFile(null);
      await loadWardrobe();
    } catch {
      setError("Could not add clothing item. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFavorite(id: number) {
    setError(null);
    try {
      const res = await api.patch<ClothingItem>(
        `/clothing/${id}/favorite`,
        null,
        { headers: authHeaders() }
      );
      setItems((prev) =>
        prev.map((item) => (item.id === id ? res.data : item))
      );
    } catch {
      setError("Could not toggle favorite.");
    }
  }

  return (
    <section>
      <h1>Your Wardrobe</h1>
      <p>Upload a clothing photo and let the AI fill in the details.</p>

      <form onSubmit={handleAdd} className="form">
        <label className="field">
          <span>Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add to wardrobe"}
        </button>
      </form>

      {items.length > 0 && (
        <div className="list">
          {items.map((item) => (
            <article key={item.id} className="card card-row">
              {item.image_bg_removed_url && (
                <img
                  src={item.image_bg_removed_url}
                  alt={item.name}
                  className="card-thumb"
                />
              )}
              <div className="card-info">
                <p className="card-caption">
                  {item.name} · {item.type} · {item.color}
                </p>
                {item.brand && <p className="card-meta">{item.brand}</p>}
              </div>
              <button
                type="button"
                className={`favorite-button${
                  item.is_favorite ? " favorite-button-active" : ""
                }`}
                onClick={() => handleToggleFavorite(item.id)}
                aria-label="Toggle favorite"
              >
                ★
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
