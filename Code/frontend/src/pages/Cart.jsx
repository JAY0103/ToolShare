// src/pages/Cart.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingsService } from "../services/api";

const CART_KEY = "cart";

const Cart = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isFaculty = user?.user_type?.toLowerCase() === "faculty";

  const [cart, setCart] = useState([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (isFaculty) {
      navigate("/items");
      return;
    }
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cartCount = cart.length;

  const getImageSrc = (image_url) => {
    if (!image_url) return "https://via.placeholder.com/400x250?text=ToolShare";
    if (image_url.startsWith("http")) return image_url;
    return `http://localhost:3000${image_url}`;
  };

  const removeItem = (item_id) => {
    const next = cart.filter((c) => Number(c.item_id) !== Number(item_id));
    saveCart(next);
  };

  const clearCart = () => {
    saveCart([]);
    setReason("");
  };

  const updateItemField = (item_id, field, value) => {
    const next = cart.map((c) =>
      Number(c.item_id) === Number(item_id) ? { ...c, [field]: value } : c
    );
    saveCart(next);
  };

  const validate = () => {
    if (!reason.trim()) return "Please enter a reason.";
    if (cart.length === 0) return "Cart is empty.";

    for (const c of cart) {
      if (!c.requested_start || !c.requested_end) {
        return `Please set start and end for "${c.name}".`;
      }
      const s = new Date(c.requested_start);
      const e = new Date(c.requested_end);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
        return `Invalid date range for "${c.name}".`;
      }
    }

    return null;
  };

  const submitCart = async () => {
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

      // Remove successfully created items from cart, keep failed items so user can adjust dates
      const createdIds = new Set(created.map((x) => Number(x.item_id)));
      const remaining = cart.filter((c) => !createdIds.has(Number(c.item_id)));
      saveCart(remaining);

      let msg = `✅ Cart submitted!\nCreated: ${created.length}`;
      if (failed.length > 0) msg += `\nFailed: ${failed.length} (fix dates/availability and re-submit)`;
      alert(msg);

      if (remaining.length === 0) {
        setReason("");
        navigate("/my-bookings");
      }
    } catch (e) {
      alert(e.message || "Cart submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    if (cart.length === 0) return null;
    const missing = cart.filter((c) => !c.requested_start || !c.requested_end).length;
    return { missing };
  }, [cart]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">🛒 My Cart</h2>
        <button className="btn btn-outline-success fw-bold" onClick={() => navigate("/items")}>
          + Add More Items
        </button>
      </div>

      {cartCount === 0 ? (
        <div className="alert alert-info">
          Your cart is empty. Go to <strong>Browse Items</strong> and add tools.
        </div>
      ) : (
        <>
          <div className="card p-3 shadow-sm mb-4">
            <label className="form-label fw-bold">Reason for requesting these items</label>
            <textarea
              className="form-control"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Example: Need tools for lab project / assignment…"
            />

            {summary?.missing > 0 && (
              <div className="alert alert-warning mt-3 mb-0">
                You still need to set dates for <strong>{summary.missing}</strong> item(s).
              </div>
            )}

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-outline-secondary fw-bold" onClick={clearCart} disabled={submitting}>
                Clear Cart
              </button>
              <button className="btn btn-success fw-bold ms-auto" onClick={submitCart} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>

          <div className="row g-3">
            {cart.map((c) => (
              <div className="col-12" key={c.item_id}>
                <div className="card shadow-sm p-3">
                  <div className="row g-3 align-items-center">
                    <div className="col-md-2">
                      <img
                        src={getImageSrc(c.image_url)}
                        alt={c.name}
                        className="img-fluid rounded"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/400x250?text=Image+Not+Found";
                        }}
                      />
                    </div>

                    <div className="col-md-4">
                      <h5 className="fw-bold mb-1">{c.name}</h5>
                      <div className="text-muted small mb-2">
                        Owner: {c.owner_name || "Unknown"}
                      </div>
                      <div className="text-muted small">
                        {c.description?.substring(0, 120) || ""}
                      </div>
                    </div>

                    <div className="col-md-5">
                      <div className="row g-2">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Start</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={c.requested_start || ""}
                            onChange={(e) =>
                              updateItemField(c.item_id, "requested_start", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">End</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={c.requested_end || ""}
                            onChange={(e) =>
                              updateItemField(c.item_id, "requested_end", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-1 d-flex justify-content-end">
                      <button
                        className="btn btn-outline-danger fw-bold"
                        onClick={() => removeItem(c.item_id)}
                        disabled={submitting}
                        title="Remove"
                      >
                        ✕
                      </button>
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
