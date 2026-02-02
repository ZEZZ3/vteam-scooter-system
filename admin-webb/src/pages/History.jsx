import { useEffect, useState } from "react";
import { getHistory, getUsers, deletePayments, deleteRides } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function History() {
  const [rides, setRides] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();
  const [users, setUsers] = useState();
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedRides, setSelectedRides] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await getHistory();
      console.log(data)
      setPayments(data.payments);
      setRides(data.rides);
      const user = await getUsers()
      setUsers(new Map(user.map(u => [u._id, u])))
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
            {!loading && !err && payments.length === 0 && <p>Inga turer hittades.</p>}
            {!loading && !err && payments.length > 0 && (
              <>
                {deleteLoading ? (
                  <span className="loader-small"></span>
                ) : (
                  <button
                    disabled={selectedPayments.size === 0}
                    onClick={async () => {
                      setDeleteLoading(true)
                      await deletePayments(selectedPayments);
                      
                      setPayments(prev =>
                        prev.filter(
                          p => !selectedPayments.some(s => s.paymentID === p._id)
                        )
                      );
                      
                      setSelectedPayments([]);
                      setDeleteLoading(false);
                    }}
                    style={{ padding: 8, marginBottom: 8 }}
                  >
                    Ta bort valda ({selectedPayments.length})
                  </button>
                )}

                <table className="table full" border={1} cellPadding={6}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Användare</th>
                      <th>Typ</th>
                      <th>Pris</th>
                      <th>Status</th>
                      <th>Skapad</th>
                      <th>
                        <input
                          type="checkbox"
                          checked={
                            payments.length > 0 &&
                            selectedPayments.length === payments.length
                          }
                          onChange={() => {
                            setSelectedPayments(
                              selectedPayments.length === payments.length
                                ? []
                                : payments.map(p => ({
                                    paymentID: p._id,
                                    userID: p.user,
                                  }))
                            );
                          }}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id}>
                        <td>{p._id}</td>
                        <td>
                          <Link to={`/history/${p.user}`}>{users.get(p.user)?.mail}</Link>
                        </td>
                        <td>{p.type ?? "N/A"}</td>
                        <td>{p.price ?? "N/A"}</td>
                        <td>{p.status ?? "N/A"}</td>
                        <td>{p.createdAt ? p.createdAt.slice(0,10) + " " + p.createdAt.slice(11,19) : "N/A"}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedPayments.some(
                              s => s.paymentID === p._id
                            )}
                            onChange={() => {
                              setSelectedPayments(prev =>
                                prev.some(s => s.paymentID === p._id)
                                  ? prev.filter(s => s.paymentID !== p._id)
                                  : [...prev, { paymentID: p._id, userID: p.user }]
                              );
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>

            )}
        </div>
        <div>
          <h2>Turer</h2>
          {loading && <span className="loader"></span>}
          {!loading && !err && rides.length === 0 && <p>Inga turer hittades.</p>}

          {!loading && !err && rides.length > 0 && (
              <>

                {deleteLoading ? (
                  <span className="loader-small"></span>
                ) : (
                  <button
                    disabled={selectedRides.size === 0}
                    onClick={async () => {
                      await deleteRides(selectedRides);

                      setRides(prev =>
                        prev.filter(
                          p => !selectedRides.some(s => s.rideID === p._id)
                        )
                      );

                      setSelectedRides([]);
                    }}
                    style={{ padding: 8, marginBottom: 8 }}
                  >
                    Ta bort valda ({selectedRides.length})
                  </button>
                )}
              
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
                      <th>
                        <input
                          type="checkbox"
                          checked={
                            rides.length > 0 &&
                            selectedRides.length === rides.length
                          }
                          onChange={() => {
                            setSelectedRides(
                              selectedRides.length === rides.length
                                ? []
                                : rides.map(r => ({
                                    rideID: r._id,
                                    userID: r.user,
                                  }))
                            );
                          }}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map(r => (
                      <tr key={r._id}>
                        <td>{r._id}</td>
                        <td>
                          <Link to={`/history/${r.user}`}>{users.get(r.user)?.mail}</Link>
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
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRides.some(
                              s => s.rideID === r._id
                            )}
                            onChange={() => {
                              setSelectedRides(prev =>
                                prev.some(s => s.rideID === r._id)
                                  ? prev.filter(s => s.paymentID !== r._id)
                                  : [...prev, { rideID: r._id, userID: r.user }]
                              );
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>

            )}
        </div>
      </div>
    </div>

  );
}
