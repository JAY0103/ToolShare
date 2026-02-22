// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { notificationsService } from "../services/api";

const CART_KEY = "cart";

const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userType = String(user?.user_type || "").toLowerCase();
  const isFaculty = userType === "faculty";
  const isAdmin = userType === "admin";
  const isStudent = userType === "student";
  const isStaff = isFaculty || isAdmin;

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const [basketCount, setBasketCount] = useState(0);

  // Mobile menu toggle
  const [menuOpen, setMenuOpen] = useState(false);

  const readBasketCount = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const arr = JSON.parse(raw || "[]");
      setBasketCount(Array.isArray(arr) ? arr.length : 0);
    } catch {
      setBasketCount(0);
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
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  useEffect(() => {
    readBasketCount();
    const onUpdate = () => readBasketCount();
    window.addEventListener("cartUpdated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("cartUpdated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const markRead = async (n) => {
    if (!n || n.is_read) return;
    try {
      await notificationsService.markRead(n.notification_id);
      setNotifications((prev) =>
        prev.map((x) => (x.notification_id === n.notification_id ? { ...x, is_read: 1 } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  const typeBadgeClass = (type) => {
    const t = (type || "info").toLowerCase();
    if (t === "success") return "bg-success";
    if (t === "warning") return "bg-warning text-dark";
    if (t === "danger") return "bg-danger";
    return "bg-secondary";
  };

  const navBtnClass = (path) => {
    const active = location.pathname === path;
    return `btn fw-bold px-4 ${active ? "btn-success text-white" : "btn-outline-success"}`;
  };

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div>
      {/* Header */}
      <div
        className="text-white text-center py-3"
        style={{
          backgroundColor: "#007847",
          fontSize: "2.6rem",
          fontWeight: "bold",
          letterSpacing: "3px",
        }}
      >
        ToolShare
      </div>

      {/* Top Bar */}
      <div className="bg-white border-bottom shadow-sm">
        <div className="container-fluid py-3 px-4">
          <div className="d-flex align-items-center gap-3">
            {/* Search (left) */}
            <div style={{ flex: 1, maxWidth: 560 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search tools..."
                style={{
                  borderRadius: "999px",
                  padding: "0.8rem 1.25rem",
                }}
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>

            <div style={{ width: 22 }} />

            {/* Right side actions (slightly left, not fully flush right) */}
            <div className="d-flex align-items-center ms-auto" style={{ marginRight: "18px" }}>
              {/* Desktop actions */}
              <div className="d-none d-lg-flex align-items-center gap-2 flex-wrap">
                {/* Primary nav */}
                <button onClick={() => go("/home")} className={navBtnClass("/home")} style={{ borderRadius: "999px" }}>
                  Home
                </button>

                <button onClick={() => go("/items")} className={navBtnClass("/items")} style={{ borderRadius: "999px" }}>
                  Browse Tools
                </button>

                {isStudent && (
                  <button
                    onClick={() => go("/my-bookings")}
                    className={navBtnClass("/my-bookings")}
                    style={{ borderRadius: "999px" }}
                  >
                    My Requests
                  </button>
                )}

                {isStaff && (
                  <>
                    <button
                      onClick={() => go("/add-item")}
                      className={navBtnClass("/add-item")}
                      style={{ borderRadius: "999px" }}
                    >
                      Add Tool
                    </button>

                    <button
                      onClick={() => go("/requested-bookings")}
                      className={navBtnClass("/requested-bookings")}
                      style={{ borderRadius: "999px" }}
                    >
                      Incoming Requests
                    </button>

                    <button
                      onClick={() => go("/owner-booking-history")}
                      className={navBtnClass("/owner-booking-history")}
                      style={{ borderRadius: "999px" }}
                    >
                      Booking History
                    </button>
                  </>
                )}

                {/* Divider before icons */}
                <div className="mx-1" style={{ width: 1, height: 28, background: "#e5e7eb" }} />

                {/* Basket icon (student only) */}
                {isStudent && (
                  <button
                    onClick={() => go("/cart")}
                    className="btn btn-outline-success fw-bold position-relative"
                    style={{ borderRadius: "999px", width: 54, height: 44 }}
                    title="Basket"
                  >
                    🧺
                    {basketCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {basketCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Notifications */}
                {user && (
                  <div className="position-relative">
                    <button
                      type="button"
                      className="btn btn-outline-success fw-bold position-relative"
                      style={{ borderRadius: "999px", width: 54, height: 44 }}
                      title="Notifications"
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

                    {notifOpen && (
                      <div
                        className="dropdown-menu show p-2 shadow"
                        style={{ width: 380, right: 0, left: "auto" }}
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

                {/* Logout last */}
                <button
                  onClick={handleLogout}
                  className="btn btn-danger text-white fw-bold px-4"
                  style={{ borderRadius: "999px" }}
                  title="Logout"
                >
                  Logout
                </button>
              </div>

              {/* Mobile hamburger */}
              <div className="d-lg-none d-flex align-items-center gap-2">
                {/* basket quick icon for student on mobile */}
                {isStudent && (
                  <button
                    onClick={() => go("/cart")}
                    className="btn btn-outline-success fw-bold position-relative"
                    style={{ borderRadius: "999px", width: 54, height: 44 }}
                    title="Basket"
                  >
                    🧺
                    {basketCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {basketCount}
                      </span>
                    )}
                  </button>
                )}

                {/* notifications quick icon on mobile */}
                {user && (
                  <button
                    type="button"
                    className="btn btn-outline-success fw-bold position-relative"
                    style={{ borderRadius: "999px", width: 54, height: 44 }}
                    title="Notifications"
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
                )}

                {/* hamburger */}
                <button
                  className="btn btn-outline-success fw-bold"
                  style={{ borderRadius: "999px", width: 54, height: 44 }}
                  onClick={() => setMenuOpen((s) => !s)}
                  aria-label="Menu"
                  title="Menu"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {menuOpen && (
            <div className="d-lg-none mt-3">
              <div className="card shadow-sm p-3" style={{ borderRadius: 16 }}>
                <div className="d-grid gap-2">
                  <button onClick={() => go("/home")} className="btn btn-outline-success fw-bold">
                    Home
                  </button>

                  <button onClick={() => go("/items")} className="btn btn-outline-success fw-bold">
                    Browse Tools
                  </button>

                  {isStudent && (
                    <button onClick={() => go("/my-bookings")} className="btn btn-outline-success fw-bold">
                      My Requests
                    </button>
                  )}

                  {isStaff && (
                    <>
                      <button onClick={() => go("/add-item")} className="btn btn-outline-success fw-bold">
                        Add Tool
                      </button>

                      <button onClick={() => go("/requested-bookings")} className="btn btn-outline-success fw-bold">
                        Incoming Requests
                      </button>

                      <button
                        onClick={() => go("/owner-booking-history")}
                        className="btn btn-outline-success fw-bold"
                      >
                        Booking History
                      </button>
                    </>
                  )}

                  <div style={{ height: 1, background: "#e5e7eb" }} />

                  <button onClick={handleLogout} className="btn btn-danger fw-bold text-white">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications dropdown for mobile too (same dropdown) */}
          {notifOpen && (
            <div className="d-lg-none mt-3 position-relative">
              <div className="card shadow-sm p-2" style={{ borderRadius: 16 }}>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;