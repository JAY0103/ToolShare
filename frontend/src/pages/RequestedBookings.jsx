// src/pages/RequestedBookings.jsx
import React, { useEffect, useState } from "react";
import { bookingsService } from "../services/api";

const RequestedBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await bookingsService.getRequestedBookings();
      setRequests(Array.isArray(data) ? data : []);
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
      await bookingsService.updateRequestStatus(requestId, status);

      setRequests((prev) =>
        prev.map((r) => (r.request_id === requestId ? { ...r, status } : r))
      );

      alert(`Request ${status}!`);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="container-fluid px-4 py-4">Loading incoming requests...</div>;

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
                  src={
                    req.image_url
                      ? `http://localhost:3000${req.image_url}`
                      : "https://via.placeholder.com/300x200"
                  }
                  className="card-img-top"
                  alt={req.item_name}
                  style={{ height: "180px", objectFit: "cover" }}
                />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{req.item_name}</h5>

                  <p>
                    <strong>Student:</strong>{" "}
                    {req.borrower_name || `${req.first_name || ""} ${req.last_name || ""}`.trim()}
                  </p>

                  <p><strong>From:</strong> {new Date(req.requested_start).toLocaleString()}</p>
                  <p><strong>To:</strong> {new Date(req.requested_end).toLocaleString()}</p>
                  <p><strong>Reason:</strong> {req.reason}</p>

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
