import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));

  const persist = (u, t) => {
    setUser(u); setToken(t);
    if (u) localStorage.setItem("auth_user", JSON.stringify(u)); else localStorage.removeItem("auth_user");
    if (t) localStorage.setItem("auth_token", t); else localStorage.removeItem("auth_token");
  };

  // Username/email login against the real backend.
  const login = async (username, password) => {
    const { api } = await import("../services/api.js");
    const res = await api.login({ username, password });
    const u = res.user || res;
    const t = res.token || (u && u.userId) || "";
    persist(u, t);
    return u;
  };

  const logout = () => persist(null, null);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, clientId: CLIENT_ID }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
