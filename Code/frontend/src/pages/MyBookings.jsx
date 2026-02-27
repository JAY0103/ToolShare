// src/pages/MyBookings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { bookingsService, API_BASE } from "../services/api";

const MyBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // local action loading map (disable per request button)
  const [actionBusy, setActionBusy] = useState({}); // { [request_id]: true }
  const setBusy = (id, val) => setActionBusy((prev) => ({ ...prev, [id]: val }));

  // normalize status once
  const normStatus = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "");

  // student-friendly labels
  const displayStatus = (s) => {
    const v = normStatus(s);
    if (v === "pending") return "Requested";
    if (v === "approved") return "Approved";
    if (v === "rejected") return "Rejected";
    if (v === "checkedout") return "Checked Out";
    if (v === "returned") return "Returned";
    if (v === "overdue") return "Overdue";
    if (v === "cancelled" || v === "canceled") return "Cancelled";
    return s || "—";
  };

  const badgeClassForStatus = (s) => {
    const v = normStatus(s);
    if (v === "approved") return "bg-success";
    if (v === "pending") return "bg-warning text-dark";
    if (v === "checkedout") return "bg-primary";
    if (v === "returned") return "bg-secondary";
    if (v === "overdue") return "bg-dark";
    if (v === "rejected") return "bg-danger";
    if (v === "cancelled" || v === "canceled") return "bg-secondary";
    return "bg-dark";
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await bookingsService.getMyBookings();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancelRequest = async (requestId) => {
    if (!requestId) return;

    const ok = window.confirm("Cancel this request?");
    if (!ok) return;

    try {
      setBusy(requestId, true);
      await bookingsService.cancelRequest(requestId);

      // refresh list so status shows Cancelled
      await fetchRequests();
    } catch (err) {
      alert(err?.message || "Could not cancel request.");
      // still refresh to sync UI (in case it was already cancelled elsewhere)
      await fetchRequests();
    } finally {
      setBusy(requestId, false);
    }
  };

  const getImageUrl = (p) => {
    if (!p) return "https://via.placeholder.com/400x250?text=No+Image";
    if (String(p).startsWith("http")) return p;
    return `${API_BASE}${p}`;
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

    // newest first
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
        <div className="alert alert-info text-center">You have not submitted any requests yet.</div>
      ) : (
        <div className="row g-4">
          {grouped.map((group) => (
            <div key={group.key} className="col-12">
              <div className="card shadow-sm p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h5 className="fw-bold mb-1">
                      {group.request_group_id ? `Basket Request #${group.request_group_id}` : "Single Request"}
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
                    const v = normStatus(status);

                    const busy = !!actionBusy[req.request_id];

                    const canCancel = v === "pending";
                    const isCancelled = v === "cancelled" || v === "canceled";

                    return (
                      <div key={req.request_id} className="col-md-6 col-lg-4">
                        <div className="item-card shadow-sm">
                          <div className="img-frame">
                            <img
                              src={getImageUrl(req.image_url)}
                              alt={req.item_name || "Tool image"}
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/400x250?text=Image+Not+Found";
                              }}
                            />
                          </div>

                          <div className="card-body d-flex flex-column">
                            <h5 className="card-title">{req.item_name}</h5>

                            <p>
                              <strong>From:</strong>{" "}
                              {req.requested_start ? new Date(req.requested_start).toLocaleString() : "—"}
                            </p>
                            <p>
                              <strong>To:</strong>{" "}
                              {req.requested_end ? new Date(req.requested_end).toLocaleString() : "—"}
                            </p>

                            {req.checked_out_at && (
                              <p className="mb-1">
                                <strong>Checked out:</strong> {new Date(req.checked_out_at).toLocaleString()}
                              </p>
                            )}

                            {req.returned_at && (
                              <p className="mb-1">
                                <strong>Returned:</strong> {new Date(req.returned_at).toLocaleString()}
                              </p>
                            )}

                            {v === "rejected" && rejectionNote && (
                              <div className="alert alert-info py-2 mt-2 mb-2">
                                <strong>Owner message:</strong> {rejectionNote}
                              </div>
                            )}

                            {/* Cancel button */}
                            <div className="d-flex gap-2 mt-2">
                              {canCancel ? (
                                <button
                                  className="btn btn-outline-danger btn-sm fw-bold flex-fill"
                                  disabled={busy}
                                  onClick={() => handleCancelRequest(req.request_id)}
                                >
                                  {busy ? "Cancelling..." : "Cancel Request"}
                                </button>
                              ) : (
                                <button className="btn btn-outline-secondary btn-sm fw-bold flex-fill" disabled>
                                  {isCancelled ? "Cancelled" : "No Action"}
                                </button>
                              )}
                            </div>

                            {/* Status badge */}
                            <div className="mt-3">
                              <span className={`badge w-100 py-2 fs-6 ${badgeClassForStatus(status)}`}>
                                {displayStatus(status)}
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