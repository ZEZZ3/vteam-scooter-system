import { useEffect, useState } from "react";
import { getHistory } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function History() {
  const [rides, setRides] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await getHistory();
      console.log(data)
      setPayments(data.payments);
      setRides(data.rides);
    } catch (e) {
      setErr("Kunde inte hämta användare.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      {err && (
          <div style={{ background:"#431", color:"#fff", padding:8, borderRadius:6 }}>
            {err} <button onClick={load}>Försök igen</button>
          </div>
      )}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div>
          <h2>Betalningar</h2>
            {loading && <span className="loader"></span>}
            {!loading && !err && (
              <table className="table full" border={1} cellPadding={6}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Användare</th>
                    <th>Typ</th>
                    <th>Pris</th>
                    <th>Status</th>
                    <th>Skapad</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td>{p._id}</td>
                      <td>
                        <Link to={`/users/${p.user}`}>{p.user}</Link>
                      </td>
                      <td>{p.type ?? "N/A"}</td>
                      <td>{p.price ?? "N/A"}</td>
                      <td>{p.status ?? "N/A"}</td>
                      <td>{p.createdAt.slice(0,10) + " " + p.createdAt.slice(11,19) ?? "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
        <div>
          <h2>Turer</h2>
          {loading && <span className="loader"></span>}
          {!loading && !err && (
              <table className="table full" border={1} cellPadding={6}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Användare</th>
                    <th>Scooter</th>
                    <th>Startid</th>
                    <th>Stopptid</th>
                    <th>Tid</th>
                    <th>Parkering</th>
                    <th>Pris</th>
                    <th>Startposition</th>
                    <th>Stopposition</th>
                    <th>Avstånd</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map(r => (
                    <tr key={r._id}>
                      <td>{r._id}</td>
                      <td>
                        <Link to={`/users/${r.user}`}>{r.user}</Link>
                      </td>
                      <td>{r.bike}</td>
                      <td>{r.start ? r.start.slice(0,10) + " " + r.start.slice(11,19) : "N/A"}</td>
                      <td>{r.stop ? r.stop.slice(0,10) + " " + r.stop.slice(11,19) : "N/A"}</td>
                      <td>{r.duration ?? "N/A"}</td>
                      <td>{r.parking ?? "N/A"}</td>
                      <td>{r.price ?? "N/A"}</td>
                      <td>{r.startPos?.lat ?? "N/A"}, {r.startPos?.long ?? "N/A"} </td>
                      <td>{r.stopPos?.lat ?? "N/A"}, {r.stopPos?.long ?? "N/A"} </td>
                      <td>{r?.distance.toFixed(2) ?? "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>

  );
}
