import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/"; // vidare till admin
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: "4rem auto", display: "grid", gap: 8 }}>
      <h2>Admin – Logga in</h2>
      <input placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Lösenord" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && <div style={{ color: "crimson" }}>{err}</div>}
      <button disabled={loading}>{loading ? "Loggar in…" : "Logga in"}</button>
    </form>
  );
}
