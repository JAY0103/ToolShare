import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { itemsService, API_BASE } from "../services/api";

const MAX_SERIAL_LENGTH = 15;

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
    quantity: "0", // keep as string for smoother editing
  });

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
          category_id: found.category_id ? String(found.category_id) : "",
          image_url: found.image_url || "",
          serial_number: found.serial_number || "",
          quantity: String(found.quantity ?? 0),
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

  const getImageSrc = (image_url) => {
    if (!image_url) {
      return "https://via.placeholder.com/400x250?text=No+Image";
    }
    if (image_url.startsWith("http")) return image_url;
    return `${API_BASE}${image_url}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "quantity") {
      // allow empty value while typing, digits only
      if (value === "" || /^[0-9]+$/.test(value)) {
        setFormData((prev) => ({
          ...prev,
          quantity: value,
        }));
      }
      return;
    }

    if (name === "serial_number") {
      setFormData((prev) => ({
        ...prev,
        serial_number: value.slice(0, MAX_SERIAL_LENGTH),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuantityBlur = () => {
    const qty = parseInt(formData.quantity, 10);

    if (Number.isNaN(qty) || qty < 0) {
      setFormData((prev) => ({
        ...prev,
        quantity: "0",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      alert("Please fill all required fields");
      return;
    }

    const parsedQty = parseInt(formData.quantity, 10);

    if (Number.isNaN(parsedQty) || parsedQty < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    const cleanedSerial = formData.serial_number.trim();

    if (cleanedSerial.length > MAX_SERIAL_LENGTH) {
      alert(`Serial number cannot be more than ${MAX_SERIAL_LENGTH} characters`);
      return;
    }

    try {
      setSubmitting(true);

      await itemsService.editItem(itemId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id || null,
        serial_number: cleanedSerial || null,
        quantity: parsedQty,
      });

      alert("Item updated successfully!");
      navigate("/home");
    } catch (err) {
      alert(err.message || "Failed to update item");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container p-4 text-center">
        Loading item details...
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4">Edit Item</h2>

      <div className="row g-4">
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

        <div className="col-md-6">
          <div className="card shadow p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold">Item Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Description *</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serial_number"
                  className="form-control"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="Enter serial number if available"
                  maxLength={MAX_SERIAL_LENGTH}
                />
                <small className="text-muted">
                  Optional. Max {MAX_SERIAL_LENGTH} characters.
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Quantity *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="quantity"
                  className="form-control"
                  value={formData.quantity}
                  onChange={handleChange}
                  onBlur={handleQuantityBlur}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Category *</label>
                <select
                  className="form-select"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading ? "Loading categories..." : "Uncategorized"}
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