import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate("/tests");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem" }}>Welcome back</h1>
          <p style={{ color: "var(--ink-2)", marginTop: 8 }}>
            Sign in to continue your prep
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              {error}
            </div>
          )}
          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                placeholder="••••••••"
              />
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              type="submit"
              disabled={busy}
              style={{ marginTop: 4 }}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: ".9rem",
            color: "var(--ink-2)",
          }}
        >
          No account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
