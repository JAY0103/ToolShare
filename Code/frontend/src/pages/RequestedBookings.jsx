// src/pages/RequestedBookings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { bookingsService, API_BASE } from "../services/api";

const RECENT_DAYS = 15;

// Normalize statuses to lowercase for comparisons
const OPEN_STATUSES = new Set(["pending", "approved", "checkedout", "overdue"]);

const RequestedBookings = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userType = String(user?.user_type || "").toLowerCase();

  // Faculty/Admin can view incoming requests
  // (Assumption: "tool owner" is Faculty; Admin always can)
  const canViewIncoming = userType === "faculty" || userType === "admin";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // store rejection note per request_id
  const [notes, setNotes] = useState({});
  // controls which request is currently showing the rejection textarea
  const [rejectingId, setRejectingId] = useState(null);

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

      // Debug (uncomment if needed)
      // console.log("incoming requests:", list);
      // console.log("statuses:", list.map((r) => r.status));
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

  // Check out / Return
  const handleCheckout = async (requestId) => {
    try {
      await bookingsService.checkoutRequest(requestId);
      await fetchRequests();
      alert("Checked out successfully!");
    } catch (err) {
      alert(err?.message || "Check out failed");
    }
  };

  const handleReturn = async (requestId) => {
    try {
      await bookingsService.returnRequest(requestId);
      await fetchRequests();
      alert("Returned successfully!");
    } catch (err) {
      alert(err?.message || "Return failed");
    }
  };

  const badgeClassForStatus = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "approved") return "bg-success";
    if (s === "pending") return "bg-warning text-dark";
    if (s === "checkedout") return "bg-primary";
    if (s === "returned") return "bg-secondary";
    if (s === "overdue") return "bg-danger";
    if (s === "rejected") return "bg-danger";
    if (s === "cancelled" || s === "canceled") return "bg-secondary";
    return "bg-dark";
  };

  // Filter: only open + recent
  const filteredRequests = useMemo(() => {
    const now = Date.now();
    const cutoff = now - RECENT_DAYS * 24 * 60 * 60 * 1000;

    const toTime = (d) => {
      const t = new Date(d).getTime();
      return Number.isFinite(t) ? t : null;
    };

    return (requests || [])
      .filter((r) => {
        const status = String(r.status || "Pending").toLowerCase();
        if (!OPEN_STATUSES.has(status)) return false;

        // pick a reasonable "recency" timestamp
        const candidate =
          toTime(r.requested_start) ??
          toTime(r.created_at) ??
          toTime(r.updated_at) ??
          toTime(r.requested_end);

        // if backend doesn't send any date fields, keep it
        if (!candidate) return true;

        return candidate >= cutoff;
      })
      .sort((a, b) => {
        const aT = new Date(a.requested_start || a.created_at || a.updated_at || 0).getTime();
        const bT = new Date(b.requested_start || b.created_at || b.updated_at || 0).getTime();
        return (bT || 0) - (aT || 0);
      });
  }, [requests]);

  if (!canViewIncoming) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="alert alert-warning">
          You don’t have permission to view incoming requests.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="container-fluid px-4 py-4">Loading incoming requests...</div>;
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <h2 className="fw-bold mb-2">Incoming Requests</h2>
          <div className="text-muted mb-4">
            Showing <strong>open</strong> requests from the last <strong>{RECENT_DAYS}</strong> days.
          </div>
        </div>

        <button onClick={fetchRequests} className="btn btn-outline-primary btn-sm">
          Refresh
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="alert alert-info text-center">No recent open incoming requests found.</div>
      ) : (
        <div className="row g-4">
          {filteredRequests.map((req) => {
            const rawStatus = req.status || "Pending";
            const status = String(rawStatus).toLowerCase();

            const requesterName =
              req.borrower_name ||
              `${req.first_name || ""} ${req.last_name || ""}`.trim() ||
              "Requester";

            const noteFromServer = req.rejectionReason || req.decision_note || "";

            return (
              <div key={req.request_id} className="col-md-6 col-lg-4">
                <div className="item-card shadow-sm">
                  <div className="img-frame">
                    <img
                      src={getImageUrl(req.image_url)}
                      alt={req.item_name || "Tool image"}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/400x250?text=Image+Not+Found";
                      }}
                    />
                  </div>

                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <h5 className="card-title mb-2">{req.item_name}</h5>
                      <span className={`badge ${badgeClassForStatus(rawStatus)}`}>{rawStatus}</span>
                    </div>

                    {req.request_group_id ? (
                      <div className="text-muted small mb-2">
                        <strong>Basket Group:</strong> #{req.request_group_id}
                      </div>
                    ) : null}

                    <p className="mb-1">
                      <strong>Requester:</strong> {requesterName}
                    </p>

                    <p className="mb-1">
                      <strong>From:</strong>{" "}
                      {req.requested_start ? new Date(req.requested_start).toLocaleString() : "—"}
                    </p>
                    <p className="mb-1">
                      <strong>To:</strong>{" "}
                      {req.requested_end ? new Date(req.requested_end).toLocaleString() : "—"}
                    </p>

                    <p className="mb-2">
                      <strong>Reason:</strong> {req.reason || "—"}
                    </p>

                    {req.checked_out_at && (
                      <p className="mb-1">
                        <strong>Checked out:</strong>{" "}
                        {new Date(req.checked_out_at).toLocaleString()}
                      </p>
                    )}
                    {req.returned_at && (
                      <p className="mb-1">
                        <strong>Returned:</strong> {new Date(req.returned_at).toLocaleString()}
                      </p>
                    )}

                    {/* Rejection textarea */}
                    {status === "pending" && rejectingId === req.request_id && (
                      <div className="mb-2">
                        <label className="form-label mb-1">
                          Rejection reason <span className="text-danger">*</span>
                        </label>
                        <div className="small text-muted mb-1">
                          This message will be sent to the requester.
                        </div>
                        <textarea
                          className="form-control"
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

                    {/* Note from server (after decision) */}
                    {status !== "pending" && noteFromServer && (
                      <div className="alert alert-info py-2 mt-2 mb-2">
                        <strong>Message to requester:</strong> {noteFromServer}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto d-flex gap-2">
                      {status === "pending" ? (
                        rejectingId === req.request_id ? (
                          <>
                            <button
                              onClick={() => handleReject(req.request_id)}
                              className="btn btn-danger btn-sm flex-fill"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => setRejectingId(null)}
                              className="btn btn-outline-secondary btn-sm flex-fill"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(req.request_id)}
                              className="btn btn-success btn-sm flex-fill"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(req.request_id)}
                              className="btn btn-danger btn-sm flex-fill"
                            >
                              Reject
                            </button>
                          </>
                        )
                      ) : status === "approved" ? (
                        <button
                          onClick={() => handleCheckout(req.request_id)}
                          className="btn btn-primary btn-sm flex-fill"
                        >
                          Check Out
                        </button>
                      ) : status === "checkedout" || status === "overdue" ? (
                        <button
                          onClick={() => handleReturn(req.request_id)}
                          className={`btn btn-sm flex-fill ${
                            status === "overdue" ? "btn-danger" : "btn-warning"
                          }`}
                        >
                          Return
                        </button>
                      ) : (
                        <button className="btn btn-outline-secondary btn-sm flex-fill" disabled>
                          No actions available
                        </button>
                      )}
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