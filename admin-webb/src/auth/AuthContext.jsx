import { createContext, useContext, useEffect, useState } from "react";
import { client } from "../api/client";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("admintoken"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("adminuser");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("admintoken", token);
    else localStorage.removeItem("admintoken");

    if (user) localStorage.setItem("adminuser", JSON.stringify(user));
    else localStorage.removeItem("adminuser");
  }, [token, user]);

  async function login(email, password) {
    const res = await client.post("/api/v1/users/login", {
      mail: email,
      password,
    });

    const data = res.data?.data;
    if (!data?.token) throw new Error("Login misslyckades");

    setToken(data.token);

    const u = data.user || {};
    setUser({
      id: u.id || u._id,
      mail: u.mail,
      email: u.mail,
      role: u.role,
    });
  }

  function logout() {
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthCtx.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
