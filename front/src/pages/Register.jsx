import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    birthDate: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/tests");
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        "Registration failed";
      setError(msg);
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
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem" }}>Create account</h1>
          <p style={{ color: "var(--ink-2)", marginTop: 8 }}>
            Start your interview preparation today
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div className="field">
                <label>First name</label>
                <input
                  className="input"
                  value={form.firstName}
                  onChange={set("firstName")}
                  required
                  placeholder="Jane"
                />
              </div>
              <div className="field">
                <label>Last name</label>
                <input
                  className="input"
                  value={form.lastName}
                  onChange={set("lastName")}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="jane@example.com"
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
                placeholder="Min. 6 characters"
              />
            </div>
            <div className="field">
              <label>
                Birth date{" "}
                <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <input
                className="input"
                type="date"
                value={form.birthDate}
                onChange={set("birthDate")}
              />
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              type="submit"
              disabled={busy}
              style={{ marginTop: 4 }}
            >
              {busy ? "Creating account…" : "Create account"}
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
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
