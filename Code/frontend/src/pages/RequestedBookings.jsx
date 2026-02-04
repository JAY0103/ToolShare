// src/pages/RequestedBookings.jsx
import React, { useEffect, useState } from "react";
import { bookingsService, API_BASE } from "../services/api";

const RequestedBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // store decision note per request_id
  const [notes, setNotes] = useState({});

  const fetchRequests = async () => {
    try {
      const data = await bookingsService.getRequestedBookings();
      const list = Array.isArray(data) ? data : [];
      setRequests(list);

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

  const handleStatus = async (requestId, status) => {
    try {
      const noteToSend = status === "Rejected" ? (notes[requestId] || "").trim() : "";

      await bookingsService.updateRequestStatus(requestId, status, noteToSend);

      setRequests((prev) =>
        prev.map((r) =>
          r.request_id === requestId
            ? { ...r, status, decision_note: status === "Rejected" ? noteToSend : null }
            : r
        )
      );

      alert(`Request ${status}!`);
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/300x200";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };

  if (loading)
    return (
      <div className="container-fluid px-4 py-4">
        Loading incoming requests...
      </div>
    );

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4">Incoming Borrow Requests</h2>

      {requests.length === 0 ? (
        <div className="alert alert-info text-center">No pending requests.</div>
      ) : (
        <div className="row g-4">
          {requests.map((req) => (
            <div key={req.request_id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <img
                  src={getImageUrl(req.image_url)}
                  className="card-img-top"
                  alt={req.item_name}
                  style={{ height: "180px", objectFit: "cover" }}
                />

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
                    <strong>Reason:</strong> {req.reason}
                  </p>

                  {/* Decision note textarea (useful mainly for Reject) */}
                  {req.status === "Pending" && (
                    <div className="mb-2">
                      <label className="form-label mb-1">
                        Message to student (optional)
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Explain why you are rejecting, or give next steps..."
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
                      <>
                        <button
                          onClick={() => handleStatus(req.request_id, "Approved")}
                          className="btn btn-success btn-sm flex-fill"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatus(req.request_id, "Rejected")}
                          className="btn btn-danger btn-sm flex-fill"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`badge w-100 py-3 fs-6 ${
                          req.status === "Approved" ? "bg-success" : "bg-danger"
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
