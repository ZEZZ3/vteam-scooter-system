import { useEffect, useState } from "react";
import { getBikes, getUsers } from "../lib/api";

export default function AdminDashboard() {
  const [bikes, setBikes] = useState([]);
  const [users, setUsers] = useState([]);
  const [bikesLoading, setBikesLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setBikes(await getBikes());
      setUsers(await getUsers());
      try {
        const [bikes, users] = await Promise.all([
          getBikes().then(d => {
            setBikes(d);
            setBikesLoading(false);
            return d;
          }),
          getUsers().then(d => {
            setUsers(d);
            setUsersLoading(false);
            return d;
          })
        ]);
      } catch (e) {
        setError(e.message);
        setBikesLoading(false);
        setUsersLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="error-div">Fel: {error}</div>
    )
  }

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>Användare</h2>
      {usersLoading ? (
        <div>
          <span className="loader"></span>
        </div>
      ) : (
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
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u._id}</td>
                <td>{u.mail}</td>
                <td>{u.role}</td>
                <td>{u.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Cyklar</h2>

      {bikesLoading ? (
        <div>
          <span className="loader"></span>
        </div>
      ) : (
        <table className="table" border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nummer</th>
              <th>Status</th>
              <th>Batteri</th>
              <th>Stad</th>
              <th>Zon</th>
              <th>Station</th>
            </tr>
          </thead>
          <tbody>
            {bikes.map((b) => (
              <tr key={b.id}>
                <td>{b._id}</td>
                <td>{b.number}</td>
                <td>{b.status}</td>
                <td>{b.battery}%</td>
                <td>{b.city}</td>
                <td>{b.currentZoneName}</td>
                <td>{b.currentStationName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
