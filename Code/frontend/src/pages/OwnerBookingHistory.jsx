// frontend/src/pages/OwnerBookingHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { bookingsService } from "../services/api";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = ["", "Pending", "Approved", "Rejected", "CheckedOut", "Returned", "Overdue"];

const formatDateTime = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString();
  } catch {
    return String(val);
  }
};

const getUserFromStorage = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const OwnerBookingHistory = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [itemsLoading, setItemsLoading] = useState(true);
  const [ownerItems, setOwnerItems] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [itemId, setItemId] = useState("");
  const [from, setFrom] = useState(""); // YYYY-MM-DD
  const [to, setTo] = useState(""); // YYYY-MM-DD

  // Data
  const [requests, setRequests] = useState([]);

  // Client-side guard: only Faculty/Admin
  useEffect(() => {
    const user = getUserFromStorage();
    const role = String(user?.user_type || "").toLowerCase();

    // Adjust this if your "admin" role name differs
    const allowed = role === "faculty" || role === "admin";

    if (!allowed) {
      alert("Not allowed. This page is for Faculty/Admin only.");
      navigate("/home");
    }
  }, [navigate]);

  // Load owner items for dropdown
  useEffect(() => {
    const loadOwnerItems = async () => {
      try {
        setItemsLoading(true);
        const items = await bookingsService.getOwnerItems();
        setOwnerItems(items);
      } catch (e) {
        // Not fatal — page can still work without item dropdown
        console.error(e);
      } finally {
        setItemsLoading(false);
      }
    };

    loadOwnerItems();
  }, []);

  const loadHistory = async (filters = {}) => {
    try {
      setError("");
      setLoading(true);
      const data = await bookingsService.getOwnerBookingHistory(filters);
      setRequests(data);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load booking history.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadHistory({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApplyFilters = (e) => {
    e.preventDefault();
    loadHistory({
      search: search.trim(),
      status: status || "",
      item_id: itemId || "",
      from: from || "",
      to: to || "",
    });
  };

  const onClearFilters = () => {
    setSearch("");
    setStatus("");
    setItemId("");
    setFrom("");
    setTo("");
    loadHistory({});
  };

  const counts = useMemo(() => {
    const c = { total: requests.length };
    for (const s of STATUS_OPTIONS) {
      if (!s) continue;
      c[s] = requests.filter((r) => r.status === s).length;
    }
    return c;
  }, [requests]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="fw-bold mb-1">📚 Owner Booking History</h2>
          <div className="text-muted">
            View all booking requests for tools you own (Pending/Approved/Rejected/CheckedOut/Returned/Overdue).
          </div>
        </div>

        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <form onSubmit={onApplyFilters}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Search (student id / name / email)</label>
                <input
                  className="form-control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. 200479073, jeet, jeet@uregina.ca"
                />
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label fw-semibold">Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s || "all"} value={s}>
                      {s ? s : "All"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Tool (owned)</label>
                <select
                  className="form-select"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  disabled={itemsLoading}
                >
                  <option value="">All tools</option>
                  {ownerItems.map((it) => (
                    <option key={it.item_id} value={it.item_id}>
                      {it.name}
                    </option>
                  ))}
                </select>
                {itemsLoading && <div className="small text-muted mt-1">Loading tools…</div>}
              </div>

              <div className="col-6 col-md-1">
                <label className="form-label fw-semibold">From</label>
                <input className="form-control" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>

              <div className="col-6 col-md-1">
                <label className="form-label fw-semibold">To</label>
                <input className="form-control" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>

              <div className="col-12 col-md-1 d-flex align-items-end gap-2">
                <button className="btn btn-primary w-100" type="submit">
                  Apply
                </button>
              </div>

              <div className="col-12 col-md-12 d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary" type="button" onClick={onClearFilters}>
                  Clear
                </button>
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={() =>
                    loadHistory({
                      search: search.trim(),
                      status: status || "",
                      item_id: itemId || "",
                      from: from || "",
                      to: to || "",
                    })
                  }
                >
                  Refresh
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Quick stats */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <span className="badge text-bg-dark">Total: {counts.total}</span>
        <span className="badge text-bg-secondary">Pending: {counts.Pending || 0}</span>
        <span className="badge text-bg-success">Approved: {counts.Approved || 0}</span>
        <span className="badge text-bg-danger">Rejected: {counts.Rejected || 0}</span>
        <span className="badge text-bg-info">CheckedOut: {counts.CheckedOut || 0}</span>
        <span className="badge text-bg-primary">Returned: {counts.Returned || 0}</span>
        <span className="badge text-bg-warning">Overdue: {counts.Overdue || 0}</span>
      </div>

      {/* Errors */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="text-muted">Loading booking history...</div>
          ) : requests.length === 0 ? (
            <div className="text-muted">No booking requests found for your tools.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Request ID</th>
                    <th>Tool</th>
                    <th>Borrower</th>
                    <th>Email</th>
                    <th>Student ID</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const borrowerName =
                      `${r.first_name || ""} ${r.last_name || ""}`.trim() ||
                      r.borrower_username ||
                      "Unknown";

                    const statusClass =
                      r.status === "Approved"
                        ? "text-bg-success"
                        : r.status === "Pending"
                        ? "text-bg-secondary"
                        : r.status === "Rejected"
                        ? "text-bg-danger"
                        : r.status === "CheckedOut"
                        ? "text-bg-info"
                        : r.status === "Returned"
                        ? "text-bg-primary"
                        : r.status === "Overdue"
                        ? "text-bg-warning"
                        : "text-bg-dark";

                    return (
                      <tr key={r.request_id}>
                        <td className="fw-semibold">{r.request_id}</td>
                        <td>
                          <div className="fw-semibold">{r.item_name}</div>
                          <div className="small text-muted">Item ID: {r.item_id}</div>
                        </td>
                        <td>{borrowerName}</td>
                        <td>{r.borrower_email || "-"}</td>
                        <td>{r.borrower_student_id || "-"}</td>
                        <td>{formatDateTime(r.requested_start)}</td>
                        <td>{formatDateTime(r.requested_end)}</td>
                        <td>
                          <span className={`badge ${statusClass}`}>{r.status}</span>
                        </td>
                        <td style={{ maxWidth: 260 }}>
                          <div className="small">
                            {r.rejectionReason ? (
                              <span className="text-danger">Rejection: {r.rejectionReason}</span>
                            ) : r.reason ? (
                              <span className="text-muted">{r.reason}</span>
                            ) : (
                              "-"
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="small text-muted mt-2">
                Tip: Use search to find a student by email, name, or student ID.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerBookingHistory;