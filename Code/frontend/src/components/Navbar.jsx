// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { notificationsService } from "../services/api";

const CART_KEY = "cart";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    } catch {
      // silent fail to preserve current behavior
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // silent fail to preserve current behavior
    }
  };

  const navBtnClass = (path) => {
    const active = location.pathname === path;
    return `btn fw-semibold px-3 ${
      active ? "btn-success text-white shadow-sm" : "btn-outline-success"
    }`;
  };

  const mobileNavBtnClass = (path) => {
    const active = location.pathname === path;
    return `btn w-100 text-start fw-semibold d-flex align-items-center justify-content-between ${
      active ? "btn-success text-white" : "btn-light border"
    }`;
  };

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const roleLabel =
    isAdmin ? "Admin" : isFaculty ? "Faculty" : isStudent ? "Student" : "User";

  return (
    <div className="sticky-top" style={{ zIndex: 1040 }}>
      {/* Header */}
      <div
        className="text-white text-center"
        style={{
          backgroundColor: "#007847",
          padding: "28px 16px",
        }}
      >
        <div
          role="button"
          onClick={() => go("/home")}
          style={{
            cursor: "pointer",
            fontSize: "2.25rem",
            fontWeight: "700",
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}
        >
          ToolShare
        </div>
      </div>

      {/* Main Nav */}
      <div className="bg-white border-bottom shadow-sm">
        <div className="container-fluid px-3 px-md-4 py-3">
          <div className="d-flex align-items-center justify-content-between gap-3">
            {/* Desktop Nav */}
            <div className="d-none d-lg-flex align-items-center gap-2 flex-wrap">
              <button onClick={() => go("/home")} className={navBtnClass("/home")}>
                Home
              </button>

              <button onClick={() => go("/items")} className={navBtnClass("/items")}>
                {isStaff ? "Manage Tools" : "Browse Tools"}
              </button>

              {isStudent && (
                <button
                  onClick={() => go("/my-bookings")}
                  className={navBtnClass("/my-bookings")}
                >
                  My Requests
                </button>
              )}

              {isStaff && (
                <>
                  <button
                    onClick={() => go("/add-item")}
                    className={navBtnClass("/add-item")}
                  >
                    Add Tool
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => go("/admin")}
                      className={navBtnClass("/admin")}
                    >
                      Admin Panel
                    </button>
                  )}

                  <button
                    onClick={() => go("/requested-bookings")}
                    className={navBtnClass("/requested-bookings")}
                  >
                    Incoming Requests
                  </button>

                  <button
                    onClick={() => go("/owner-booking-history")}
                    className={navBtnClass("/owner-booking-history")}
                  >
                    Booking History
                  </button>
                </>
              )}
            </div>

            {/* Right Actions */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              {isStudent && (
                <button
                  onClick={() => go("/cart")}
                  className="btn btn-outline-success position-relative"
                  style={{
                    borderRadius: "12px",
                    width: 46,
                    height: 44,
                  }}
                  title="Basket"
                >
                  <i className="bi bi-basket3"></i>
                  {basketCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {basketCount}
                    </span>
                  )}
                </button>
              )}

              {user && (
                <div className="position-relative" ref={notifRef}>
                  <button
                    className="btn btn-outline-success position-relative"
                    style={{
                      borderRadius: "12px",
                      width: 46,
                      height: 44,
                    }}
                    title="Notifications"
                    onClick={() => {
                      const next = !notifOpen;
                      setNotifOpen(next);
                      if (next) loadNotifications();
                    }}
                  >
                    <i className="bi bi-bell"></i>
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div
                      className="dropdown-menu show p-2 shadow border-0"
                      style={{
                        width: 360,
                        maxWidth: "calc(100vw - 30px)",
                        right: 0,
                        left: "auto",
                        borderRadius: "16px",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center px-2 mb-2">
                        <strong>Notifications</strong>
                        <button
                          className="btn btn-sm btn-link text-decoration-none"
                          onClick={markAllRead}
                        >
                          Mark all read
                        </button>
                      </div>

                      <div style={{ maxHeight: 320, overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                          <div className="text-muted small px-2 py-2">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.notification_id}
                              className="dropdown-item rounded-3 py-2"
                              onClick={() => markRead(n)}
                              style={{
                                backgroundColor: n.is_read ? "transparent" : "#f0fff6",
                                whiteSpace: "normal",
                              }}
                            >
                              <div className="fw-bold">{n.title}</div>
                              <div className="small text-muted">{n.message}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Desktop logout */}
              <button
                onClick={handleLogout}
                className="btn btn-danger fw-semibold d-none d-lg-inline-flex"
                style={{ borderRadius: "12px" }}
              >
                Logout
              </button>

              {/* Mobile menu */}
              <button
                className="btn btn-outline-success d-lg-none"
                style={{ borderRadius: "12px", width: 46, height: 44 }}
                onClick={() => setMenuOpen((s) => !s)}
                aria-label="Toggle menu"
              >
                <i className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`}></i>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="d-lg-none mt-3">
              <div
                className="card border-0 shadow-sm"
                style={{ borderRadius: "18px", overflow: "hidden" }}
              >
                <div className="card-body p-3">
                  {user && (
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                      <div>
                        <div className="fw-bold">
                          {user?.name || user?.full_name || "ToolShare User"}
                        </div>
                        <div className="text-muted small">{roleLabel}</div>
                      </div>
                    </div>
                  )}

                  <div className="d-grid gap-2">
                    <button
                      onClick={() => go("/home")}
                      className={mobileNavBtnClass("/home")}
                    >
                      <span>Home</span>
                      <i className="bi bi-house"></i>
                    </button>

                    <button
                      onClick={() => go("/items")}
                      className={mobileNavBtnClass("/items")}
                    >
                      <span>{isStaff ? "Manage Tools" : "Browse Tools"}</span>
                      <i className="bi bi-grid"></i>
                    </button>

                    {isStudent && (
                      <>
                        <button
                          onClick={() => go("/my-bookings")}
                          className={mobileNavBtnClass("/my-bookings")}
                        >
                          <span>My Requests</span>
                          <i className="bi bi-calendar-check"></i>
                        </button>

                        <button
                          onClick={() => go("/cart")}
                          className={mobileNavBtnClass("/cart")}
                        >
                          <span>
                            Basket {basketCount > 0 ? `(${basketCount})` : ""}
                          </span>
                          <i className="bi bi-basket3"></i>
                        </button>
                      </>
                    )}

                    {isStaff && (
                      <>
                        <button
                          onClick={() => go("/add-item")}
                          className={mobileNavBtnClass("/add-item")}
                        >
                          <span>Add Tool</span>
                          <i className="bi bi-plus-circle"></i>
                        </button>

                        <button
                          onClick={() => go("/requested-bookings")}
                          className={mobileNavBtnClass("/requested-bookings")}
                        >
                          <span>Incoming Requests</span>
                          <i className="bi bi-inbox"></i>
                        </button>

                        <button
                          onClick={() => go("/owner-booking-history")}
                          className={mobileNavBtnClass("/owner-booking-history")}
                        >
                          <span>Booking History</span>
                          <i className="bi bi-clock-history"></i>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => go("/admin")}
                            className={mobileNavBtnClass("/admin")}
                          >
                            <span>Admin Panel</span>
                            <i className="bi bi-speedometer2"></i>
                          </button>
                        )}
                      </>
                    )}

                    <div className="pt-2 mt-2 border-top">
                      <button
                        onClick={handleLogout}
                        className="btn btn-danger w-100 fw-semibold"
                        style={{ borderRadius: "12px" }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;