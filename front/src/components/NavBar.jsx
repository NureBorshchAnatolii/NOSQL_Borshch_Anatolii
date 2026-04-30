import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const active = (p) =>
    pathname === p
      ? { borderBottom: "2px solid var(--ink)", paddingBottom: "2px" }
      : {};

  return (
    <nav
      style={{
        background: "var(--white)",
        borderBottom: "1px solid var(--line)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", height: 60, gap: 32 }}
      >
        <Link
          to="/"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "1.25rem",
            color: "var(--ink)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Lab1-5
        </Link>

        {user && (
          <div style={{ display: "flex", gap: 24, flex: 1 }}>
            <Link
              to="/tests"
              style={{
                fontSize: ".9rem",
                color: "var(--ink)",
                textDecoration: "none",
                ...active("/tests"),
              }}
            >
              Browse Tests
            </Link>
            <Link
              to="/builder"
              style={{
                fontSize: ".9rem",
                color: "var(--ink)",
                textDecoration: "none",
                ...active("/builder"),
              }}
            >
              Test Builder
            </Link>
            <Link
              to="/categories"
              style={{
                fontSize: ".9rem",
                color: "var(--ink)",
                textDecoration: "none",
                ...active("/categories"),
              }}
            >
              Categories
            </Link>
            <Link
              to="/profile"
              style={{
                fontSize: ".9rem",
                color: "var(--ink)",
                textDecoration: "none",
                ...active("/profile"),
              }}
            >
              Profile
            </Link>
          </div>
        )}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {user ? (
            <>
              <span style={{ fontSize: ".85rem", color: "var(--ink-2)" }}>
                {user.firstName} {user.lastName}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
