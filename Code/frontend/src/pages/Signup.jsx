import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/api";

const Signup = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    student_id: "",
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // clear error on typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authService.register(formData);

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      window.location.href = "/home";
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header (same as Login) */}
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

      {/* Signup Card */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
        <div
          className="card shadow-lg border-0"
          style={{ maxWidth: "500px", width: "100%", borderRadius: "20px" }}
        >
          <div className="card-body p-5">
            <h2 className="text-center mb-4" style={{ color: "#007847" }}>
              Create Account
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="alert alert-danger py-2">{error}</div>
              )}

              {/* Name Row */}
              <div className="row mb-3">
                <div className="col">
                  <input
                    name="first_name"
                    placeholder="First Name"
                    className="form-control form-control-lg"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col">
                  <input
                    name="last_name"
                    placeholder="Last Name"
                    className="form-control form-control-lg"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Student ID */}
              <div className="mb-3">
                <input
                  name="student_id"
                  placeholder="Student / Faculty ID"
                  className="form-control form-control-lg"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Username */}
              <div className="mb-3">
                <input
                  name="username"
                  placeholder="Username"
                  className="form-control form-control-lg"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="form-control form-control-lg"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="form-control form-control-lg"
                  onChange={handleChange}
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
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            {/* Login Redirect */}
            <p className="text-center mt-4">
              Already have an account?{" "}
              <Link
                to="/login"
                style={{ color: "#007847", fontWeight: "600" }}
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;