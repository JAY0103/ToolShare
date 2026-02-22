// src/pages/MyBookings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { bookingsService, API_BASE } from "../services/api";

const MyBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await bookingsService.getMyBookings();
      const list = Array.isArray(data) ? data : [];
      setRequests(list);
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

  // GROUP: request_group_id (basket) OR request_id (single request)
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of requests) {
      const key = r.request_group_id ? `G-${r.request_group_id}` : `S-${r.request_id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          request_group_id: r.request_group_id || null,
          reason: r.reason || "",
          items: [],
        });
      }
      map.get(key).items.push(r);
    }

    // newest first: using max request_id inside group
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      const aMax = Math.max(...a.items.map((x) => Number(x.request_id)));
      const bMax = Math.max(...b.items.map((x) => Number(x.request_id)));
      return bMax - aMax;
    });
    return arr;
  }, [requests]);

  if (loading) {
    return <div className="container-fluid px-4 py-4">Loading requests...</div>;
  }

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4">My Requests</h2>

      {requests.length === 0 ? (
        <div className="alert alert-info text-center">
          You have not submitted any requests yet.
        </div>
      ) : (
        <div className="row g-4">
          {grouped.map((group) => (
            <div key={group.key} className="col-12">
              <div className="card shadow-sm p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h5 className="fw-bold mb-1">
                      {group.request_group_id
                        ? `Basket Request #${group.request_group_id}`
                        : "Single Request"}
                    </h5>
                    <div className="text-muted small">
                      <strong>Reason:</strong> {group.reason || "—"}
                    </div>
                  </div>

                  <span className="badge bg-dark">{group.items.length} item(s)</span>
                </div>

                <div className="row g-3">
                  {group.items.map((req) => {
                    const status = req.status || "Pending";
                    const rejectionNote = req.rejectionReason || req.decision_note || "";

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
                            <h5 className="card-title">{req.item_name}</h5>

                            <p>
                              <strong>From:</strong>{" "}
                              {req.requested_start
                                ? new Date(req.requested_start).toLocaleString()
                                : "—"}
                            </p>
                            <p>
                              <strong>To:</strong>{" "}
                              {req.requested_end
                                ? new Date(req.requested_end).toLocaleString()
                                : "—"}
                            </p>

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

                            {status === "Rejected" && rejectionNote && (
                              <div className="alert alert-info py-2 mt-2 mb-2">
                                <strong>Owner message:</strong> {rejectionNote}
                              </div>
                            )}

                            <div className="mt-auto">
                              <span className={`badge w-100 py-2 fs-6 ${badgeClassForStatus(status)}`}>
                                {status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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