import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingsService, API_BASE } from "../services/api";

const CART_KEY = "cart";

const Cart = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userType = String(user?.user_type || "").toLowerCase();
  const isFaculty = userType === "faculty";
  const isAdmin = userType === "admin";

  const [cart, setCart] = useState([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const loadCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const arr = JSON.parse(raw || "[]");
      const list = Array.isArray(arr) ? arr : [];
      setCart(list);
    } catch {
      setCart([]);
    }
  };

  const saveCart = (next) => {
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (isFaculty || isAdmin) {
      navigate("/items");
      return;
    }

    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const basketCount = cart.length;

  const getImageSrc = (image_url) => {
    if (!image_url) return "https://via.placeholder.com/400x250?text=ToolShare";
    if (image_url.startsWith("http")) return image_url;
    return `${API_BASE}${image_url}`;
  };

  const removeItem = (item_id) => {
    const next = cart.filter((c) => Number(c.item_id) !== Number(item_id));
    saveCart(next);
  };

  const clearBasket = () => {
    saveCart([]);
    setReason("");
    setAcknowledged(false);
  };

  const updateItemField = (item_id, field, value) => {
    const next = cart.map((c) =>
      Number(c.item_id) === Number(item_id) ? { ...c, [field]: value } : c
    );
    saveCart(next);
  };

  const getNowLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const validate = () => {
    if (!reason.trim()) return "Please enter a reason for your request.";
    if (cart.length === 0) return "No items selected (your basket is empty).";
    if (!acknowledged) {
      return "Please acknowledge responsibility before submitting your request.";
    }

    for (const c of cart) {
      if (!c.requested_start || !c.requested_end) {
        return `Please set start and end date/time for "${c.name}".`;
      }

      const s = new Date(c.requested_start);
      const e = new Date(c.requested_end);
      const now = new Date();

      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return `Invalid date format for "${c.name}".`;
      }

      if (s < now) {
        return `Start time cannot be in the past for "${c.name}".`;
      }

      if (e <= s) {
        return `End time must be after start time for "${c.name}".`;
      }
    }

    return null;
  };

  const submitBasket = async () => {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reason: reason.trim(),
        items: cart.map((c) => ({
          item_id: c.item_id,
          requested_start: c.requested_start,
          requested_end: c.requested_end,
        })),
      };

      const res = await bookingsService.requestGroup(payload);

      const created = res.created_requests || [];
      const failed = res.failed_items || [];

      const createdIds = new Set(created.map((x) => Number(x.item_id)));
      const remaining = cart.filter((c) => !createdIds.has(Number(c.item_id)));
      saveCart(remaining);

      let msg = `Request submitted!\nApproved for processing: ${created.length}`;
      if (failed.length > 0) {
        msg += `\nNot submitted: ${failed.length} (please adjust dates and try again)`;
      }
      alert(msg);

      if (remaining.length === 0) {
        setReason("");
        setAcknowledged(false);
        navigate("/my-bookings");
      }
    } catch (e) {
      alert(e.message || "Request submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    if (cart.length === 0) return null;
    const missing = cart.filter((c) => !c.requested_start || !c.requested_end).length;
    return { missing };
  }, [cart]);

  const minDateTime = getNowLocal();

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#1f2937" }}>
              My Basket
            </h2>
            <p className="text-muted mb-0">
              Review your selected tools, choose the required dates, and submit one request.
            </p>
          </div>

          {basketCount > 0 && (
            <div
              className="px-3 py-2 rounded-pill border bg-white shadow-sm text-dark fw-semibold"
              style={{ width: "fit-content" }}
            >
              {basketCount} item{basketCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {basketCount === 0 ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-5 text-center">
            <div className="mb-3 fs-4">🧺</div>
            <h5 className="fw-bold mb-2">Your basket is empty</h5>
            <p className="text-muted mb-0">
              Go to <strong>Browse Tools</strong> and add items to your basket.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4 p-md-4">
              <div className="mb-4">
                <label className="form-label fw-bold mb-2">Reason for this request</label>
                <textarea
                  className="form-control rounded-3"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Example: Need these tools for lab work, project testing, or course assignment..."
                />
              </div>

              <div className="mb-4">
                <div className="border rounded-4 p-3 bg-light">
                  <div className="fw-semibold mb-2">Request Summary</div>
                  <div className="text-muted small mb-2">
                    Total selected: <strong>{basketCount}</strong>
                  </div>

                  {summary?.missing > 0 ? (
                    <div className="alert alert-warning rounded-3 py-2 px-3 mb-0 small">
                      You still need to set dates for <strong>{summary.missing}</strong> item(s).
                    </div>
                  ) : (
                    <div className="alert alert-success rounded-3 py-2 px-3 mb-0 small">
                      All selected items have date and time values entered.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 p-md-4 border rounded-4 bg-light">
                <div className="form-check m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="borrowAcknowledge"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                  />
                  <label
                    className="form-check-label ms-2 text-dark"
                    htmlFor="borrowAcknowledge"
                    style={{ lineHeight: "1.6" }}
                  >
                    I acknowledge that by borrowing these items, I am responsible for proper use
                    and I may be responsible for repair or replacement if an item is damaged,
                    lost, or mishandled due to negligence.
                  </label>
                </div>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
                <button
                  className="btn btn-outline-secondary rounded-3 fw-semibold px-4"
                  onClick={clearBasket}
                  disabled={submitting}
                >
                  Clear Basket
                </button>

                <button
                  className="btn btn-success rounded-3 fw-semibold px-4 ms-sm-auto"
                  onClick={submitBasket}
                  disabled={submitting || !acknowledged}
                >
                  {submitting ? "Submitting..." : "Submit Borrow Request"}
                </button>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {cart.map((c) => (
              <div className="col-12" key={c.item_id}>
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="card-body p-4">
                    <div className="row g-4 align-items-center">
                      <div className="col-12 col-md-3 col-lg-2">
                        <div
                          className="rounded-4 border d-flex align-items-center justify-content-center bg-light"
                          style={{ minHeight: "140px" }}
                        >
                          <img
                            src={getImageSrc(c.image_url)}
                            alt={c.name}
                            className="img-fluid rounded-3"
                            style={{
                              maxHeight: "120px",
                              objectFit: "contain",
                              padding: "0.5rem",
                            }}
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/400x250?text=Image+Not+Found";
                            }}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-9 col-lg-4">
                        <h5 className="fw-bold mb-1 text-dark">{c.name}</h5>
                        <div className="text-muted small mb-2">
                          Tool owner: {c.owner_name || "Unknown"}
                        </div>
                        <div className="text-muted small" style={{ lineHeight: "1.6" }}>
                          {c.description?.substring(0, 140) || "No description available."}
                        </div>
                      </div>

                      <div className="col-12 col-lg-5">
                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label fw-semibold">Start date/time</label>
                            <input
                              type="datetime-local"
                              className="form-control rounded-3"
                              min={minDateTime}
                              value={c.requested_start || ""}
                              onChange={(e) =>
                                updateItemField(c.item_id, "requested_start", e.target.value)
                              }
                            />
                          </div>

                          <div className="col-12 col-md-6">
                            <label className="form-label fw-semibold">End date/time</label>
                            <input
                              type="datetime-local"
                              className="form-control rounded-3"
                              min={c.requested_start || minDateTime}
                              value={c.requested_end || ""}
                              onChange={(e) =>
                                updateItemField(c.item_id, "requested_end", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-12 col-lg-1 d-flex justify-content-lg-end">
                        <button
                          className="btn btn-outline-danger rounded-3 fw-semibold"
                          onClick={() => removeItem(c.item_id)}
                          disabled={submitting}
                          title="Remove"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;