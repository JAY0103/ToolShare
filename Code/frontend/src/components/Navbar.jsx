// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { notificationsService } from "../services/api";

const CART_KEY = "cart";

const Navbar = () => {
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
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 20000);
    return () => clearInterval(id);
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

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

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
    return `btn fw-bold px-4 ${
      active ? "btn-success text-white" : "btn-outline-success"
    }`;
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
          <div className="d-flex align-items-center justify-content-end">

            {/* Right side */}
            <div className="d-flex align-items-center ms-auto" style={{ marginRight: "18px" }}>
              
              {/* Desktop */}
              <div className="d-none d-lg-flex align-items-center gap-2 flex-wrap">
                
                <button onClick={() => go("/home")} className={navBtnClass("/home")}>
                  Home
                </button>

                <button onClick={() => go("/items")} className={navBtnClass("/items")}>
                  {isStaff ? "Manage Tools" : "Browse Tools"}
                </button>

                {isStudent && (
                  <button onClick={() => go("/my-bookings")} className={navBtnClass("/my-bookings")}>
                    My Requests
                  </button>
                )}

                {isStaff && (
                  <>
                    <button onClick={() => go("/add-item")} className={navBtnClass("/add-item")}>
                      Add Tool
                    </button>

                    <button onClick={() => go("/requested-bookings")} className={navBtnClass("/requested-bookings")}>
                      Incoming Requests
                    </button>

                    <button onClick={() => go("/owner-booking-history")} className={navBtnClass("/owner-booking-history")}>
                      Booking History
                    </button>
                  </>
                )}

                <div className="mx-1" style={{ width: 1, height: 28, background: "#e5e7eb" }} />

                {/* Basket */}
                {isStudent && (
                  <button
                    onClick={() => go("/cart")}
                    className="btn btn-outline-success position-relative"
                    style={{ borderRadius: "999px", width: 54, height: 44 }}
                  >
                    <i className="bi bi-basket3"></i>
                    {basketCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge bg-danger">
                        {basketCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Notifications */}
                {user && (
                  <div className="position-relative">
                    <button
                      className="btn btn-outline-success position-relative"
                      style={{ borderRadius: "999px", width: 54, height: 44 }}
                      onClick={() => {
                        const next = !notifOpen;
                        setNotifOpen(next);
                        if (next) loadNotifications();
                      }}
                    >
                      <i className="bi bi-bell"></i>
                      {unreadCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge bg-danger">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="dropdown-menu show p-2 shadow" style={{ width: 380, right: 0 }}>
                        <div className="d-flex justify-content-between px-2 mb-2">
                          <strong>Notifications</strong>
                          <button className="btn btn-sm btn-link" onClick={markAllRead}>
                            Mark all read
                          </button>
                        </div>

                        {notifications.length === 0 ? (
                          <div className="text-muted small px-2">No notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.notification_id}
                              className="dropdown-item"
                              onClick={() => markRead(n)}
                            >
                              <div className="fw-bold">{n.title}</div>
                              <div className="small">{n.message}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button onClick={handleLogout} className="btn btn-danger fw-bold">
                  Logout
                </button>
              </div>

              {/* Mobile */}
              <div className="d-lg-none">
                <button
                  className="btn btn-outline-success"
                  onClick={() => setMenuOpen((s) => !s)}
                >
                  <i className="bi bi-list"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="mt-3">
              <div className="card p-3">
                <button onClick={() => go("/home")} className="btn btn-outline-success mb-2">
                  Home
                </button>

                <button onClick={() => go("/items")} className="btn btn-outline-success mb-2">
                  {isStaff ? "Manage Tools" : "Browse Tools"}
                </button>

                <button onClick={handleLogout} className="btn btn-danger">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;