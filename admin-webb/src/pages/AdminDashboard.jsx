import { useEffect, useState } from "react";
import { getBikes, getUsers } from "../lib/api";

export default function AdminDashboard() {
  const [bikes, setBikes] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function load() {
      setBikes(await getBikes());
      setUsers(await getUsers());
    }
    load();
  }, []);

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>Admin Dashboard</h1>

      <h2>Användare</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>E-post</th>
            <th>Roll</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Cyklar</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Batteri</th>
            <th>Stad</th>
          </tr>
        </thead>
        <tbody>
          {bikes.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.status}</td>
              <td>{b.battery}%</td>
              <td>{b.city}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
