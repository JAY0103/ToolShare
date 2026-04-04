// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token      = localStorage.getItem("token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const role          = String(user?.user_type || "").toLowerCase();
  const isLoggedIn    = !!user;
  const isFacultyOrAdmin = ["faculty", "admin"].includes(role);
  const isAdmin       = role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, role, isLoggedIn, isFacultyOrAdmin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook — use this in every page instead of reading localStorage directly
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
