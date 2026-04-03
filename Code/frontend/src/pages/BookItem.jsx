import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { itemsService, bookingsService, API_BASE } from "../services/api";

const BookItem = () => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get("item_id");
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    item_id: itemId,
    requested_start: "",
    requested_end: "",
    reason: "",
  });

  useEffect(() => {
    const run = async () => {
      if (!itemId) {
        alert("No item selected");
        navigate("/home");
        return;
      }

      try {
        const list = await itemsService.getItems();
        const found = list.find((i) => i.item_id === parseInt(itemId, 10));

        if (!found) {
          alert("Item not found");
          navigate("/home");
          return;
        }

        setItem(found);
      } catch (err) {
        alert("Failed to load item details");
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [itemId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400x250?text=ToolShare";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };

  const isDateRangeValid = () => {
    const { requested_start, requested_end } = formData;
    if (!requested_start || !requested_end) return false;

    const start = new Date(requested_start);
    const end = new Date(requested_end);
    const now = new Date();

    if (start < now) {
      alert("Start date/time cannot be in the past.");
      return false;
    }
    if (end <= start) {
      alert("End must be after start.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDateRangeValid()) return;

    try {
      await bookingsService.bookItem(formData);
      alert("Borrow request sent!");
      navigate("/my-bookings");
    } catch (err) {
      alert(err.message || "Request failed");
    }
  };

  const nowLocal = new Date().toISOString().slice(0, 16);

  if (loading) {
    return (
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="text-center">
            <div className="spinner-border text-success mb-3" role="status" />
            <div className="text-muted fw-semibold">Loading item...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: "#1f2937" }}>
          Request to Borrow
        </h2>
        <p className="text-muted mb-0">
          Review the item details and choose your preferred booking dates.
        </p>
      </div>

      <div className="row g-4 align-items-start">
        {/* LEFT: Item Info */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                minHeight: "320px",
                background: "linear-gradient(135deg, #f8f9fa, #eef2f7)",
              }}
            >
              <img
                src={getImageUrl(item.image_url)}
                alt={item.name || "Item image"}
                className="img-fluid"
                style={{
                  maxHeight: "280px",
                  objectFit: "contain",
                  padding: "1rem",
                }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x250?text=Image+Not+Found";
                }}
              />
            </div>

            <div className="card-body p-4">
              <div className="mb-3">
                <span className="badge rounded-pill text-bg-light border px-3 py-2">
                  Equipment Request
                </span>
              </div>

              <h4 className="fw-bold mb-2 text-dark">{item.name}</h4>

              <p className="text-muted mb-3" style={{ lineHeight: "1.6" }}>
                {item.description || "No description available for this item."}
              </p>

              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="border rounded-3 p-3 h-100 bg-light-subtle">
                    <div className="text-muted small mb-1">Owner</div>
                    <div className="fw-semibold text-dark">
                      {item.owner_name || "Unknown"}
                    </div>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="border rounded-3 p-3 h-100 bg-light-subtle">
                    <div className="text-muted small mb-1">Item ID</div>
                    <div className="fw-semibold text-dark">
                      #{item.item_id || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Booking Form */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="mb-4">
                <h5 className="fw-bold mb-1 text-dark">Booking Details</h5>
                <p className="text-muted mb-0 small">
                  Fill in the requested borrowing period and add a short reason.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Requested Start</label>
                  <input
                    type="datetime-local"
                    name="requested_start"
                    value={formData.requested_start}
                    min={nowLocal}
                    onChange={handleChange}
                    required
                    className="form-control form-control-lg rounded-3"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Requested End</label>
                  <input
                    type="datetime-local"
                    name="requested_end"
                    value={formData.requested_end}
                    min={formData.requested_start || nowLocal}
                    onChange={handleChange}
                    required
                    className="form-control form-control-lg rounded-3"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Reason</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="form-control rounded-3"
                    placeholder="Briefly explain why you need this item..."
                  />
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-success btn-lg rounded-3 fw-semibold"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookItem;