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

const statusMeta = {
  Pending: {
    cardClass: "border-warning-subtle bg-warning-subtle",
    badgeClass: "bg-warning-subtle text-warning-emphasis border border-warning-subtle",
  },
  Approved: {
    cardClass: "border-success-subtle bg-success-subtle",
    badgeClass: "bg-success-subtle text-success-emphasis border border-success-subtle",
  },
  Rejected: {
    cardClass: "border-danger-subtle bg-danger-subtle",
    badgeClass: "bg-danger-subtle text-danger-emphasis border border-danger-subtle",
  },
  CheckedOut: {
    cardClass: "border-info-subtle bg-info-subtle",
    badgeClass: "bg-info-subtle text-info-emphasis border border-info-subtle",
  },
  Returned: {
    cardClass: "border-primary-subtle bg-primary-subtle",
    badgeClass: "bg-primary-subtle text-primary-emphasis border border-primary-subtle",
  },
  Overdue: {
    cardClass: "border-danger-subtle bg-danger-subtle",
    badgeClass: "bg-danger-subtle text-danger-emphasis border border-danger-subtle",
  },
  Default: {
    cardClass: "border-light bg-white",
    badgeClass: "bg-light text-dark border",
  },
};

const getStatusClass = (status) => {
  return statusMeta[status]?.badgeClass || statusMeta.Default.badgeClass;
};

const getStatusCount = (requests, targetStatus) =>
  requests.filter((r) => String(r.status || "") === targetStatus).length;

