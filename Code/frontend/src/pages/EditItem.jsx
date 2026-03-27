import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { itemsService, API_BASE } from "../services/api";

const EditItem = () => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get("item_id");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    image_url: "",
    serial_number: "",
    quantity: 0,
  });

  // ---------------- INIT ----------------
  useEffect(() => {
    if (!itemId) {
      alert("Invalid item");
      navigate("/home");
      return;
    }

    const init = async () => {
      try {
        setLoading(true);

        const allItems = await itemsService.getItems();
        const found = allItems.find(
          (i) => Number(i.item_id) === Number(itemId)
        );

        if (!found) throw new Error("Item not found");

        setFormData({
          name: found.name || "",
          description: found.description || "",
          category_id: found.category_id
            ? String(found.category_id)
            : "",
          image_url: found.image_url || "",
          serial_number: found.serial_number || "",
          quantity: found.quantity ?? 0,
        });

        const cats = await itemsService.getCategories();
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        alert("Item not found");
        navigate("/home");
      } finally {
        setCategoriesLoading(false);
        setLoading(false);
      }
    };

    init();
  }, [itemId, navigate]);

  // ---------------- HELPERS ----------------
  const getImageSrc = (image_url) => {
    if (!image_url)
      return "https://via.placeholder.com/400x250?text=No+Image";
    if (image_url.startsWith("http")) return image_url;
    return `${API_BASE}${image_url}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.quantity < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    try {
      setSubmitting(true);

      await itemsService.editItem(itemId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id || null,
        serial_number: formData.serial_number.trim(),
        quantity: formData.quantity,
      });

      alert("Item updated successfully!");
      navigate("/home");
    } catch (err) {
      alert(err.message || "Failed to update item");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="container p-4 text-center">
        Loading item details...
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4">Edit Item</h2>

      <div className="row g-4">
        {/* IMAGE */}
        <div className="col-md-6">
          <div className="card shadow">
            <div
              style={{
                height: "320px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8f9fa",
              }}
            >
              <img
                src={getImageSrc(formData.image_url)}
                alt={formData.name}
                style={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="col-md-6">
          <div className="card shadow p-4">
            <form onSubmit={handleSubmit}>
              {/* NAME */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Description *
                </label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* SERIAL NUMBER */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Serial Number *
                </label>
                <input
                  type="text"
                  name="serial_number"
                  className="form-control"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="Enter serial number"
                />
              </div>

              {/* QUANTITY */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  className="form-control"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              {/* CATEGORY */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Category *
                </label>
                <select
                  className="form-select"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : "Uncategorized"}
                  </option>

                  {categories.map((c) => (
                    <option
                      key={c.category_id}
                      value={String(c.category_id)}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* BUTTONS */}
              <button
                type="submit"
                className="btn btn-success me-2"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/home")}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditItem;