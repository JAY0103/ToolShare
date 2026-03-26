// src/pages/Items.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemsService, API_BASE } from "../services/api";

const CART_KEY = "cart";

const Items = ({ searchTerm = "" }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const userType = String(user?.user_type || "").toLowerCase();
  const isFaculty = userType === "faculty";
  const isAdmin = userType === "admin";
  const isStaff = isFaculty || isAdmin;

  const userId = user?.user_id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [selectedCategory, setSelectedCategory] = useState("All Tools");
  const [availabilityStart, setAvailabilityStart] = useState("");
  const [availabilityEnd, setAvailabilityEnd] = useState("");
  const [availabilityMode, setAvailabilityMode] = useState(false);

  // local search state
  const [localSearch, setLocalSearch] = useState(searchTerm || "");

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

  // include Uncategorized
  const categories = useMemo(() => {
    const set = new Set();
    for (const item of items) {
      set.add(item.category_name || "Uncategorized");
    }
    return ["All Tools", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Category filter
    if (selectedCategory !== "All Tools") {
      result = result.filter(
        (i) => (i.category_name || "Uncategorized") === selectedCategory
      );
    }

    // Search filter
    if (localSearch) {
      const term = localSearch.toLowerCase();
      result = result.filter(
        (i) =>
          i.name?.toLowerCase().includes(term) ||
          i.description?.toLowerCase().includes(term) ||
          i.category_name?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [items, selectedCategory, localSearch]);

  const getImageSrc = (image_url) => {
    if (!image_url) return "https://via.placeholder.com/400x250?text=ToolShare";
    if (image_url.startsWith("http")) return image_url;
    return `${API_BASE}${image_url}`;
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
      const list = await itemsService.getAvailableItems(
        availabilityStart,
        availabilityEnd
      );
      setItems(Array.isArray(list) ? list : []);
      setSelectedCategory("All Tools");
      setAvailabilityMode(true);
    } catch (e) {
      alert("Availability filter failed.");
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

  // ---------------- BASKET ----------------
  const getCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const arr = JSON.parse(raw || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const setCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const addToCart = (item) => {
    const cart = getCart();
    const exists = cart.some(
      (c) => Number(c.item_id) === Number(item.item_id)
    );
    if (exists) {
      alert("This tool is already in your basket.");
      return;
    }

    cart.push({
      item_id: item.item_id,
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      owner_name: item.owner_name,
      requested_start: "",
      requested_end: "",
    });

    setCart(cart);
    alert("Added to basket.");
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Delete this tool?")) return;
    try {
      await itemsService.deleteItem(itemId);
      alert("Tool deleted.");
      await loadAllItems();
    } catch (err) {
      alert(err.message || "Failed to delete tool");
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Browse Tools</h2>

        {!isStaff && (
          <button
            className="btn btn-outline-success fw-bold"
            onClick={() => navigate("/cart")}
          >
            <i className="bi bi-basket3"></i> Go to Basket
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-3 align-items-end">

          {/* SEARCH BAR */}
          <div className="col-md-4">
            <label className="form-label fw-bold">Search Tools</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, description, category..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>

          {/* Start */}
          <div className="col-md-2">
            <label className="form-label fw-bold">Start</label>
            <input
              type="datetime-local"
              className="form-control"
              value={availabilityStart}
              onChange={(e) => setAvailabilityStart(e.target.value)}
            />
          </div>

          {/* End */}
          <div className="col-md-2">
            <label className="form-label fw-bold">End</label>
            <input
              type="datetime-local"
              className="form-control"
              value={availabilityEnd}
              onChange={(e) => setAvailabilityEnd(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="col-md-2">
            <label className="form-label fw-bold">Category</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="col-md-2 d-flex gap-2">
            <button
              className="btn btn-success flex-fill fw-bold"
              onClick={checkAvailability}
            >
              Check
            </button>
            <button
              className="btn btn-outline-secondary flex-fill fw-bold"
              onClick={clearAvailability}
            >
              Clear
            </button>
          </div>

          {availabilityMode && (
            <div className="col-12">
              <div className="alert alert-success py-2 mb-0">
                Showing tools between <strong>{availabilityStart}</strong> and{" "}
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
        <div className="alert alert-info text-center">
          No tools found.
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map((item) => {
            const isOwner =
              isAdmin ||
              (isFaculty && Number(item.owner_id) === Number(userId));

            return (
              <div key={item.item_id} className="item-card shadow-sm">
                <div className="img-frame">
                  <img
                    src={getImageSrc(item.image_url)}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/400x250?text=Image+Not+Found";
                    }}
                  />
                </div>

                <h5 className="fw-bold mt-2 mb-1">{item.name}</h5>
                <p className="text-muted mb-2">
                  {item.description?.substring(0, 90) ||
                    "No description"}
                </p>

                <div className="text-muted small mb-2">
                  Owner: {item.owner_name || "Unknown"}
                </div>

                <div className="text-muted small mb-3">
                  Category: {item.category_name || "Uncategorized"}
                </div>

                {!isStaff ? (
                  <button
                    className="btn btn-outline-success fw-bold w-100"
                    onClick={() => addToCart(item)}
                  >
                    Add to Basket
                  </button>
                ) : isOwner ? (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary fw-bold flex-fill"
                      onClick={() =>
                        navigate(`/edit-item?item_id=${item.item_id}`)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-outline-danger fw-bold flex-fill"
                      onClick={() => handleDelete(item.item_id)}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="text-muted small">
                    Staff view (not your tool)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Items;