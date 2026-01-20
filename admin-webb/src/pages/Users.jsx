import { useEffect, useState } from "react";
import { getUsers } from "../lib/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      setErr("Kunde inte hämta användare.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    !q || u.mail.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ padding: 16 }}>
      <h2>Användare</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          className="search-input"
          placeholder="Sök e-post…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
      </div>

      {loading && <p>Laddar…</p>}
      {err && (
        <div style={{ background:"#431", color:"#fff", padding:8, borderRadius:6 }}>
          {err} <button onClick={load}>Försök igen</button>
        </div>
      )}

      {!loading && !err && filtered.length === 0 && <p>Inga användare hittades.</p>}

      {!loading && !err && filtered.length > 0 && (
        <table className="table" border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>ID</th>
              <th>E-post</th>
              <th>Roll</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id}>
                <td>{u._id}</td>
                <td>{u.mail}</td>
                <td>{u.role}</td>
                <td>{u.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
