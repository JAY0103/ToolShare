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

  useEffect(() => {
    setLocalSearch(searchTerm || "");
  }, [searchTerm]);

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

    if (selectedCategory !== "All Tools") {
      result = result.filter(
        (i) => (i.category_name || "Uncategorized") === selectedCategory
      );
    }

    if (localSearch.trim()) {
      const term = localSearch.toLowerCase();
      result = result.filter(
        (i) =>
          i.name?.toLowerCase().includes(term) ||
          i.description?.toLowerCase().includes(term) ||
          i.category_name?.toLowerCase().includes(term)
      );
    }

    // Faculty: show owned tools first, then others
    if (isFaculty && !isAdmin) {
      result.sort((a, b) => {
        const aOwned = Number(a.owner_id) === Number(userId) ? 1 : 0;
        const bOwned = Number(b.owner_id) === Number(userId) ? 1 : 0;

        if (aOwned !== bOwned) {
          return bOwned - aOwned;
        }

        return String(a.name || "").localeCompare(String(b.name || ""));
      });
    }

    return result;
  }, [items, selectedCategory, localSearch, isFaculty, isAdmin, userId]);

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
    setLocalSearch("");
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
    <div
      className="container-fluid px-3 px-md-4 py-4"
      style={{ background: "#f8fafc", minHeight: "100vh" }}
    >
      <div className="mx-auto" style={{ maxWidth: "1450px" }}>
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#0f172a" }}>
              Browse Tools
            </h2>
            <div className="text-muted">
              Find equipment, check availability, and reserve what you need.
            </div>
          </div>

          {!isStaff && (
            <button
              className="btn btn-outline-success fw-bold top-action-btn"
              onClick={() => navigate("/cart")}
            >
              <i className="bi bi-basket3 me-2"></i>
              Go to Basket
            </button>
          )}
        </div>

        {/* BOOKING POLICY */}
        {!isStaff && (
          <div
            className="alert border shadow-sm mb-4"
            style={{
              background: "#fef3c7",
              borderColor: "#f5d56b",
              color: "#8a6500",
              borderRadius: "16px",
              padding: "16px 18px",
            }}
          >
            <strong>Booking Policy:</strong> Late returns may incur a penalty.
            Damage fees may apply after inspection. Items must be returned in
            original condition.
          </div>
        )}

        {/* Filters */}
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: "22px", overflow: "hidden" }}
        >
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold text-dark">
                  Search Tools
                </label>
                <input
                  type="text"
                  className="form-control clean-input"
                  placeholder="Search by name, description, category..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label fw-semibold text-dark">Start</label>
                <input
                  type="datetime-local"
                  className="form-control clean-input"
                  value={availabilityStart}
                  onChange={(e) => setAvailabilityStart(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label fw-semibold text-dark">End</label>
                <input
                  type="datetime-local"
                  className="form-control clean-input"
                  value={availabilityEnd}
                  onChange={(e) => setAvailabilityEnd(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-2">
                <label className="form-label fw-semibold text-dark">
                  Category
                </label>
                <select
                  className="form-select clean-input"
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

              <div className="col-12 col-md-6 col-lg-2">
                <div className="d-flex gap-2 filter-actions">
                  <button
                    type="button"
                    className="btn btn-success fw-bold clean-btn flex-fill"
                    onClick={checkAvailability}
                  >
                    Check
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary fw-bold clean-btn flex-fill"
                    onClick={clearAvailability}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {availabilityMode && (
                <div className="col-12">
                  <div
                    className="alert alert-success py-2 px-3 mb-0 border-0"
                    style={{ borderRadius: "14px" }}
                  >
                    Showing tools between <strong>{availabilityStart}</strong> and{" "}
                    <strong>{availabilityEnd}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-5 text-muted">Loading tools...</div>
        ) : filteredItems.length === 0 ? (
          <div
            className="alert alert-info text-center border-0 shadow-sm"
            style={{ borderRadius: "18px" }}
          >
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
                    <img src={getImageSrc(item.image_url)} alt={item.name} />
                  </div>

                  <div className="item-card-body">
                    <div>
                      <h5 className="fw-bold item-title mb-2">{item.name}</h5>

                      <p className="text-muted item-description mb-3">
                        {item.description?.trim()
                          ? item.description
                          : "No description"}
                      </p>

                      <div className="meta-row">
                        <span className="meta-label">Owner:</span>{" "}
                        {item.owner_name || "Unknown"}
                      </div>

                      <div className="meta-row mb-3">
                        <span className="meta-label">Category:</span>{" "}
                        {item.category_name || "Uncategorized"}
                      </div>
                    </div>

                    <div className="mt-auto">
                      {!isStaff ? (
                        <button
                          className="btn btn-outline-success fw-bold w-100 action-btn"
                          onClick={() => {
                            const confirm = window.confirm(
                              "By adding this item, you agree to ToolShare's late and damage policy."
                            );
                            if (!confirm) return;

                            addToCart(item);
                          }}
                        >
                          Add to Basket
                        </button>
                      ) : isOwner ? (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-primary fw-bold flex-fill action-btn"
                            onClick={() =>
                              navigate(`/edit-item?item_id=${item.item_id}`)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-outline-danger fw-bold flex-fill action-btn"
                            onClick={() => handleDelete(item.item_id)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="text-muted small">Staff view (not your tool)</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <style>{`
          .clean-input {
            min-height: 48px;
            border-radius: 14px;
            border: 1px solid #dbe3ee;
            background: #ffffff;
            box-shadow: none;
            transition: all 0.18s ease;
          }

          .clean-input:focus {
            border-color: #22c55e;
            box-shadow: 0 0 0 0.18rem rgba(34, 197, 94, 0.12);
          }

          .clean-btn,
          .action-btn,
          .top-action-btn {
            min-height: 48px;
            border-radius: 14px;
          }

          .top-action-btn {
            padding-left: 18px;
            padding-right: 18px;
          }

          .items-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 18px;
          }

          .item-card {
            background: #ffffff;
            border: 1px solid #e8edf3;
            border-radius: 22px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100%;
            transition: transform 0.18s ease, box-shadow 0.18s ease;
          }

          .item-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08) !important;
          }

          .img-frame {
            height: 210px;
            background: #f8fafc;
            padding: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .img-frame img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: center;
            border-radius: 14px;
            border: 1px solid #edf2f7;
            background: #fff;
          }

          .item-card-body {
            padding: 16px 16px 18px;
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 240px;
          }

          .item-title {
            color: #0f172a;
            line-height: 1.25;
            min-height: 2.6rem;
          }

          .item-description {
            color: #64748b !important;
            line-height: 1.55;
            min-height: 72px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .meta-row {
            font-size: 0.95rem;
            color: #475569;
            line-height: 1.5;
          }

          .meta-label {
            font-weight: 600;
            color: #334155;
          }

          .filter-actions {
            height: 48px;
          }

          @media (max-width: 991.98px) {
            .filter-actions {
              height: auto;
            }
          }

          @media (max-width: 576px) {
            .items-grid {
              grid-template-columns: 1fr;
            }

            .filter-actions {
              flex-direction: column;
            }

            .clean-btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Items;