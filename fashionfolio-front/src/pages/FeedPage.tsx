import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

type FeedPost = {
  id: number;
  user_id: number;
  outfit_data: string;
  caption?: string | null;
  photo_url?: string | null;
  created_at: string;
};

// Social feed page where users can post their outfits and see posts from friends.
export function FeedPage() {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [outfitData, setOutfitData] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFeed() {
    try {
      const res = await api.get<FeedPost[]>("/social/feed", {
        headers: authHeaders()
      });
      setPosts(res.data);
    } catch {
      // ignore for now
    }
  }

  useEffect(() => {
    loadFeed();
  }, []);

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function handleCreatePost(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("outfit_data", outfitData || caption || "My outfit");
      if (caption) form.append("caption", caption);
      if (file) form.append("file", file);

      await api.post("/social/posts", form, {
        headers: {
          ...authHeaders()
        }
      });

      setCaption("");
      setOutfitData("");
      setFile(null);
      await loadFeed();
    } catch {
      setError("Could not create post. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Social Feed</h1>
      <p>Post outfits with a caption and screenshot, and see your friends&apos; looks.</p>

      <form onSubmit={handleCreatePost} className="form">
        <label className="field">
          <span>Outfit description / data</span>
          <textarea
            required
            value={outfitData}
            onChange={(e) => setOutfitData(e.target.value)}
            placeholder="Describe your outfit or paste JSON from the app."
          />
        </label>

        <label className="field">
          <span>Caption (optional)</span>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a short caption"
          />
        </label>

        <label className="field">
          <span>Screenshot / photo (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post outfit"}
        </button>
      </form>

      {posts.length > 0 && (
        <div className="list">
          {posts.map((post) => (
            <article key={post.id} className="card">
              {post.photo_url && (
                <img
                  className="card-image"
                  src={post.photo_url}
                  alt={post.caption || "Outfit photo"}
                />
              )}
              <p className="card-caption">{post.caption || "No caption"}</p>
              <p className="card-meta">
                {new Date(post.created_at).toLocaleString()}
              </p>
              <pre className="card-outfit">
                {post.outfit_data.slice(0, 200)}
                {post.outfit_data.length > 200 ? "..." : ""}
              </pre>
              <button
                type="button"
                className="primary-button"
                style={{ marginTop: "0.75rem" }}
                onClick={() => navigate(`/chat?clonePostId=${post.id}`)}
              >
                Clone this outfit with AI
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
