import { useEffect, useMemo, useState } from "react";
import { getBikes } from "../lib/api";

function Battery({ pct }) {
  const color = pct >= 60 ? "#1e8f4d" : pct >= 30 ? "#c7a100" : "#b42323";
  return (
    <span style={{
      padding:"2px 8px", borderRadius:999, background: color, color:"#fff", fontWeight:600
    }}>{pct}%</span>
  );
}

export default function Bikes() {
  const [bikes, setBikes] = useState([]);
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await getBikes();
      setBikes(data);
    } catch (e) {
      setErr("Kunde inte hämta cyklar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const cities = useMemo(() => {
    return Array.from(new Set(bikes.map(b => b.city))).sort();
  }, [bikes]);

  const filtered = bikes.filter(b =>
    (!status || b.status === status) &&
    (!city || b.city === city)
  );

  return (
    <div style={{ padding: 16 }}>
      <h2>Cyklar</h2>

      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <select value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="">Status: Alla</option>
          <option value="available">available</option>
          <option value="in_use">in_use</option>
          <option value="service">service</option>
        </select>

        <select value={city} onChange={(e)=>setCity(e.target.value)}>
          <option value="">Stad: Alla</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button onClick={() => { setStatus(""); setCity(""); }}>Rensa filter</button>
        <button onClick={load} disabled={loading}>Uppdatera</button>
      </div>

      {loading && <p>Laddar…</p>}
      {err && (
        <div style={{ background:"#431", color:"#fff", padding:8, borderRadius:6 }}>
          {err} <button onClick={load}>Försök igen</button>
        </div>
      )}

      {!loading && !err && filtered.length === 0 && <p>Inga cyklar hittades.</p>}

      {!loading && !err && filtered.length > 0 && (
        <table border={1} cellPadding={6} style={{ width:"100%", marginTop:8 }}>
          <thead>
            <tr><th>ID</th><th>Status</th><th>Batteri</th><th>Stad</th></tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.status}</td>
                <td><Battery pct={b.battery} /></td>
                <td>{b.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
