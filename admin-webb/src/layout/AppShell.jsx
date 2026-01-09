import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function NavItem({ to, label, active }) {
  return (
    <Link
      to={to}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: `1px solid ${active ? "rgba(124,92,255,.55)" : "transparent"}`,
        background: active ? "rgba(124,92,255,.18)" : "transparent",
        color: "var(--text)",
        fontWeight: 800,
        fontSize: 14,
        textDecoration: "none",
        transition: "background .15s ease, border-color .15s ease, transform .05s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {label}
      {active ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 99,
            background: "rgba(124,92,255,.95)",
            boxShadow: "0 0 0 3px rgba(124,92,255,.18)",
          }}
        />
      ) : null}
    </Link>
  );
}

export default function AppShell({ children }) {
  const { logout, user } = useAuth();
  const { pathname } = useLocation();

  const displayMail = user?.email || user?.mail || "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
          background: "rgba(11,15,20,.75)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 220 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: "rgba(124,92,255,.18)",
                  border: "1px solid rgba(124,92,255,.55)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  color: "var(--text)",
                }}
              >
                S
              </div>

              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 950, letterSpacing: 0.2, color: "var(--text)" }}>
                  Scooter Admin
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Systemöversikt & hantering
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <NavItem to="/" label="Översikt" active={pathname === "/"} />
              <NavItem to="/users" label="Användare" active={pathname === "/users"} />
              <NavItem to="/bikes" label="Cyklar" active={pathname === "/bikes"} />
              <NavItem to="/cities" label="Städer" active={pathname === "/cities"} />
            </nav>

            {/* Right */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
              <span className="badge" title={displayMail || "Inloggad"}>
                👤 {displayMail || "Inloggad"}
              </span>

              <button className="btn" onClick={logout} type="button">
                Logga ut
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: "18px 0 32px" }}>
        {children}
      </main>
    </div>
  );
}
