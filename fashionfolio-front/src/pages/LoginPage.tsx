import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Adjust this payload/URL to match your backend auth route
      const response = await api.post("/auth/login", {
        email,
        password
      });

      // Example: store token in localStorage if your backend returns one
      if (response.data?.access_token) {
        localStorage.setItem("token", response.data.access_token);
      }

      navigate("/feed");
    } catch (err: unknown) {
      setError("Login failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Login</h1>
      <p>Connect your account to access your wardrobe and social feed.</p>

      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </section>
  );
}
