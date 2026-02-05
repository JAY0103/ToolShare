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
        if (r.decision_note) initialNotes[r.request_id] = r.decision_note;
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

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x250?text=No+Image";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };

  const handleApprove = async (requestId) => {
    try {
      await bookingsService.updateRequestStatus(requestId, "Approved", "");
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === requestId
            ? { ...r, status: "Approved", decision_note: null }
            : r
        )
      );
      setRejectingId(null);
      alert("Request Approved!");
    } catch (err) {
      alert(err.message || "Failed to approve");
    }
  };

  const handleReject = async (requestId) => {
    const noteToSend = (notes[requestId] || "").trim();

    // require note when rejecting
    if (!noteToSend) {
      alert("Please enter a rejection reason before rejecting.");
      return;
    }

    try {
      await bookingsService.updateRequestStatus(requestId, "Rejected", noteToSend);
      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === requestId
            ? { ...r, status: "Rejected", decision_note: noteToSend }
            : r
        )
      );
      setRejectingId(null);
      alert("Request Rejected!");
    } catch (err) {
      alert(err.message || "Failed to reject");
    }
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
        <div className="alert alert-info text-center">No pending requests.</div>
      ) : (
        <div className="row g-4">
          {requests.map((req) => (
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

                  <p>
                    <strong>Student:</strong>{" "}
                    {req.borrower_name ||
                      `${req.first_name || ""} ${req.last_name || ""}`.trim()}
                  </p>

                  <p>
                    <strong>From:</strong>{" "}
                    {new Date(req.requested_start).toLocaleString()}
                  </p>
                  <p>
                    <strong>To:</strong>{" "}
                    {new Date(req.requested_end).toLocaleString()}
                  </p>
                  <p>
                    <strong>Reason:</strong> {req.reason || "—"}
                  </p>

                  {/* Only show textbox AFTER faculty clicks Reject (and still pending) */}
                  {req.status === "Pending" && rejectingId === req.request_id && (
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

                  {/* If already processed and has a note, show it */}
                  {req.status !== "Pending" && req.decision_note && (
                    <div className="alert alert-info py-2 mt-2 mb-2">
                      <strong>Message sent:</strong> {req.decision_note}
                    </div>
                  )}

                  <div className="mt-auto d-flex gap-2">
                    {req.status === "Pending" ? (
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
                    ) : (
                      <span
                        className={`badge w-100 py-3 fs-6 ${
                          (req.status || "").toLowerCase() === "approved"
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestedBookings;
