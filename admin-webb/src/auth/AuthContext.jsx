import { createContext, useContext, useEffect, useState } from "react";

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
    // MOCK tills backend är klar:
    if (email && password) {
      setToken("mock-token");
      setUser({ id: "u1", email, role: "admin" });
      return;
    }
    throw new Error("Fel inloggning");
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
