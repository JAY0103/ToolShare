// src/components/Navbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isFaculty = user?.user_type?.toLowerCase() === "faculty";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
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
      <div
        className="bg-white border-bottom shadow-sm"
        style={{ padding: "1rem 2rem" }}
      >
        <div className="container-fluid d-flex align-items-center gap-4">
          {/* Search */}
          <input
            type="text"
            className="form-control"
            placeholder={isFaculty ? "🔍 Search items..." : "🔍 Search recommended items..."}
            style={{
              maxWidth: "520px",
              borderRadius: "30px",
              padding: "0.8rem 1.5rem",
            }}
            onChange={(e) => onSearch?.(e.target.value)}
          />

          {/* Buttons */}
          <div className="ms-auto d-flex gap-3 flex-wrap justify-content-end">
            <button
              onClick={() => navigate("/home")}
              className="btn btn-outline-success fw-bold px-4"
              style={{ borderRadius: "12px" }}
            >
              Home
            </button>

            {/* New: Browse Items */}
            <button
              onClick={() => navigate("/items")}
              className="btn btn-outline-success fw-bold px-4"
              style={{ borderRadius: "12px" }}
            >
              Browse Items
            </button>

            {/* Student-only */}
            {!isFaculty && (
              <button
                onClick={() => navigate("/my-bookings")}
                className="btn btn-outline-success fw-bold px-4"
                style={{ borderRadius: "12px" }}
              >
                My Bookings
              </button>
            )}

            {/* Faculty-only */}
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
