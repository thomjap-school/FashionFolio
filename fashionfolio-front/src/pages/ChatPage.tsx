import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type AiChannel = {
  id: string;
  label: string;
};

// Chat page where users can interact with an AI stylist and also manage DMs with friends.
type ChannelHistories = Record<string, ChatMessage[]>;

export function ChatPage() {
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("Paris");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [channelHistories, setChannelHistories] = useState<ChannelHistories>(
    {}
  );
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
  const [channels, setChannels] = useState<AiChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    initChannelsAndHistories();
    loadMe();
    loadFriends();
  }, []);

  useEffect(() => {
    const clonePostId = searchParams.get("clonePostId");
    if (clonePostId) {
      handleClonePost(clonePostId);
      searchParams.delete("clonePostId");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function initChannelsAndHistories() {
    const storedChannels = localStorage.getItem("aiChannels");
    const storedHistories = localStorage.getItem("aiChannelHistories");
    const parsedHistories: ChannelHistories = storedHistories
      ? JSON.parse(storedHistories)
      : {};

    if (storedChannels) {
      let parsed: AiChannel[] = JSON.parse(storedChannels);
      // Re-label channels sequentially (Channel 1, Channel 2, ...)
      parsed = parsed.map((ch, idx) => ({
        ...ch,
        label: `Channel ${idx + 1}`
      }));
      setChannels(parsed);
      setChannelHistories(parsedHistories);
      if (parsed.length > 0) {
        const first = parsed[0];
        setActiveChannelId(first.id);
        setSessionId(first.id);
        setHistory(parsedHistories[first.id] ?? []);
      }
      localStorage.setItem("aiChannels", JSON.stringify(parsed));
    } else {
      const first: AiChannel = {
        id: crypto.randomUUID(),
        label: "Channel 1"
      };
      setChannels([first]);
      setActiveChannelId(first.id);
      setSessionId(first.id);
      setHistory([]);
      localStorage.setItem("aiChannels", JSON.stringify([first]));
      localStorage.setItem("aiChannelHistories", JSON.stringify({}));
    }
  }

  function persistChannels(next: AiChannel[]) {
    // Re-number labels so there are never gaps (Channel 1..N)
    const relabeled = next.map((ch, idx) => ({
      ...ch,
      label: `Channel ${idx + 1}`
    }));
    setChannels(relabeled);
    localStorage.setItem("aiChannels", JSON.stringify(relabeled));
  }

  function persistHistories(next: ChannelHistories) {
    setChannelHistories(next);
    localStorage.setItem("aiChannelHistories", JSON.stringify(next));
  }

  function saveCurrentChannelHistory(channelId: string | null, h: ChatMessage[]) {
    if (!channelId) return;
    const next: ChannelHistories = {
      ...channelHistories,
      [channelId]: h
    };
    persistHistories(next);
  }

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

  async function handleClonePost(postId: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post(
        `/social/posts/${postId}/clone`,
        null,
        { headers: authHeaders() }
      );
      const data = res.data as {
        cloned_outfit?: unknown;
        message?: string;
      };
      const text =
        data.message ||
        "Here is a cloned outfit based on this post using your wardrobe.";
      const clonedMessage: ChatMessage = { role: "assistant", text };
      const channelId = activeChannelId ?? sessionId;
      const newHistory =
        channelId && channelHistories[channelId]
          ? [...channelHistories[channelId], clonedMessage]
          : [...history, clonedMessage];
      setHistory(newHistory);
      saveCurrentChannelHistory(channelId, newHistory);
    } catch {
      setError("Could not clone outfit. Make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg: ChatMessage = { role: "user", text: message };
    const channelId = activeChannelId ?? sessionId;
    const baseHistory =
      channelId && channelHistories[channelId]
        ? channelHistories[channelId]
        : history;
    const newHistory = [...baseHistory, userMsg];
    setHistory(newHistory);
    saveCurrentChannelHistory(channelId, newHistory);

    const currentMessage = message;
    setMessage("");
    setError(null);
    setLoading(true);

    try {
      const res = await api.post(
        "/chat/",
        {
          message: currentMessage,
          session_id: channelId,
          city
        },
        { headers: authHeaders() }
      );

      const data = res.data as {
        session_id: string;
        message: string;
      };

      setSessionId(data.session_id);

      let effectiveChannelId = channelId;
      if (!effectiveChannelId) {
        // first message ever: create initial channel with this session id
        const first: AiChannel = {
          id: data.session_id,
          label: "Channel 1"
        };
        persistChannels([first]);
        setActiveChannelId(first.id);
        effectiveChannelId = first.id;
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        text: data.message ?? "(no response)"
      };
      const updatedHistory = [...newHistory, assistantMsg];
      setHistory(updatedHistory);
      saveCurrentChannelHistory(effectiveChannelId, updatedHistory);
    } catch {
      setError(
        "Chat failed. Make sure you are logged in and have items in your wardrobe."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNewChannel() {
    const ch: AiChannel = {
      id: crypto.randomUUID(),
      label: "" // label will be filled by persistChannels
    };
    const next = [...channels, ch];
    persistChannels(next);
    const created = JSON.parse(
      localStorage.getItem("aiChannels") || "[]"
    ) as AiChannel[];
    const last = created[created.length - 1];
    setChannels(created);
    setActiveChannelId(last.id);
    setSessionId(last.id);
    setHistory(channelHistories[last.id] ?? []);
    setError(null);
  }

  async function handleLeaveChannel(id: string) {
    setError(null);
    try {
      await api.delete(`/chat/${id}`, { headers: authHeaders() });
    } catch {
      // ignore backend errors when clearing
    }

    const { [id]: _removed, ...rest } = channelHistories;
    persistHistories(rest);

    const remaining = channels.filter((c) => c.id !== id);
    persistChannels(remaining);
    const reloadedChannels = JSON.parse(
      localStorage.getItem("aiChannels") || "[]"
    ) as AiChannel[];
    setChannels(reloadedChannels);

    if (activeChannelId === id) {
      const fallback = reloadedChannels[0] ?? null;
      setActiveChannelId(fallback ? fallback.id : null);
      setSessionId(fallback ? fallback.id : null);
      const fallbackHistory = fallback ? rest[fallback.id] ?? [] : [];
      setHistory(fallbackHistory);
    }
  }

  function handleSwitchChannel(targetId: string) {
    if (activeChannelId === targetId) return;
    // save current history for current channel
    saveCurrentChannelHistory(activeChannelId ?? sessionId, history);
    // load target channel history
    const targetHistory = channelHistories[targetId] ?? [];
    setActiveChannelId(targetId);
    setSessionId(targetId);
    setHistory(targetHistory);
    setError(null);
  }

  return (
    <section>
      <h1>Chat</h1>
      <p>Talk to the AI stylist or send private messages to friends.</p>

      <div className="chat-layout">
        <div className="chat-column">
          <h2>AI Stylist</h2>
          <div className="friends-list" style={{ marginBottom: "0.75rem" }}>
            {channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                className={`friend-pill${
                  activeChannelId === ch.id ? " friend-pill-active" : ""
                }`}
                onClick={() => handleSwitchChannel(ch.id)}
              >
                {ch.label}
                <span
                  style={{ marginLeft: 6, opacity: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveChannel(ch.id);
                  }}
                >
                  ×
                </span>
              </button>
            ))}
            <button
              type="button"
              className="friend-pill"
              onClick={handleNewChannel}
            >
              + New channel
            </button>
          </div>

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
