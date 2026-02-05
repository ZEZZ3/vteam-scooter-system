import { useMemo, useState } from "react";
import { useSocket } from "../socket/useSocket";
import { Link, useNavigate } from "react-router-dom";

function Battery({ pct }) {
  const color = pct >= 60 ? "#1e8f4d" : pct >= 30 ? "#c7a100" : "#b42323";
  return (
    <span style={{
      padding:"2px 8px", borderRadius:999, background: color, color:"#fff", fontWeight:600
    }}>{pct}%</span>
  );
}

export default function Bikes() {
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [limit, setLimit] = useState(50);
  const [err, setErr] = useState(null);
  const {bikes, connected, bikesLoading} = useSocket();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const cities = useMemo(() => {
    return Array.from(new Set(bikes.map(b => b.city))).sort();
  }, [bikes]);

  const filtered = bikes.filter(b =>
    (!status || b.status === status) &&
    (!city || b.city === city) &&
    (!q || 
      b.number.toString().toLowerCase().includes(q.toLowerCase()) ||
      b._id.toLowerCase().includes(q.toLowerCase()) ||
      b.city.toLowerCase().includes(q.toLowerCase()) ||
      b.currentStationName.toLowerCase().includes(q.toLowerCase()) ||
      b.currentZoneName.toLowerCase().includes(q.toLowerCase()) ||
      b.status.toLowerCase().includes(q.toLowerCase())
    )
  );
  console.log(bikes)
  const display = filtered.slice(0, limit)

  return (
    <div style={{ padding: 16 }}>
      <h2>Cyklar</h2>
        
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>

          <input
            className="search-input"
            placeholder="Sök"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
          
          <select value={status} onChange={(e)=>setStatus(e.target.value)} style={{padding: "0.5rem"}}>
            <option value="">Status: Alla</option>
            <option value="free">free</option>
            <option value="rented">rented</option>
            <option value="service">service</option>
          </select>

          <select value={city} onChange={(e)=>setCity(e.target.value)} style={{padding: "0.5rem"}}>
            <option value="">Stad: Alla</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={limit} 
            onChange={(e)=>setLimit(Number(e.target.value))} 
            style={{padding: "0.5rem"}}
          >
            <option value={10}>Visa: 10</option>
            <option value={20}>Visa: 20</option>
            <option value={30}>Visa: 30</option>
            <option value={50}>Visa: 50</option>
            <option value={100}>Visa: 100</option>
            <option value={filtered.length}>Visa: {filtered.length}</option>
          </select>

          <button onClick={() => { setStatus(""); setCity(""); setLimit(50); setQ("") }}>Rensa filter</button>
          
          <button onClick={() => navigate("/bikes/add")} >Lägg till</button>
          
          <div className="live-status" style={{ color: connected ? "green" : "red" }}>
            Live spårning: {connected ? "Aktiv" : "Frånkopplad"}
          </div>
        </div>

      {bikesLoading && <span className="loader"></span>}
      
      {err && (
        <div style={{ background:"#431", color:"#fff", padding:8, borderRadius:6 }}>
          {err} <button onClick={load}>Försök igen</button>
        </div>
      )}

      {!bikesLoading && !err && filtered.length === 0 && <p>Inga cyklar hittades.</p>}

      {!bikesLoading && !err && filtered.length > 0 && (
        <div>
          {/*           <span>Visar {display.length}</span> */}
          <table className = "table bikes" border={1} cellPadding={6} >
            <thead>
              <tr>
                <th>ID</th>
                <th>Nummer</th>
                <th>Status</th>
                <th>Batteri</th>
                <th>Stad</th>
                <th>Zon</th>
                <th>Station</th>
                <th>Uppdaterad</th>
              </tr>
            </thead>
            <tbody>
              {display.map(b => (
                <tr key={b._id}>
                  <td>
                    <Link to={`/bikes/${b._id}`}>{b._id}</Link>
                  </td>
                  <td>{b.number}</td>
                  <td>{b.status}</td>
                  <td><Battery pct={b.battery} /></td>
                  <td>{b.city}</td>
                  <td>{b.currentZoneName}</td>
                  <td>{b.currentStationName ? b.currentStationName : "N/A"}</td>
                  <td>{b.updatedAt ? new Date(b.updatedAt).toLocaleTimeString() : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