const StatCard = ({ title, value, subtitle, tone = "Default" }) => {
  const meta = statusMeta[tone] || statusMeta.Default;

  return (
    <div className="col-12 col-sm-6 col-xl">
      <div
        className={`card h-100 border shadow-sm ${meta.cardClass}`}
        style={{ borderRadius: "18px" }}
      >
        <div className="card-body p-3 p-md-4">
          <div className="text-muted small fw-semibold text-uppercase mb-2">{title}</div>
          <div className="fw-bold" style={{ fontSize: "1.9rem", lineHeight: 1 }}>
            {value}
          </div>
          <div className="small text-muted mt-2">{subtitle}</div>
        </div>
      </div>
    </div>
  );
};

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
    return {
      total: requests.length,
      pending: getStatusCount(requests, "Pending"),
      approved: getStatusCount(requests, "Approved"),
      rejected: getStatusCount(requests, "Rejected"),
      checkedOut: getStatusCount(requests, "CheckedOut"),
      returned: getStatusCount(requests, "Returned"),
      overdue: getStatusCount(requests, "Overdue"),
    };
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
    <div
      className="container-fluid px-3 px-md-4 py-4"
      style={{ background: "#f8fafc", minHeight: "100vh" }}
    >
      <div className="mx-auto" style={{ maxWidth: "1600px" }}>
        {/* Header */}
        <div
          className="card border shadow-sm mb-4"
          style={{
            borderRadius: "20px",
            background: "#ffffff",
          }}
        >
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-4">
              <div>
                <div
                  className="d-inline-flex align-items-center px-3 py-1 mb-3"
                  style={{
                    borderRadius: "999px",
                    background: "#f1f5f9",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Booking Operations
                </div>

                <h1 className="fw-bold mb-2" style={{ color: "#0f172a" }}>
                  Booking History
                </h1>

                <p className="mb-0 text-muted" style={{ maxWidth: 700 }}>
                  {isAdmin
                    ? "View and manage all booking requests across the platform."
                    : "View booking history for tools you own and track their status."}
                </p>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary dashboard-btn"
                  onClick={onExportCsv}
                  disabled={loading || requests.length === 0}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          <StatCard title="Total Requests" value={counts.total} subtitle="All visible rows" />
          <StatCard title="Pending" value={counts.pending} subtitle="Awaiting action" tone="Pending" />
          <StatCard title="Approved" value={counts.approved} subtitle="Ready for next step" tone="Approved" />
          <StatCard title="Rejected" value={counts.rejected} subtitle="Declined requests" tone="Rejected" />
          <StatCard title="Checked Out" value={counts.checkedOut} subtitle="Currently out" tone="CheckedOut" />
          <StatCard title="Returned" value={counts.returned} subtitle="Completed bookings" tone="Returned" />
          <StatCard title="Overdue" value={counts.overdue} subtitle="Needs attention" tone="Overdue" />
        </div>

        {/* Filters */}
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: "24px", overflow: "hidden" }}
        >
          <div className="card-header bg-white border-0 p-4 pb-0">
            <div>
              <h5 className="fw-bold mb-1">Smart Filters</h5>
              <div className="text-muted small">
                Narrow results by borrower, status, tool, or date range.
              </div>
            </div>
          </div>

          <div className="card-body p-4">
            <form onSubmit={onApplyFilters}>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-xl-4">
                  <label className="form-label fw-semibold text-dark">Search</label>
                  <input
                    className="form-control dashboard-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by student ID, name, or email"
                  />
                </div>

                <div className="col-12 col-md-6 col-xl-2">
                  <label className="form-label fw-semibold text-dark">Status</label>
                  <select
                    className="form-select dashboard-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s || "all"} value={s}>
                        {s ? s : "All statuses"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6 col-xl-3">
                  <label className="form-label fw-semibold text-dark">
                    {isAdmin ? "Tool" : "Owned Tool"}
                  </label>
                  <select
                    className="form-select dashboard-input"
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

                <div className="col-12 col-sm-6 col-xl-1 date-col">
                  <label className="form-label fw-semibold text-dark">From</label>
                  <input
                    className="form-control dashboard-input"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>

                <div className="col-12 col-sm-6 col-xl-1 date-col">
                  <label className="form-label fw-semibold text-dark">To</label>
                  <input
                    className="form-control dashboard-input"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>

                <div className="col-12 col-xl-auto ms-xl-auto">
                  <div className="d-flex gap-2 history-filter-actions">
                    <button
                      className="btn btn-outline-secondary dashboard-btn"
                      type="button"
                      onClick={onClearFilters}
                    >
                      Clear
                    </button>

                    <button className="btn btn-primary dashboard-btn" type="submit">
                      Apply Filters
                    </button>
                  </div>
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
            style={{ borderRadius: "18px" }}
          >
            {error}
          </div>
        )}

        {/* Table */}
        <div
          className="card border-0 shadow-sm"
          style={{ borderRadius: "24px", overflow: "hidden" }}
        >
          <div className="card-header bg-white border-0 p-4 pb-0">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <h5 className="fw-bold mb-1">History Records</h5>
                <div className="text-muted small">
                  Export downloads only the rows currently shown in the table.
                </div>
              </div>

              <div className="small text-muted">
                Showing <span className="fw-semibold text-dark">{requests.length}</span> record{requests.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="p-4 text-muted">Loading booking history...</div>
            ) : requests.length === 0 ? (
              <div className="p-5 text-center">
                <div className="fw-semibold fs-5 mb-2">No records found</div>
                <div className="text-muted">
                  {isAdmin
                    ? "No booking requests found in the system."
                    : "No booking requests found for your tools."}
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th className="border-0 px-4 py-3 text-muted fw-semibold">Request ID</th>
                      <th className="border-0 px-3 py-3 text-muted fw-semibold">Tool</th>
                      <th className="border-0 px-3 py-3 text-muted fw-semibold">Borrower</th>
                      <th className="border-0 px-3 py-3 text-muted fw-semibold">Email</th>
                      <th className="border-0 px-3 py-3 text-muted fw-semibold">Student ID</th>
                      <th className="border-0 px-3 py-3 text-muted fw-semibold">Start</th>
                      <th className="border-0 px-3 py-3 text-muted fw-semibold">End</th>
                      <th className="border-0 px-3 py-3 text-muted fw-semibold">Status</th>
                      <th className="border-0 px-3 py-3 text-muted fw-semibold">Note</th>
                      <th className="border-0 px-3 py-3 text-muted fw-semibold">Actions</th>
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
                          <td className="px-4 py-3 fw-semibold text-dark">{r.request_id}</td>

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
                              className={`badge px-3 py-2 fw-semibold ${getStatusClass(r.status)}`}
                              style={{
                                borderRadius: "999px",
                                minWidth: "110px",
                              }}
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
                         
                          <td className="px-3 py-3">
                            {(r.status === "Returned" || r.status === "CheckedOut" || r.status === "Overdue") ? (
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                style={{ borderRadius: "10px", fontWeight: 500, whiteSpace: "nowrap" }}
                                onClick={() =>
                                  navigate("/edit-condition-images", {
                                    state: {
                                      requestId: r.request_id,
                                      mode: "view",
                                    },
                                  })
                                }
                              >
                                View Images
                              </button>
                              ) : (
                                 <span className="text-muted small">-</span>
                            )}
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

        <style>{`
          .dashboard-input {
            min-height: 48px;
            border-radius: 14px;
            border: 1px solid #dbe3ee;
            background: #ffffff;
            box-shadow: none;
            transition: all 0.18s ease;
          }

          .dashboard-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.12);
          }

          .dashboard-btn {
            min-height: 48px;
            padding: 0 20px;
            border-radius: 14px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: none;
            white-space: nowrap;
          }

          .date-col {
            min-width: 150px;
          }

          .history-filter-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: nowrap;
          }

          .history-filter-actions .dashboard-btn {
            min-width: 130px;
          }

          .table tbody tr:hover {
            background: #f8fbff;
          }

          .table tbody tr td {
            border-color: #eef2f7;
          }

          .table thead th {
            white-space: nowrap;
          }

          @media (max-width: 1199.98px) {
            .date-col {
              min-width: 0;
            }

            .history-filter-actions {
              width: 100%;
              justify-content: stretch;
              flex-wrap: wrap;
            }

            .history-filter-actions .dashboard-btn {
              flex: 1 1 0;
              min-width: 0;
            }
          }

          @media (max-width: 768px) {
            .dashboard-btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OwnerBookingHistory;