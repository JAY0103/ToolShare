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
    return (
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body py-5 text-center">
            <div className="spinner-border text-success mb-3" role="status" aria-hidden="true"></div>
            <div className="fw-semibold text-muted">Loading requests...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Requests</h2>
          <p className="text-muted mb-0">View your submitted bookings and track their status.</p>
        </div>

        {requests.length > 0 && (
          <div className="badge text-bg-light border rounded-pill px-3 py-2 fw-medium">
            {requests.length} total item(s)
          </div>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <h5 className="fw-bold mb-2">No requests yet</h5>
            <p className="text-muted mb-0">You have not submitted any requests yet.</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {grouped.map((group) => (
            <div key={group.key} className="col-12">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-3 p-md-4">
                  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <h5 className="fw-bold mb-0">
                        {group.request_group_id
                          ? `Basket Request #${group.request_group_id}`
                          : "Single Request"}
                      </h5>
                    </div>

                    <span className="badge bg-dark rounded-pill px-3 py-2">
                      {group.items.length} item(s)
                    </span>
                  </div>

                  <div className="row g-3">
                    {group.items.map((req) => {
                      const status = req.status || "Pending";
                      const rejectionNote = req.rejectionReason || req.decision_note || "";
                      const v = normStatus(status);

                      const busy = !!actionBusy[req.request_id];

                      const canCancel = v === "pending" || v === "approved";
                      const isCancelled = v === "cancelled" || v === "canceled";

                      return (
                        <div key={req.request_id} className="col-12 col-md-6 col-xl-4">
                          <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                            <div
                              className="position-relative d-flex align-items-center justify-content-center"
                              style={{
                                height: "220px",
                                backgroundColor: "#f8f9fa",
                              }}
                            >
                              <img
                                src={getImageUrl(req.image_url)}
                                alt={req.item_name || "Tool image"}
                                className="w-100 h-100"
                                style={{ objectFit: "contain" }}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/400x250?text=Image+Not+Found";
                                }}
                              />

                              <div className="position-absolute top-0 end-0 m-2">
                                <span className={`badge rounded-pill px-3 py-2 ${badgeClassForStatus(status)}`}>
                                  {displayStatus(status)}
                                </span>
                              </div>
                            </div>

                            <div className="card-body d-flex flex-column p-3">
                              <h5 className="card-title fw-bold mb-3">
                                {req.item_name || "Unnamed Tool"}
                              </h5>

                              <div className="small text-muted mb-3">
                                <div className="mb-2">
                                  <strong className="text-dark">Reason:</strong>{" "}
                                  {req.reason || group.reason || "—"}
                                </div>

                                <div className="mb-2">
                                  <strong className="text-dark">From:</strong>{" "}
                                  {req.requested_start
                                    ? new Date(req.requested_start).toLocaleString()
                                    : "—"}
                                </div>

                                <div className="mb-2">
                                  <strong className="text-dark">To:</strong>{" "}
                                  {req.requested_end
                                    ? new Date(req.requested_end).toLocaleString()
                                    : "—"}
                                </div>

                                {req.checked_out_at && (
                                  <div className="mb-2">
                                    <strong className="text-dark">Checked out:</strong>{" "}
                                    {new Date(req.checked_out_at).toLocaleString()}
                                  </div>
                                )}

                                {req.returned_at && (
                                  <div className="mb-2">
                                    <strong className="text-dark">Returned:</strong>{" "}
                                    {new Date(req.returned_at).toLocaleString()}
                                  </div>
                                )}
                              </div>

                              {v === "rejected" && rejectionNote && (
                                <div className="alert alert-info border-0 py-2 px-3 rounded-3 mb-3">
                                  <strong>Owner message:</strong> {rejectionNote}
                                </div>
                              )}

                              <div className="mt-auto">
                                {canCancel ? (
                                  <button
                                    className="btn btn-outline-danger w-100 fw-semibold rounded-3"
                                    disabled={busy}
                                    onClick={() => handleCancelRequest(req.request_id)}
                                  >
                                    {busy ? "Cancelling..." : "Cancel Request"}
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-outline-secondary w-100 fw-semibold rounded-3"
                                    disabled
                                  >
                                    {isCancelled ? "Cancelled" : "No Action"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

export default MyBookings;