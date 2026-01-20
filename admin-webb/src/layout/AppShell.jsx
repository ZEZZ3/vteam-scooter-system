import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AppShell({ children }) {
  const { logout, user } = useAuth();
  const { pathname } = useLocation();

  const Tab = ({ to, label }) => (
    <Link
      to={to}
      style={{
        padding:"8px 10px",
        borderRadius:8,
        textDecoration:"none",
        background: pathname === to ? "#2b2b2b" : "transparent",
        color:"#fff"
      }}
    >
      {label}
    </Link>
  );

  return (
    <div className="root-container">
      <header style={{ display:"flex", gap:12, padding:12, borderBottom:"1px solid #333", alignItems:"center" }}>
        <strong>Scooter Admin</strong>
        <nav style={{ display:"flex", gap:8 }}>
          <Tab to="/" label="Översikt" />
          <Tab to="/users" label="Användare" />
          <Tab to="/bikes" label="Cyklar" />
          <Tab to="/cities" label="Städer" />
        </nav>
        <div style={{ marginLeft:"auto", display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ opacity:0.8 }}>{user?.email}</span>
          <button onClick={logout}>Logga ut</button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
