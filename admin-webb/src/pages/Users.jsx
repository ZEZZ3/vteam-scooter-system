import { useEffect, useMemo, useState } from "react";
import { getUsers } from "../lib/api";

function safeEmail(u) {
  return u?.mail || u?.email || "";
}

function safeId(u) {
  return u?.id || u?._id || "";
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Kunde inte hämta användare. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => safeEmail(u).toLowerCase().includes(q));
  }, [users, query]);

  const emptyText =
    users.length === 0
      ? "Inga användare finns ännu."
      : "Inga användare matchade din sökning.";

  return (
    <div className="container">
      <h1 className="h1">Användare</h1>
      <p className="muted" style={{ marginTop: -4 }}>
        Sök på e-post och få en snabb överblick.
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardHead">
          <div className="row" style={{ width: "100%" }}>
            <span className="badge">👥 Users</span>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök på e-post…"
              style={{ minWidth: 260 }}
            />

            <div className="spacer" />

            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Laddar…" : "Uppdatera"}
            </button>
          </div>
        </div>

        <div className="cardBody">
          {error ? (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,99,99,.25)",
                background: "rgba(255,99,99,.10)",
                marginBottom: 12,
              }}
            >
              <div style={{ marginBottom: 10, fontWeight: 700 }}>{error}</div>
              <button className="btn" onClick={load}>
                Försök igen
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="muted" style={{ padding: 10 }}>
              Laddar användare…
            </div>
          ) : filtered.length === 0 ? (
            <div className="muted" style={{ padding: 10 }}>
              {emptyText}
            </div>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>E-post</th>
                    <th>Roll</th>
                    <th style={{ width: 260 }}>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={safeId(u) || safeEmail(u) || JSON.stringify(u)}>
                      <td style={{ fontWeight: 700 }}>{safeEmail(u) || "—"}</td>
                      <td>
                        <span className="badge">{u?.role || "—"}</span>
                      </td>
                      <td title={safeId(u)} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                        {safeId(u) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
