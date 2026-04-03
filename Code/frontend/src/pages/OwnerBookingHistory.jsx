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

// CSV helpers
const csvEscape = (value) => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filename, rows) => {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const getStatusClass = (status) => {
  switch (status) {
    case "Approved":
      return "bg-success-subtle text-success border border-success-subtle";
    case "Pending":
      return "bg-secondary-subtle text-secondary border border-secondary-subtle";
    case "Rejected":
      return "bg-danger-subtle text-danger border border-danger-subtle";
    case "CheckedOut":
      return "bg-info-subtle text-info border border-info-subtle";
    case "Returned":
      return "bg-primary-subtle text-primary border border-primary-subtle";
    case "Overdue":
      return "bg-warning-subtle text-warning border border-warning-subtle";
    default:
      return "bg-dark-subtle text-dark border";
  }
};

const StatCard = ({ label, value, extraClass = "" }) => (
  <div className="col-6 col-md-4 col-xl">
    <div
      className={`card h-100 border-0 shadow-sm ${extraClass}`}
      style={{ borderRadius: "16px" }}
    >
      <div className="card-body py-3">
        <div className="small text-muted fw-semibold text-uppercase">{label}</div>
        <div className="fs-4 fw-bold mt-1">{value}</div>
      </div>
    </div>
  </div>
);

const OwnerBookingHistory = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [itemsLoading, setItemsLoading] = useState(true);
  const [ownerItems, setOwnerItems] = useState([]);

  const [isAdmin, setIsAdmin] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [itemId, setItemId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Data
  const [requests, setRequests] = useState([]);

  // Guard + role
  useEffect(() => {
    const user = getUserFromStorage();
    const r = String(user?.user_type || "").toLowerCase();
    setIsAdmin(r === "admin");

    const allowed = r === "faculty" || r === "admin";
    if (!allowed) {
      alert("Not allowed. This page is for Faculty/Admin only.");
      navigate("/home");
    }
  }, [navigate]);

  // Load items for dropdown
  useEffect(() => {
    const loadItems = async () => {
      try {
        setItemsLoading(true);

        let items = [];
        const user = getUserFromStorage();
        const r = String(user?.user_type || "").toLowerCase();

        if (r === "admin" && typeof bookingsService.getAllItemsForHistory === "function") {
          items = await bookingsService.getAllItemsForHistory();
        } else {
          items = await bookingsService.getOwnerItems();
        }

        setOwnerItems(Array.isArray(items) ? items : []);
      } catch (e) {
        console.error(e);
      } finally {
        setItemsLoading(false);
      }
    };

    loadItems();
  }, []);

  const loadHistory = async (filters = {}) => {
    try {
      setError("");
      setLoading(true);

      const payload = {
        ...filters,
        admin_all: isAdmin ? "1" : "0",
      };

      const data = await bookingsService.getOwnerBookingHistory(payload);
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load booking history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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

  const onExportCsv = () => {
    if (!requests.length) {
      alert("Nothing to export (no rows in the table).");
      return;
    }

    const header = [
      "Request ID",
      "Item ID",
      "Tool",
      "Borrower",
      "Email",
      "Student ID",
      "Start",
      "End",
      "Status",
      "Reason",
      "Rejection Reason",
    ];

    const rows = requests.map((r) => {
      const borrowerName =
        `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.borrower_username || "Unknown";

      return [
        r.request_id ?? "",
        r.item_id ?? "",
        r.item_name ?? "",
        borrowerName,
        r.borrower_email ?? "",
        r.borrower_student_id ?? "",
        formatDateTime(r.requested_start),
        formatDateTime(r.requested_end),
        r.status ?? "",
        r.reason ?? "",
        r.rejectionReason ?? "",
      ];
    });

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`booking-history-${stamp}.csv`, [header, ...rows]);
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      {/* Header */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{
          borderRadius: "20px",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div>
              <div className="d-inline-flex align-items-center px-3 py-1 rounded-pill bg-primary-subtle text-primary fw-semibold small mb-3">
                Booking Management
              </div>
              <h2 className="fw-bold mb-2" style={{ letterSpacing: "-0.5px" }}>
                Booking History
              </h2>
              <div className="text-muted" style={{ maxWidth: "760px" }}>
                {isAdmin
                  ? "Admin view showing all booking requests across the system."
                  : "View all booking requests for tools you own, including Pending, Approved, Rejected, Checked Out, Returned, and Overdue records."}
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <button
                className="btn btn-success px-4 fw-semibold shadow-sm"
                onClick={onExportCsv}
                disabled={loading || requests.length === 0}
                style={{ borderRadius: "12px" }}
              >
                ⬇ Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="Pending" value={counts.Pending || 0} />
        <StatCard label="Approved" value={counts.Approved || 0} />
        <StatCard label="Rejected" value={counts.Rejected || 0} />
        <StatCard label="Checked Out" value={counts.CheckedOut || 0} />
        <StatCard label="Returned" value={counts.Returned || 0} />
        <StatCard label="Overdue" value={counts.Overdue || 0} />
      </div>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "20px", overflow: "hidden" }}
      >
        <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
          <h5 className="fw-bold mb-1">Filters</h5>
          <div className="text-muted small">Refine the booking history without changing any data.</div>
        </div>

        <div className="card-body p-4">
          <form onSubmit={onApplyFilters}>
            <div className="row g-3">
              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Search</label>
                <input
                  className="form-control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Student ID, name, or email"
                  style={{ borderRadius: "12px", minHeight: "46px" }}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ borderRadius: "12px", minHeight: "46px" }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s || "all"} value={s}>
                      {s ? s : "All"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label fw-semibold">
                  {isAdmin ? "Tool (any)" : "Tool (owned)"}
                </label>
                <select
                  className="form-select"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  disabled={itemsLoading}
                  style={{ borderRadius: "12px", minHeight: "46px" }}
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

              <div className="col-6 col-lg-1">
                <label className="form-label fw-semibold">From</label>
                <input
                  className="form-control"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  style={{ borderRadius: "12px", minHeight: "46px" }}
                />
              </div>

              <div className="col-6 col-lg-1">
                <label className="form-label fw-semibold">To</label>
                <input
                  className="form-control"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  style={{ borderRadius: "12px", minHeight: "46px" }}
                />
              </div>

              <div className="col-12 d-flex flex-wrap justify-content-end gap-2 pt-2">
                <button
                  className="btn btn-outline-secondary px-4"
                  type="button"
                  onClick={onClearFilters}
                  style={{ borderRadius: "12px" }}
                >
                  Clear
                </button>

                <button
                  className="btn btn-outline-primary px-4"
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
                  style={{ borderRadius: "12px" }}
                >
                  Refresh
                </button>

                <button
                  className="btn btn-primary px-4 fw-semibold"
                  type="submit"
                  style={{ borderRadius: "12px" }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="alert alert-danger border-0 shadow-sm"
          role="alert"
          style={{ borderRadius: "14px" }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "20px", overflow: "hidden" }}
      >
        <div className="card-header bg-white border-0 px-4 pt-4 pb-0">
          <h5 className="fw-bold mb-1">History Records</h5>
          <div className="text-muted small">
            Search by student email, name, or student ID. Export CSV downloads only the currently visible rows.
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-muted">Loading booking history...</div>
          ) : requests.length === 0 ? (
            <div className="p-4 text-muted">
              {isAdmin ? "No booking requests found in the system." : "No booking requests found for your tools."}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead style={{ backgroundColor: "#f8fafc" }}>
                  <tr>
                    <th className="px-4 py-3 text-muted fw-semibold border-0">Request ID</th>
                    <th className="px-3 py-3 text-muted fw-semibold border-0">Tool</th>
                    <th className="px-3 py-3 text-muted fw-semibold border-0">Borrower</th>
                    <th className="px-3 py-3 text-muted fw-semibold border-0">Email</th>
                    <th className="px-3 py-3 text-muted fw-semibold border-0">Student ID</th>
                    <th className="px-3 py-3 text-muted fw-semibold border-0">Start</th>
                    <th className="px-3 py-3 text-muted fw-semibold border-0">End</th>
                    <th className="px-3 py-3 text-muted fw-semibold border-0">Status</th>
                    <th className="px-3 py-3 text-muted fw-semibold border-0">Note</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((r) => {
                    const borrowerName =
                      `${r.first_name || ""} ${r.last_name || ""}`.trim() ||
                      r.borrower_username ||
                      "Unknown";

                    return (
                      <tr key={r.request_id}>
                        <td className="px-4 py-3 fw-semibold">{r.request_id}</td>

                        <td className="px-3 py-3">
                          <div className="fw-semibold text-dark">{r.item_name}</div>
                          <div className="small text-muted">Item ID: {r.item_id}</div>
                        </td>

                        <td className="px-3 py-3">{borrowerName}</td>
                        <td className="px-3 py-3">{r.borrower_email || "-"}</td>
                        <td className="px-3 py-3">{r.borrower_student_id || "-"}</td>
                        <td className="px-3 py-3">{formatDateTime(r.requested_start)}</td>
                        <td className="px-3 py-3">{formatDateTime(r.requested_end)}</td>

                        <td className="px-3 py-3">
                          <span
                            className={`badge fw-semibold px-3 py-2 ${getStatusClass(r.status)}`}
                            style={{ borderRadius: "999px" }}
                          >
                            {r.status}
                          </span>
                        </td>

                        <td className="px-3 py-3" style={{ maxWidth: 280 }}>
                          <div className="small">
                            {r.rejectionReason ? (
                              <span className="text-danger fw-semibold">
                                Rejection: {r.rejectionReason}
                              </span>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerBookingHistory;