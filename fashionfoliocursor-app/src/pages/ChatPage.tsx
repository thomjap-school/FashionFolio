import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export function ChatPage() {
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("Paris");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<{ id: number; username: string }[]>(
    []
  );
  const [newFriendId, setNewFriendId] = useState("");
  const [dmTargetId, setDmTargetId] = useState<number | null>(null);
  const [dmContent, setDmContent] = useState("");
  const [dmMessages, setDmMessages] = useState<
    { id: number; sender_id: number; content: string }[]
  >([]);
  const [me, setMe] = useState<{ id: number; username: string } | null>(null);

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    loadMe();
    loadFriends();
  }, []);

  async function loadMe() {
    try {
      const res = await api.get("/users/me", {
        headers: authHeaders()
      });
      setMe({ id: res.data.id, username: res.data.username });
    } catch {
      setMe(null);
    }
  }

  async function loadFriends() {
    try {
      const res = await api.get("/social/friends", {
        headers: authHeaders()
      });
      setFriends(res.data);
    } catch {
      // ignore for now
    }
  }

  async function handleAddFriend(e: FormEvent) {
    e.preventDefault();
    if (!newFriendId.trim()) return;
    setError(null);
    try {
      await api.post(`/social/friends/request/${Number(newFriendId)}`, null, {
        headers: authHeaders()
      });
      setNewFriendId("");
    } catch {
      setError("Could not send friend request. Check the user id.");
    }
  }

  async function loadDmMessages(receiverId: number) {
    try {
      const res = await api.get(`/social/messages/${receiverId}`, {
        headers: authHeaders()
      });
      setDmMessages(res.data);
    } catch {
      setDmMessages([]);
    }
  }

  async function handleSendDm(e: FormEvent) {
    e.preventDefault();
    if (!dmTargetId || !dmContent.trim()) return;
    setError(null);
    try {
      await api.post(
        `/social/messages/${dmTargetId}`,
        { content: dmContent },
        { headers: authHeaders() }
      );
      setDmContent("");
      await loadDmMessages(dmTargetId);
    } catch {
      setError("Could not send message.");
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg: ChatMessage = { role: "user", text: message };
    setHistory((h) => [...h, userMsg]);
    const currentMessage = message;
    setMessage("");
    setError(null);
    setLoading(true);

    try {
      const res = await api.post(
        "/chat/",
        {
          message: currentMessage,
          session_id: sessionId,
          city
        },
        { headers: authHeaders() }
      );

      const data = res.data as {
        session_id: string;
        message: string;
      };

      setSessionId(data.session_id);
      setHistory((h) => [
        ...h,
        { role: "assistant", text: data.message ?? "(no response)" }
      ]);
    } catch {
      setError(
        "Chat failed. Make sure you are logged in and have items in your wardrobe."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Chat</h1>
      <p>Talk to the AI stylist or send private messages to friends.</p>

      <div className="chat-layout">
        <div className="chat-column">
          <h2>AI Stylist</h2>
          <form onSubmit={handleSend} className="form">
            <label className="field">
              <span>City (for weather)</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Message</span>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Suggest an outfit for a date night..."
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Thinking..." : "Send to stylist"}
            </button>
          </form>

          {history.length > 0 && (
            <div className="chat-history">
              {history.map((m, idx) => (
                <div
                  key={idx}
                  className={`chat-bubble chat-bubble-${m.role}`}
                >
                  {m.text}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="chat-column">
          <h2>Friends & DMs</h2>

          <form onSubmit={handleAddFriend} className="form">
            <label className="field">
              <span>Add friend by user id</span>
              <input
                type="number"
                value={newFriendId}
                onChange={(e) => setNewFriendId(e.target.value)}
                placeholder="Friend user id"
              />
            </label>
            <button className="primary-button" type="submit">
              Send request
            </button>
          </form>

          {friends.length > 0 && (
            <div className="friends-list">
              {friends.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`friend-pill${
                    dmTargetId === f.id ? " friend-pill-active" : ""
                  }`}
                  onClick={() => {
                    setDmTargetId(f.id);
                    loadDmMessages(f.id);
                  }}
                >
                  {f.username} (#{f.id})
                </button>
              ))}
            </div>
          )}

          {dmTargetId && (
            <>
              <form onSubmit={handleSendDm} className="form">
                <label className="field">
                  <span>Message to friend #{dmTargetId}</span>
                  <textarea
                    required
                    value={dmContent}
                    onChange={(e) => setDmContent(e.target.value)}
                  />
                </label>
                <button className="primary-button" type="submit">
                  Send DM
                </button>
              </form>

              {dmMessages.length > 0 && (
                <div className="chat-history">
                  {dmMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`chat-bubble ${
                        m.sender_id === dmTargetId
                          ? "chat-bubble-assistant"
                          : "chat-bubble-user"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
