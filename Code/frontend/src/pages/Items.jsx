// src/pages/Items.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemsService } from "../services/api";

const Items = ({ searchTerm = "" }) => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [selectedCategory, setSelectedCategory] = useState("All Tools");
  const [availabilityStart, setAvailabilityStart] = useState("");
  const [availabilityEnd, setAvailabilityEnd] = useState("");
  const [availabilityMode, setAvailabilityMode] = useState(false);

  const loadAllItems = async () => {
    try {
      setLoading(true);
      const list = await itemsService.getItems();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllItems();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    for (const item of items) {
      if (item.category_name) set.add(item.category_name);
    }
    return ["All Tools", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (selectedCategory !== "All Tools") {
      result = result.filter((i) => i.category_name === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (i) =>
          i.name?.toLowerCase().includes(term) ||
          i.description?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [items, selectedCategory, searchTerm]);

  const getImageSrc = (image_url) => {
    if (!image_url) return "https://via.placeholder.com/400x250?text=ToolShare";
    if (image_url.startsWith("http")) return image_url;
    return `http://localhost:3000${image_url}`;
  };

  const checkAvailability = async () => {
    if (!availabilityStart || !availabilityEnd) {
      alert("Please select both start and end date/time.");
      return;
    }
    const start = new Date(availabilityStart);
    const end = new Date(availabilityEnd);
    if (end <= start) {
      alert("End must be after start.");
      return;
    }

    try {
      setLoading(true);
      const list = await itemsService.getAvailableItems(availabilityStart, availabilityEnd);
      setItems(Array.isArray(list) ? list : []);
      setSelectedCategory("All Tools");
      setAvailabilityMode(true);
    } catch (e) {
      alert("Availability filter failed (backend endpoint required).");
    } finally {
      setLoading(false);
    }
  };

  const clearAvailability = async () => {
    setAvailabilityStart("");
    setAvailabilityEnd("");
    setAvailabilityMode(false);
    setSelectedCategory("All Tools");
    await loadAllItems();
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Browse Tools</h2>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label fw-bold">Start</label>
            <input
              type="datetime-local"
              className="form-control"
              value={availabilityStart}
              onChange={(e) => setAvailabilityStart(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-bold">End</label>
            <input
              type="datetime-local"
              className="form-control"
              value={availabilityEnd}
              onChange={(e) => setAvailabilityEnd(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-bold">Category</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3 d-flex gap-2">
            <button className="btn btn-success flex-fill fw-bold" onClick={checkAvailability}>
              Check Availability
            </button>
            <button className="btn btn-outline-secondary flex-fill fw-bold" onClick={clearAvailability}>
              Clear
            </button>
          </div>

          {availabilityMode && (
            <div className="col-12">
              <div className="alert alert-success py-2 mb-0">
                Showing tools available between <strong>{availabilityStart}</strong> and{" "}
                <strong>{availabilityEnd}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-5">Loading tools...</div>
      ) : filteredItems.length === 0 ? (
        <div className="alert alert-info text-center">No tools found.</div>
      ) : (
        <div className="items-grid">
          {filteredItems.map((item) => (
            <div key={item.item_id} className="item-card shadow-sm">
              <img
                src={getImageSrc(item.image_url)}
                alt={item.name}
                className="item-image"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x250?text=Image+Not+Found";
                }}
              />

              <h5 className="fw-bold mt-2 mb-1">{item.name}</h5>
              <p className="text-muted mb-2">
                {item.description?.substring(0, 90) || "No description"}
              </p>
              <div className="text-muted small mb-3">
                Owner: {item.owner_name || "Unknown"}
              </div>

              <button
                className="btn btn-success fw-bold"
                onClick={() => navigate(`/book-item?item_id=${item.item_id}`)}
              >
                Request
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Items
