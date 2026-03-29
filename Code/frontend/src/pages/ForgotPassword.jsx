// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await authService.forgotPassword(email);
      setMessage(data.message || "Password reset link sent to your email.");
    } catch (err) {
      setError(err.message || "Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <div
        className="text-center py-5 text-white"
        style={{ backgroundColor: "#007847", fontSize: "3rem", fontWeight: "bold" }}
      >
        ToolShare
      </div>

      <div className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
        <div
          className="card shadow-lg border-0"
          style={{ maxWidth: "420px", width: "100%", borderRadius: "20px" }}
        >
          <div className="card-body p-5">
            <h2 className="text-center mb-2" style={{ color: "#007847" }}>
              Forgot Password
            </h2>
            <p className="text-center text-muted small mb-4">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              {message && <div className="alert alert-success py-2">{message}</div>}

              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className="form-control form-control-lg"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn w-100 text-white"
                style={{ backgroundColor: "#007847", padding: "14px" }}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="text-center mt-3">
              <button className="btn btn-link" style={{ color: "#007847" }} onClick={() => navigate("/login")}>
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;