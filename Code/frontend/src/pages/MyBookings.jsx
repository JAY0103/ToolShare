// src/pages/MyBookings.jsx
import React, { useEffect, useState } from "react";
import { bookingsService, API_BASE } from "../services/api";

const MyBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await bookingsService.getMyBookings();
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/300x200?text=No+Image";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };

  if (loading)
    return <div className="container-fluid px-4 py-4">Loading your requests...</div>;

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4">My Borrow Requests</h2>

      {requests.length === 0 ? (
        <div className="alert alert-info text-center">
          You have no borrow requests yet.
        </div>
      ) : (
        <div className="row g-4">
          {requests.map((r) => (
            <div key={r.request_id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <img
                  src={getImageUrl(r.image_url)}
                  className="card-img-top"
                  alt={r.item_name}
                  style={{ height: "180px", objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/300x200?text=Image+Not+Found";
                  }}
                />

                <div className="card-body">
                  <h5 className="card-title">{r.item_name}</h5>
                  <p>
                    <strong>From:</strong>{" "}
                    {new Date(r.requested_start).toLocaleString()}
                  </p>
                  <p>
                    <strong>To:</strong>{" "}
                    {new Date(r.requested_end).toLocaleString()}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`badge ms-2 ${
                        r.status === "Approved"
                          ? "bg-success"
                          : r.status === "Rejected"
                          ? "bg-danger"
                          : "bg-warning"
                      }`}
                    >
                      {r.status}
                    </span>
                  </p>

                  {/* Show faculty message if exists */}
                  {r.rejectionReason && (
                    <div className="alert alert-info mt-2 mb-0 py-2">
                      <strong>Message from faculty:</strong> {r.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
