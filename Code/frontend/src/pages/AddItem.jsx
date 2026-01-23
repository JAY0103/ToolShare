// src/pages/AddItem.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddItem = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    serial_number: "",
    image: null,
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setFormData((p) => ({ ...p, [name]: files[0] }));
    else setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    if (formData.serial_number) data.append("serial_number", formData.serial_number);
    if (formData.image) data.append("image", formData.image);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:3000/api/items", data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        alert("Item added successfully!");
        navigate("/home");
      }
    } catch (err) {
      console.error("Add item error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to add item");
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-3">Add New Item</h2>

      <div className="card shadow p-4" style={{ maxWidth: "650px" }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Item Name *</label>
            <input type="text" name="name" className="form-control" onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Description *</label>
            <textarea name="description" className="form-control" rows="4" onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Serial Number (Optional)</label>
            <input type="text" name="serial_number" className="form-control" onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label">Upload Image (Optional)</label>
            <input type="file" name="image" className="form-control" accept="image/*" onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-success fw-bold">
            Add Item
          </button>

          <button type="button" onClick={() => navigate("/home")} className="btn btn-secondary ms-3 fw-bold">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
