// src/pages/AddItem.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemsService } from "../services/api";

const AddItem = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    quantity: 1,
    image: null,
  });

  const [serialNumbers, setSerialNumbers] = useState([""]);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCats(true);
        const cats = await itemsService.getCategories();
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        setCategories([]);
      } finally {
        setLoadingCats(false);
      }
    };

    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      return;
    }

    if (name === "quantity") {
      let qty = parseInt(value, 10);

      if (isNaN(qty) || qty < 1) qty = 1;

      setFormData((prev) => ({ ...prev, quantity: qty }));

      setSerialNumbers((prev) => {
        const next = [...prev];

        if (qty > next.length) {
          while (next.length < qty) next.push("");
        } else if (qty < next.length) {
          next.length = qty;
        }

        return next;
      });

      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSerialChange = (index, value) => {
    setSerialNumbers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

//HaandleSubmit route (will submit multiple items as well)
const handleSubmit = async (e) => {
  e.preventDefault();

  const quantity = Number(formData.quantity) || 1;

  if (quantity < 1) {
    alert("Quantity must be at least 1.");
    return;
  }

  const cleanedSerials = serialNumbers.map((s) => s.trim());

  if (cleanedSerials.some((s) => !s)) {
    alert("Please fill in all serial number fields.");
    return;
  }

  const uniqueSerials = new Set(cleanedSerials);
  if (uniqueSerials.size !== cleanedSerials.length) {
    alert("Serial numbers must be unique.");
    return;
  }

  try {
    // 🔹 NEW: send one request per serial number
    for (const serial of cleanedSerials) {
      const data = new FormData();

      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("quantity", 1); // always 1 per request
      data.append("serial_number", serial);

      if (formData.category_id) {
        data.append("category_id", formData.category_id);
      }

      if (formData.image) {
        data.append("image", formData.image);
      }

      await itemsService.addItem(data);
    }

    alert("Items added successfully!");
    navigate("/home");

  } catch (err) {
    console.error("Add item error:", err.message);
    alert(err.message || "Failed to add item(s)");
  }
};

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-3">Add New Item</h2>

      <div className="card shadow p-4" style={{ maxWidth: "700px" }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Item Name *</label>
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
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-control"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Quantity *</label>
            <input
              type="number"
              name="quantity"
              className="form-control"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
            <small className="text-muted">
              Enter how many tools of the same item you want to add.
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label">
              Serial Number{formData.quantity > 1 ? "s" : ""} *
            </label>

            {serialNumbers.map((serial, index) => (
              <input
                key={index}
                type="text"
                className="form-control mb-2"
                placeholder={`Serial Number ${index + 1}`}
                value={serial}
                onChange={(e) => handleSerialChange(index, e.target.value)}
                required
              />
            ))}

            <small className="text-muted">
              A separate serial number is required for each tool.
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label">Category *</label>
            <select
              name="category_id"
              className="form-select"
              onChange={handleChange}
              value={formData.category_id}
              disabled={loadingCats}
              required
            >
              <option value="">
                {loadingCats ? "Loading categories..." : "Select a category"}
              </option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Upload Image *</label>
            <input
              type="file"
              name="image"
              className="form-control"
              accept="image/*"
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-success fw-bold">
            Add Item
          </button>

          <button
            type="button"
            onClick={() => navigate("/home")}
            className="btn btn-secondary ms-3 fw-bold"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
