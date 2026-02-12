// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsService } from "../services/api";

const CART_KEY = "cart";

const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isFaculty = user?.user_type?.toLowerCase() === "faculty";

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Cart badge count (student-only)
  const [cartCount, setCartCount] = useState(0);

  const readCartCount = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const arr = JSON.parse(raw || "[]");
      const count = Array.isArray(arr) ? arr.length : 0;
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const loadNotifications = async () => {
    if (!user?.user_id) return;
    try {
      const data = await notificationsService.getNotifications();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  // cart badge updates
  useEffect(() => {
    readCartCount();
    const onUpdate = () => readCartCount();
    window.addEventListener("cartUpdated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("cartUpdated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const markRead = async (n) => {
    if (!n || n.is_read) return;
    try {
      await notificationsService.markRead(n.notification_id);
      setNotifications((prev) =>
        prev.map((x) =>
          x.notification_id === n.notification_id ? { ...x, is_read: 1 } : x
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: 1 })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const typeBadgeClass = (type) => {
    const t = (type || "info").toLowerCase();
    if (t === "success") return "bg-success";
    if (t === "warning") return "bg-warning text-dark";
    if (t === "danger") return "bg-danger";
    return "bg-secondary";
  };

  return (
    <div>
      {/* TOOLSHARE HEADER */}
      <div
        className="text-white text-center py-4"
        style={{
          backgroundColor: "#007847",
          fontSize: "3rem",
          fontWeight: "bold",
          letterSpacing: "4px",
        }}
      >
        ToolShare
      </div>

      {/* Search + Buttons Row */}
      <div className="bg-white border-bottom shadow-sm" style={{ padding: "1rem 2rem" }}>
        <div className="container-fluid d-flex align-items-center gap-4">
          {/* Search */}
          <input
            type="text"
            className="form-control"
            placeholder={isFaculty ? "🔍 Search items..." : "🔍 Search items..."}
            style={{
              maxWidth: "520px",
              borderRadius: "30px",
              padding: "0.8rem 1.5rem",
            }}
            onChange={(e) => onSearch?.(e.target.value)}
          />

          {/* Buttons */}
          <div className="ms-auto d-flex gap-3 flex-wrap justify-content-end align-items-center">
            {/* 🛒 Cart (student-only) */}
            {!isFaculty && user && (
              <button
                onClick={() => navigate("/cart")}
                className="btn btn-outline-success fw-bold px-3 position-relative"
                style={{ borderRadius: "12px" }}
              >
                🛒 Cart
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* 🔔 Notifications Bell */}
            {user && (
              <div className="position-relative">
                <button
                  type="button"
                  className="btn btn-outline-success fw-bold px-3 position-relative"
                  style={{ borderRadius: "12px" }}
                  onClick={() => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    if (next) loadNotifications();
                  }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifOpen && (
                  <div
                    className="dropdown-menu show p-2 shadow"
                    style={{ width: 360, right: 0, left: "auto" }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                      <strong>Notifications</strong>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-link"
                          onClick={markAllRead}
                          disabled={unreadCount === 0}
                        >
                          Mark all read
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setNotifOpen(false)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="text-muted small px-2 py-2">No notifications yet.</div>
                    ) : (
                      <div style={{ maxHeight: 340, overflowY: "auto" }}>
                        {notifications.map((n) => (
                          <button
                            key={n.notification_id}
                            type="button"
                            className="dropdown-item rounded py-2"
                            onClick={() => markRead(n)}
                            style={{
                              background: n.is_read ? "transparent" : "rgba(25,135,84,0.10)",
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="me-2">
                                <div className="fw-bold">{n.title}</div>
                                <div className="small text-muted">{n.message}</div>
                                <div className="small text-muted">
                                  {new Date(n.created_at).toLocaleString()}
                                </div>
                              </div>
                              <span className={`badge ${typeBadgeClass(n.type)}`}>
                                {(n.type || "info").toUpperCase()}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => navigate("/home")}
              className="btn btn-outline-success fw-bold px-4"
              style={{ borderRadius: "12px" }}
            >
              Home
            </button>

            <button
              onClick={() => navigate("/items")}
              className="btn btn-outline-success fw-bold px-4"
              style={{ borderRadius: "12px" }}
            >
              Browse Items
            </button>

            {!isFaculty && (
              <button
                onClick={() => navigate("/my-bookings")}
                className="btn btn-outline-success fw-bold px-4"
                style={{ borderRadius: "12px" }}
              >
                My Bookings
              </button>
            )}

            {isFaculty && (
              <>
                <button
                  onClick={() => navigate("/add-item")}
                  className="btn btn-outline-success fw-bold px-4"
                  style={{ borderRadius: "12px" }}
                >
                  Add Item
                </button>

                <button
                  onClick={() => navigate("/requested-bookings")}
                  className="btn btn-outline-success fw-bold px-4"
                  style={{ borderRadius: "12px" }}
                >
                  Incoming Requests
                </button>
              </>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-danger text-white fw-bold px-4"
              style={{ borderRadius: "12px" }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
