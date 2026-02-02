import { useEffect, useState } from "react";
import { getUserHistory } from "../lib/api";
import { useNavigate, useParams } from "react-router-dom";

export default function UserHistory() {
  const { id } = useParams();
  const [payments, setPayments] = useState()
  const [rides, setRides] = useState()
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true); setErr(null);
    try {
      const userData = await getUserHistory(id);
      console.log(userData)
      setPayments(userData.payments)
      setRides(userData.rides)
    } catch (e) {
      setErr("Kunde inte hämta data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column" }}>
      <div>
        <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
          <button onClick={() => navigate("/history")} style={{ padding: "0.5rem", marginRight: 5 }}>&lt;</button>
          <h2>Betalningar</h2>
        </div>

        {loading && <span className="loader"></span>}
        {err && (
            <div style={{ background:"#431", color:"#fff", padding:8, borderRadius:6 }}>
            {err} <button onClick={load}>Försök igen</button>
            </div>
        )}

        {!loading && !err && payments.length === 0 && <p>Inga betalningar för användaren hittades.</p>}

        {!loading && !err && payments.length > 0 && (
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
                            {p.user ?? "N/A"}
                        </td>
                        <td>{p.type ?? "N/A"}</td>
                        <td>{p.price ?? "N/A"}</td>
                        <td>{p.status ?? "N/A"}</td>
                        <td>{p.createdAt ? p.createdAt.slice(0,10) + " " + p.createdAt.slice(11,19) : "N/A"}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
      <div>
          <h2>Turer</h2>
          {loading && <span className="loader"></span>}
          {!loading && !err && rides.length === 0 && <p>Inga turer för användaren hittades.</p>}
          {!loading && !err && rides.length > 0 && (
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
                        {r.user}
                      </td>
                      <td>{r.bike}</td>
                      <td>{r.start ? r.start.slice(0,10) + " " + r.start.slice(11,19) : "N/A"}</td>
                      <td>{r.stop ? r.stop.slice(0,10) + " " + r.stop.slice(11,19) : "N/A"}</td>
                      <td>{r.duration ?? "N/A"}</td>
                      <td>{r.parking ?? "N/A"}</td>
                      <td>{r.price ?? "N/A"}</td>
                      <td>{r.startPos?.lat ?? "N/A"}, {r.startPos?.long ?? "N/A"} </td>
                      <td>{r.stopPos?.lat ?? "N/A"}, {r.stopPos?.long ?? "N/A"} </td>
                      <td>{r?.distance ? r.distance.toFixed(2) : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
    </div>
  );
}
