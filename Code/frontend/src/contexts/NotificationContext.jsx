// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { notificationsService } from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isLoggedIn }                      = useAuth();
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount,   setUnreadCount]     = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await notificationsService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount     || 0);
    } catch {
      // silently ignore — notification polling should never crash the app
    }
  }, [isLoggedIn]);

  // Poll every 60 seconds when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [isLoggedIn, fetchNotifications]);

  const markRead = async (id) => {
    await notificationsService.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === id ? { ...n, is_read: 1 } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationsService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
