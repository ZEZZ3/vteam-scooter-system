import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      await login(mail, password);
      window.location.href = "/";
    } catch (e) {
      const msg =
        e?.response?.data?.error?.title ||
        e?.message ||
        "Fel vid inloggning";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        maxWidth: 360,
        margin: "4rem auto",
        display: "grid",
        gap: 8,
      }}
    >
      <h2>Admin – Logga in</h2>

      <input
        placeholder="E-post"
        value={mail}
        onChange={(e) => setMail(e.target.value)}
        disabled={loading}
      />

      <input
        placeholder="Lösenord"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <button disabled={loading}>
        {loading ? "Loggar in…" : "Logga in"}
      </button>
    </form>
  );
}
