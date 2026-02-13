// src/pages/RequestedBookings.jsx
import React, { useEffect, useState } from "react";
import { bookingsService, API_BASE } from "../services/api";

const RequestedBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // store rejection note per request_id
  const [notes, setNotes] = useState({});
  // controls which request is currently showing the rejection textarea
  const [rejectingId, setRejectingId] = useState(null);

  const fetchRequests = async () => {
    try {
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
      alert("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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
      alert("Request Approved!");
    } catch (err) {
      alert(err.message || "Failed to approve");
    }
  };

  const handleReject = async (requestId) => {
    const noteToSend = (notes[requestId] || "").trim();

    if (!noteToSend) {
      alert("Please enter a rejection reason before rejecting.");
      return;
    }

    try {
      await bookingsService.updateRequestStatus(requestId, "Rejected", noteToSend);
      await fetchRequests();
      setRejectingId(null);
      alert("Request Rejected!");
    } catch (err) {
      alert(err.message || "Failed to reject");
    }
  };

  // Checkout / Return
  const handleCheckout = async (requestId) => {
    try {
      await bookingsService.checkoutRequest(requestId);
      await fetchRequests();
      alert("Checked out successfully!");
    } catch (err) {
      alert(err.message || "Checkout failed");
    }
  };

  const handleReturn = async (requestId) => {
    try {
      await bookingsService.returnRequest(requestId);
      await fetchRequests();
      alert("Returned successfully!");
    } catch (err) {
      alert(err.message || "Return failed");
    }
  };

  const badgeClassForStatus = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return "bg-success";
    if (s === "pending") return "bg-warning text-dark";
    if (s === "checkedout") return "bg-primary";
    if (s === "returned") return "bg-secondary";
    if (s === "overdue") return "bg-danger";
    if (s === "rejected") return "bg-danger";
    return "bg-dark";
  };

  if (loading) {
    return (
      <div className="container-fluid px-4 py-4">
        Loading incoming requests...
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4">Incoming Borrow Requests</h2>

      {requests.length === 0 ? (
        <div className="alert alert-info text-center">No requests found.</div>
      ) : (
        <div className="row g-4">
          {requests.map((req) => {
            const status = req.status || "Pending";
            const studentName =
              req.borrower_name ||
              `${req.first_name || ""} ${req.last_name || ""}`.trim() ||
              "Student";

            const noteFromServer = req.rejectionReason || req.decision_note || "";

            return (
              <div key={req.request_id} className="col-md-6 col-lg-4">
                <div className="item-card shadow-sm">
                  <div className="img-frame">
                    <img
                      src={getImageUrl(req.image_url)}
                      alt={req.item_name || "Item image"}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/400x250?text=Image+Not+Found";
                      }}
                    />
                  </div>

                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{req.item_name}</h5>

                    {/* Cart group id (if requested via cart) */}
                    {req.request_group_id ? (
                      <div className="text-muted small mb-2">
                        <strong>Cart Group:</strong> #{req.request_group_id}
                      </div>
                    ) : null}

                    <p>
                      <strong>Student:</strong> {studentName}
                    </p>

                    <p>
                      <strong>From:</strong>{" "}
                      {req.requested_start ? new Date(req.requested_start).toLocaleString() : "—"}
                    </p>
                    <p>
                      <strong>To:</strong>{" "}
                      {req.requested_end ? new Date(req.requested_end).toLocaleString() : "—"}
                    </p>
                    <p>
                      <strong>Reason:</strong> {req.reason || "—"}
                    </p>

                    {/* lifecycle timestamps (optional display) */}
                    {req.checked_out_at && (
                      <p className="mb-1">
                        <strong>Checked out:</strong>{" "}
                        {new Date(req.checked_out_at).toLocaleString()}
                      </p>
                    )}
                    {req.returned_at && (
                      <p className="mb-1">
                        <strong>Returned:</strong>{" "}
                        {new Date(req.returned_at).toLocaleString()}
                      </p>
                    )}

                    {/* Reject textbox only if Pending and user clicked Reject */}
                    {status === "Pending" && rejectingId === req.request_id && (
                      <div className="mb-2">
                        <label className="form-label mb-1">
                          Rejection reason <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Explain why you are rejecting..."
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

                    {/* Show rejection note if rejected */}
                    {status !== "Pending" && noteFromServer && (
                      <div className="alert alert-info py-2 mt-2 mb-2">
                        <strong>Message sent:</strong> {noteFromServer}
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div className="mt-auto d-flex gap-2">
                      {status === "Pending" ? (
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
                      ) : status === "Approved" ? (
                        <button
                          onClick={() => handleCheckout(req.request_id)}
                          className="btn btn-primary btn-sm flex-fill"
                        >
                          Checkout
                        </button>
                      ) : status === "CheckedOut" || status === "Overdue" ? (
                        <button
                          onClick={() => handleReturn(req.request_id)}
                          className={`btn btn-sm flex-fill ${
                            status === "Overdue" ? "btn-danger" : "btn-warning"
                          }`}
                        >
                          Return
                        </button>
                      ) : (
                        <span
                          className={`badge w-100 py-3 fs-6 ${badgeClassForStatus(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      )}
                    </div>

                    {/* If not Pending and not Approved/CheckedOut/Overdue, show badge too */}
                    {status !== "Pending" && !["Approved", "CheckedOut", "Overdue"].includes(status) ? null : null}
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
