// src/pages/AddItem.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemsService } from "../services/api";

const AddItem = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    serial_number: "",
    category_id: "",
    quantity: 1,
    image: null,
  });

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
      setFormData((p) => ({ ...p, [name]: files[0] }));
      return;
    }

    if (name === "quantity") {
      let qty = Number(value);
      if (Number.isNaN(qty) || qty < 1) qty = 1;

      setFormData((p) => ({ ...p, quantity: qty }));
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const quantity = Number(formData.quantity) || 1;

    if (quantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    const serialInput = formData.serial_number.trim();

    if (!serialInput) {
      alert("Please enter serial number(s).");
      return;
    }

    const serialNumbers = serialInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (serialNumbers.length !== quantity) {
      alert(`Please enter exactly ${quantity} serial numbers separated by commas.`);
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("quantity", quantity);
    data.append("serial_number", serialInput);

    if (formData.category_id) data.append("category_id", formData.category_id);
    if (formData.image) data.append("image", formData.image);

    try {
      await itemsService.addItem(data);
      alert("Item(s) added successfully!");
      navigate("/home");
    } catch (err) {
      console.error("Add item error:", err.message);
      alert(err.message || "Failed to add item(s)");
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-3">Add New Item</h2>

      <div className="card shadow p-4" style={{ maxWidth: "650px" }}>
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

          {/* Quantity */}
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
          </div>

          {/* Serial numbers */}
          <div className="mb-3">
            <label className="form-label">
              {formData.quantity > 1 ? "Serial Numbers *" : "Serial Number *"}
            </label>

            <input
              type="text"
              name="serial_number"
              className="form-control"
              value={formData.serial_number}
              onChange={handleChange}
              required
              placeholder={
                formData.quantity > 1
                  ? "Enter serial numbers separated by commas"
                  : "Enter serial number"
              }
            />

            <small className="text-muted">
              {formData.quantity > 1
                ? `Enter ${formData.quantity} serial numbers separated by commas`
                : "Enter one serial number"}
            </small>
          </div>

          {/* Category */}
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

          {/* Image */}
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