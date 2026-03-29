// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../services/api";

const ResetPassword = () => {
  const { token } = useParams(); // get token from URL
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!password || !confirmPassword) {
      return setError("Please fill all fields");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      // Call backend API
      await authService.resetPassword(token, password);

      setMessage("Password reset successful! Redirecting to login...");

      // Redirect after 2 sec
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <div
        className="text-center py-5 text-white"
        style={{
          backgroundColor: "#007847",
          fontSize: "3rem",
          fontWeight: "bold",
        }}
      >
        ToolShare
      </div>

      {/* Form */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
        <div
          className="card shadow-lg border-0"
          style={{ maxWidth: "420px", width: "100%", borderRadius: "20px" }}
        >
          <div className="card-body p-5">
            <h2 className="text-center mb-4" style={{ color: "#007847" }}>
              Reset Password
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Error */}
              {error && (
                <div className="alert alert-danger py-2">{error}</div>
              )}

              {/* Success */}
              {message && (
                <div className="alert alert-success py-2">{message}</div>
              )}

              {/* New Password */}
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn w-100 text-white"
                style={{ backgroundColor: "#007847", padding: "14px" }}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;