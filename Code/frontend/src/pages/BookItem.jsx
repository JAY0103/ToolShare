// src/pages/BookItem.jsx
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
    return <div className="container-fluid px-4 py-4">Loading item...</div>;
  }
  if (!item) return null;

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-3">Request to Borrow</h2>

      {/* Two-column layout: Image/details LEFT, Form/Preview RIGHT */}
      <div className="row g-4 align-items-start">
        {/* LEFT */}
        <div className="col-lg-6">
          <div className="card p-3">
            <div className="bookitem-img">
              <img
                src={getImageUrl(item.image_url)}
                alt={item.name || "Item image"}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x250?text=Image+Not+Found";
                }}
              />
            </div>

            <h4 className="fw-bold mt-3 mb-1">{item.name}</h4>
            <p className="text-muted mb-2">
              {item.description || "No description"}
            </p>
            <p className="text-muted mb-0">
              Owner: {item.owner_name || "Unknown"}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-lg-6">
          <div className="card p-3">
            <h5 className="fw-bold mb-3">Booking Details</h5>
            {/* Form */}
            <form onSubmit={handleSubmit} className="request-form">
              <label>
                Requested Start:
                <input
                  type="datetime-local"
                  name="requested_start"
                  value={formData.requested_start}
                  min={nowLocal}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Requested End:
                <input
                  type="datetime-local"
                  name="requested_end"
                  value={formData.requested_end}
                  min={formData.requested_start || nowLocal}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Reason:
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                />
              </label>

              <button type="submit" className="primary-button w-100">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookItem;
