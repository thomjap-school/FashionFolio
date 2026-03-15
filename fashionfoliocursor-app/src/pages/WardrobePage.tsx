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
};

export function WardrobePage() {
  const [name, setName] = useState("");
  const [typeValue, setTypeValue] = useState("");
  const [color, setColor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      form.append("name", name);
      form.append("type", typeValue);
      form.append("color", color);
      await api.post("/clothing/upload", form, {
        headers: {
          ...authHeaders()
        }
      });

      setName("");
      setTypeValue("");
      setColor("");
      setFile(null);
      await loadWardrobe();
    } catch {
      setError("Could not add clothing item. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Your Wardrobe</h1>
      <p>Add simple clothing items to your digital closet.</p>

      <form onSubmit={handleAdd} className="form">
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Black hoodie"
          />
        </label>

        <label className="field">
          <span>Type</span>
          <input
            type="text"
            required
            value={typeValue}
            onChange={(e) => setTypeValue(e.target.value)}
            placeholder="top, pants, shoes..."
          />
        </label>

        <label className="field">
          <span>Color</span>
          <input
            type="text"
            required
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="black, white, blue..."
          />
        </label>

        <label className="field">
          <span>Photo (optional)</span>
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
            <article key={item.id} className="card">
              <p className="card-caption">
                {item.name} · {item.type} · {item.color}
              </p>
              {item.brand && <p className="card-meta">{item.brand}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
