import { createContext, useContext, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
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

    const res = await fetch(`${API_BASE}/api/v1/users/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            mail: email,
            password: password
        })
    });    
    
    const data = await res.json();
    const user = data.data?.user;
    if (!res.ok) {

        if (data?.error?.title === "Wrong password") {
            throw new Error("Fel lösenord!");
        }
        if (data?.error?.title === "User not found") {
            throw new Error("Användare hittades ej!")
          }
        if (data?.error?.title === "Email or password missing") {
          throw new Error("Lösenord eller mail saknades.")
        }
        throw new Error("Något blev fel!")
    }

    if (user.role !== "admin") {
      throw new Error("Obehörig användare!")
    }

    setToken(data.data.token);
    setUser({ id: user.id, email: user.mail, role: user.role });
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);