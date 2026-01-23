import { useEffect, useState } from "react";
import { getSimulation } from "../lib/api";

export default function Simulation() {
  const [simulation, setSimulation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  
  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await getSimulation();
      setSimulation(data);
    } catch (e) {
      setErr("Kunde inte hämta simuleringar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Simuleringar</h2>

      {loading && <span className="loader"></span>}
      {err && (
        <div style={{ background:"#431", color:"#fff", padding:8, borderRadius:6 }}>
          {err} <button onClick={load}>Försök igen</button>
        </div>
      )}

      {!loading && !err && simulation.length === 0 && <p>Inga simuleringar hittades.</p>}

      {!loading && !err && simulation.length > 0 && (
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
            {/* {filtered.map(u => (
              <tr key={u._id}>
                <td>
                  <Link to={`/users/${u._id}`}>{u._id}</Link>
                </td>
                <td>{u.mail}</td>
                <td>{u.role}</td>
                <td>{u.balance}</td>
              </tr>
            ))} */}
          </tbody>
        </table>
      )}
    </div>
  );
}
