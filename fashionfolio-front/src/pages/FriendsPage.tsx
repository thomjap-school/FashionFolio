import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  id: number;
  username: string;
  email: string;
};

// Friends page where users can search for other users, see their profile info, and manage friend requests
export function FriendsPage() {
  const [me, setMe] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
   const [pending, setPending] = useState<
    { id: number; user_id: number; friend_id: number; status: string }[]
  >([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    loadMe();
    loadFriends();
    loadPending();
  }, []);

  async function loadMe() {
    try {
      const res = await api.get("/users/me", { headers: authHeaders() });
      setMe(res.data);
    } catch {
      setMe(null);
    }
  }

  async function loadFriends() {
    try {
      const res = await api.get("/social/friends", { headers: authHeaders() });
      setFriends(res.data);
    } catch {
      setFriends([]);
    }
  }

  async function loadPending() {
    try {
      const res = await api.get("/social/friends/pending", {
        headers: authHeaders()
      });
      setPending(res.data);
    } catch {
      setPending([]);
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.get("/users/search", {
        params: { username: query },
        headers: authHeaders()
      });
      setResults(res.data);
    } catch {
      setError("Search failed. Are you logged in?");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend(userId: number) {
    setError(null);
    try {
      await api.post(`/social/friends/request/${userId}`, null, {
        headers: authHeaders()
      });
      await loadFriends();
      await loadPending();
    } catch {
      setError("Could not send friend request.");
    }
  }

  async function handleAccept(friendId: number) {
    setError(null);
    try {
      await api.post(`/social/friends/accept/${friendId}`, null, {
        headers: authHeaders()
      });
      await loadFriends();
      await loadPending();
    } catch {
      setError("Could not accept friend request.");
    }
  }

  async function handleDecline(friendId: number) {
    setError(null);
    try {
      await api.delete(`/social/friends/request/${friendId}/decline`, {
        headers: authHeaders()
      });
      await loadPending();
    } catch {
      setError("Could not decline friend request.");
    }
  }

  return (
    <section>
      <h1>Friends & Users</h1>
      <p>Search users by username, see your profile, and manage friends.</p>

      {me && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <p className="card-caption">
            You are <strong>@{me.username}</strong> (#{me.id})
          </p>
          <p className="card-meta">{me.email}</p>
        </div>
      )}

      <form onSubmit={handleSearch} className="form">
        <label className="field">
          <span>Search users by username</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a username..."
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {results.length > 0 && (
        <div className="list" style={{ marginTop: "1.5rem" }}>
          {results.map((user) => (
            <article key={user.id} className="card">
              <p className="card-caption">
                @{user.username} (#{user.id})
              </p>
              <p className="card-meta">{user.email}</p>
              <button
                className="primary-button"
                type="button"
                onClick={() => handleAddFriend(user.id)}
              >
                Add friend
              </button>
            </article>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="list" style={{ marginTop: "2rem" }}>
          <h2>Pending friend requests</h2>
          {pending.map((req) => (
            <article key={req.id} className="card">
              <p className="card-caption">
                Request from user #{req.user_id} to you (status: {req.status})
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleAccept(req.user_id)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => handleDecline(req.user_id)}
                >
                  Ignore
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {friends.length > 0 && (
        <div className="list" style={{ marginTop: "2rem" }}>
          <h2>Your friends</h2>
          {friends.map((user) => (
            <article key={user.id} className="card">
              <p className="card-caption">
                @{user.username} (#{user.id})
              </p>
              <p className="card-meta">{user.email}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

