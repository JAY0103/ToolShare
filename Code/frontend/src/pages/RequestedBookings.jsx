import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingsService, API_BASE } from "../services/api";

const RequestedBookings = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userType = String(user?.user_type || "").toLowerCase();

  // Faculty/Admin can view incoming requests
  const canViewIncoming = userType === "faculty" || userType === "admin";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // store rejection note per request_id
  const [notes, setNotes] = useState({});
  // controls which request is currently showing the rejection textarea
  const [rejectingId, setRejectingId] = useState(null);

  // status filter
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const data = await bookingsService.getRequestedBookings();
      const list = Array.isArray(data) ? data : [];
      setRequests(list);

      // preload decision notes if backend already has them
      const initialNotes = {};
      list.forEach((r) => {
        const existingNote = r.rejectionReason || r.decision_note || "";
        if (existingNote) initialNotes[r.request_id] = existingNote;
      });
      setNotes((prev) => ({ ...initialNotes, ...prev }));
    } catch (err) {
      alert(err?.message || "Failed to load incoming requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewIncoming) fetchRequests();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getImageUrl = (p) => {
    if (!p) return "https://via.placeholder.com/400x250?text=No+Image";
    if (p.startsWith("http")) return p;
    return `${API_BASE}${p}`;
  };

  const handleApprove = async (requestId) => {
    try {
      await bookingsService.updateRequestStatus(requestId, "Approved", "");
      await fetchRequests();
      setRejectingId(null);
      alert("Request approved!");
    } catch (err) {
      alert(err?.message || "Failed to approve");
    }
  };

  const handleReject = async (requestId) => {
    const noteToSend = (notes[requestId] || "").trim();

    if (!noteToSend) {
      alert("Please enter a reason before rejecting.");
      return;
    }

    try {
      await bookingsService.updateRequestStatus(requestId, "Rejected", noteToSend);
      await fetchRequests();
      setRejectingId(null);
      alert("Request rejected!");
    } catch (err) {
      alert(err?.message || "Failed to reject");
    }
  };

  const badgeClassForStatus = (status) => {
    const s = String(status || "").toLowerCase().trim();

    if (s === "approved") return "bg-success-subtle text-success border border-success-subtle";
    if (s === "pending") return "bg-warning-subtle text-warning border border-warning-subtle";
    if (s === "checkedout" || s === "checked out")
      return "bg-primary-subtle text-primary border border-primary-subtle";
    if (s === "returned" || s === "return")
      return "bg-secondary-subtle text-secondary border border-secondary-subtle";
    if (s === "overdue") return "bg-danger-subtle text-danger border border-danger-subtle";
    if (s === "rejected") return "bg-danger-subtle text-danger border border-danger-subtle";
    if (s === "cancelled" || s === "canceled")
      return "bg-secondary-subtle text-secondary border border-secondary-subtle";

    return "bg-dark text-white";
  };

  const normalizeStatus = (status) => {
    const s = String(status || "").toLowerCase().trim();

    if (s === "checked out") return "checkedout";
    if (s === "return") return "returned";
    if (s === "canceled") return "cancelled";

    return s;
  };

  const filteredRequests = useMemo(() => {
    return (requests || [])
      .filter((r) => {
        const status = normalizeStatus(r.status || "pending");
        return statusFilter === "all" ? true : status === statusFilter;
      })
      .sort((a, b) => {
        const aT = new Date(a.requested_start || a.created_at || a.updated_at || 0).getTime();
        const bT = new Date(b.requested_start || b.created_at || b.updated_at || 0).getTime();
        return (bT || 0) - (aT || 0);
      });
  }, [requests, statusFilter]);

  const formatFilterLabel = (value) => {
    if (value === "all") return "All Requests";
    if (value === "checkedout") return "Checked Out Requests";
    if (value === "cancelled") return "Cancelled Requests";
    return `${value.charAt(0).toUpperCase() + value.slice(1)} Requests`;
  };

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "checkedout", label: "Checked Out" },
    { value: "returned", label: "Returned" },
    { value: "overdue", label: "Overdue" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" },
  ];

  if (!canViewIncoming) {
    return (
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="alert alert-warning rounded-4 shadow-sm border-0">
          You don’t have permission to view incoming requests.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="text-center">
            <div className="spinner-border text-success mb-3" role="status" />
            <div className="text-muted fw-semibold">Loading incoming requests...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="bg-white rounded-4 shadow-sm border p-3 p-md-4 mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#1f2937" }}>
              Incoming Requests
            </h2>
            <div className="text-muted">
              Showing <strong>{formatFilterLabel(statusFilter)}</strong>
            </div>
          </div>

          <div className="text-muted small">
            Total: <strong>{filteredRequests.length}</strong>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4 shadow-sm border p-3 p-md-4 mb-4">
        <div className="d-flex flex-wrap gap-2">
          {filterOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`btn rounded-pill px-3 ${
                statusFilter === item.value ? "btn-dark" : "btn-outline-secondary"
              }`}
              onClick={() => setStatusFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-4 shadow-sm border p-5 text-center">
          <div className="mb-2 fs-5 fw-semibold text-dark">No requests found</div>
          <div className="text-muted">There are no requests available for this filter.</div>
        </div>
      ) : (
        <div className="row g-4">
          {filteredRequests.map((req) => {
            const rawStatus = req.status || "Pending";
            const status = normalizeStatus(rawStatus);

            const requesterName =
              req.borrower_name ||
              `${req.first_name || ""} ${req.last_name || ""}`.trim() ||
              "Requester";

            const noteFromServer = req.rejectionReason || req.decision_note || "";

            return (
              <div key={req.request_id} className="col-12 col-md-6 col-xl-4">
                <div
                  className="card border-0 shadow-sm h-100 rounded-4 overflow-hidden"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  <div
                    className="position-relative"
                    style={{
                      height: "220px",
                      background: "linear-gradient(135deg, #f8f9fa, #eef2f7)",
                    }}
                  >
                    <img
                      src={getImageUrl(req.image_url)}
                      alt={req.item_name || "Tool image"}
                      className="w-100 h-100"
                      style={{ objectFit: "contain", padding: "12px" }}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/400x250?text=Image+Not+Found";
                      }}
                    />

                    <div className="position-absolute top-0 end-0 p-3">
                      <span className={`badge rounded-pill px-3 py-2 ${badgeClassForStatus(rawStatus)}`}>
                        {rawStatus}
                      </span>
                    </div>
                  </div>

                  <div className="card-body d-flex flex-column p-4">
                    <div className="mb-3">
                      <h5 className="fw-bold mb-1 text-dark">{req.item_name}</h5>
                      {req.request_group_id ? (
                        <div className="text-muted small">
                          Basket Group: <strong>#{req.request_group_id}</strong>
                        </div>
                      ) : null}
                    </div>

                    <div className="mb-3">
                      <div className="mb-2">
                        <span className="text-muted small d-block">Requester</span>
                        <span className="fw-semibold text-dark">{requesterName}</span>
                      </div>

                      <div className="mb-2">
                        <span className="text-muted small d-block">From</span>
                        <span className="text-dark">
                          {req.requested_start
                            ? new Date(req.requested_start).toLocaleString()
                            : "—"}
                        </span>
                      </div>

                      <div className="mb-2">
                        <span className="text-muted small d-block">To</span>
                        <span className="text-dark">
                          {req.requested_end
                            ? new Date(req.requested_end).toLocaleString()
                            : "—"}
                        </span>
                      </div>

                      <div className="mb-2">
                        <span className="text-muted small d-block">Reason</span>
                        <span className="text-dark">{req.reason || "—"}</span>
                      </div>

                      {req.checked_out_at && (
                        <div className="mb-2">
                          <span className="text-muted small d-block">Checked out</span>
                          <span className="text-dark">
                            {new Date(req.checked_out_at).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {req.returned_at && (
                        <div className="mb-2">
                          <span className="text-muted small d-block">Returned</span>
                          <span className="text-dark">
                            {new Date(req.returned_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {status === "pending" && rejectingId === req.request_id && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold mb-1">
                          Rejection reason <span className="text-danger">*</span>
                        </label>
                        <div className="small text-muted mb-2">
                          This message will be sent to the requester.
                        </div>
                        <textarea
                          className="form-control rounded-3"
                          rows={3}
                          placeholder="Example: Tool is needed for another lab session during this time…"
                          value={notes[req.request_id] || ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [req.request_id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}

                    {status !== "pending" && noteFromServer && (
                      <div className="alert alert-light border rounded-3 py-2 px-3 mt-1 mb-3">
                        <strong>Message to requester:</strong> {noteFromServer}
                      </div>
                    )}

                    <div className="mt-auto pt-2">
                      <div className="d-grid gap-2">
                        {status === "pending" ? (
                          rejectingId === req.request_id ? (
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => handleReject(req.request_id)}
                                className="btn btn-danger flex-fill rounded-3"
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => setRejectingId(null)}
                                className="btn btn-outline-secondary flex-fill rounded-3"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => handleApprove(req.request_id)}
                                className="btn btn-success flex-fill rounded-3"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectingId(req.request_id)}
                                className="btn btn-outline-danger flex-fill rounded-3"
                              >
                                Reject
                              </button>
                            </div>
                          )
                        ) : status === "approved" ? (
                          <button
                            onClick={() =>
                              navigate("/edit-condition-images", {
                                state: {
                                  requestId: req.request_id,
                                  mode: "checkout",
                                },
                              })
                            }
                            className="btn btn-primary rounded-3"
                          >
                            Check Out
                          </button>
                        ) : status === "checkedout" || status === "overdue" ? (
                          <button
                            onClick={() =>
                              navigate("/edit-condition-images", {
                                state: {
                                  requestId: req.request_id,
                                  mode: "return",
                                },
                              })
                            }
                            className={`btn rounded-3 ${
                              status === "overdue" ? "btn-danger" : "btn-warning"
                            }`}
                          >
                            Return
                          </button>
                        ) : (
                          <button className="btn btn-outline-secondary rounded-3" disabled>
                            No actions available
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestedBookings;