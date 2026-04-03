// src/pages/AddItem.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemsService } from "../services/api";

const MAX_SERIAL_LENGTH = 15;

const AddItem = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    quantity: "1", 
    image: null,
  });

  const [hasNoSerialNumber, setHasNoSerialNumber] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState([""]);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const parsedQuantity = useMemo(() => {
    const qty = parseInt(formData.quantity, 10);
    return Number.isNaN(qty) ? 0 : qty;
  }, [formData.quantity]);

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

  useEffect(() => {
    // Only resize serial number inputs when quantity is a valid positive number
    if (parsedQuantity >= 1) {
      setSerialNumbers((prev) => {
        const next = [...prev];

        if (parsedQuantity > next.length) {
          while (next.length < parsedQuantity) next.push("");
        } else if (parsedQuantity < next.length) {
          next.length = parsedQuantity;
        }

        return next;
      });
    }
  }, [parsedQuantity]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      return;
    }

    if (name === "quantity") {
      // Allow only digits to be entered
      if (value === "" || /^[0-9]+$/.test(value)) {
        setFormData((prev) => ({ ...prev, quantity: value }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuantityBlur = () => {
    const qty = parseInt(formData.quantity, 10);

    if (Number.isNaN(qty) || qty < 1) {
      setFormData((prev) => ({ ...prev, quantity: "1" }));
    }
  };

  const handleSerialChange = (index, value) => {
    const trimmedValue = value.slice(0, MAX_SERIAL_LENGTH);

    setSerialNumbers((prev) => {
      const next = [...prev];
      next[index] = trimmedValue;
      return next;
    });
  };

  const handleNoSerialToggle = (e) => {
    const checked = e.target.checked;
    setHasNoSerialNumber(checked);

    if (checked) {
      setSerialNumbers([]);
    } else {
      const qty = parsedQuantity >= 1 ? parsedQuantity : 1;
      setSerialNumbers(Array.from({ length: qty }, () => ""));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const quantity = parseInt(formData.quantity, 10);

    if (Number.isNaN(quantity) || quantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    if (!hasNoSerialNumber) {
      const cleanedSerials = serialNumbers.map((s) => s.trim());

      if (cleanedSerials.length !== quantity) {
        alert("Serial number count does not match quantity.");
        return;
      }

      if (cleanedSerials.some((s) => !s)) {
        alert("Please fill in all serial number fields.");
        return;
      }

      if (cleanedSerials.some((s) => s.length > MAX_SERIAL_LENGTH)) {
        alert(`Serial numbers cannot be more than ${MAX_SERIAL_LENGTH} characters.`);
        return;
      }

      const uniqueSerials = new Set(cleanedSerials.map((s) => s.toLowerCase()));
      if (uniqueSerials.size !== cleanedSerials.length) {
        alert("Serial numbers must be unique.");
        return;
      }
    }

    try {
      setSubmitting(true);

      for (let i = 0; i < quantity; i++) {
        const data = new FormData();

        data.append("name", formData.name.trim());
        data.append("description", formData.description.trim());
        data.append("quantity", 1);

        // For items without serial number:
        // send empty string, or change this to a generated internal value if your backend needs one
        const serial = hasNoSerialNumber ? "" : serialNumbers[i].trim();
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="mx-auto" style={{ maxWidth: "820px" }}>
        <div className="mb-4">
          <h2 className="fw-bold mb-1">Add New Item</h2>
          <p className="text-muted mb-0">
            Add one or multiple tools with a cleaner and easier form.
          </p>
        </div>

        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-12">
                  <label className="form-label fw-semibold">Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control form-control-lg rounded-3"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter item name"
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Description *</label>
                  <textarea
                    name="description"
                    className="form-control rounded-3"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Write a short description"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Quantity *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="quantity"
                    className="form-control form-control-lg rounded-3"
                    value={formData.quantity}
                    onChange={handleChange}
                    onBlur={handleQuantityBlur}
                    placeholder="Enter quantity"
                    required
                  />
                  <small className="text-muted">
                    You can clear this with backspace and type a new value.
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Category *</label>
                  <select
                    name="category_id"
                    className="form-select form-select-lg rounded-3"
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

                <div className="col-12">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="noSerialNumber"
                      checked={hasNoSerialNumber}
                      onChange={handleNoSerialToggle}
                    />
                    <label className="form-check-label fw-medium" htmlFor="noSerialNumber">
                      This item does not have a serial number
                    </label>
                  </div>

                  {!hasNoSerialNumber && (
                    <div className="border rounded-4 p-3 bg-light-subtle">
                      <label className="form-label fw-semibold mb-3">
                        Serial Number{parsedQuantity > 1 ? "s" : ""} *
                      </label>

                      <div className="row g-3">
                        {serialNumbers.map((serial, index) => (
                          <div key={index} className="col-12 col-md-6">
                            <label className="form-label small text-muted">
                              Serial Number {index + 1}
                            </label>
                            <input
                              type="text"
                              className="form-control rounded-3"
                              placeholder={`Enter serial number ${index + 1}`}
                              value={serial}
                              maxLength={MAX_SERIAL_LENGTH}
                              onChange={(e) => handleSerialChange(index, e.target.value)}
                              required={!hasNoSerialNumber}
                            />
                            <small className="text-muted">
                              Max {MAX_SERIAL_LENGTH} characters
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasNoSerialNumber && (
                    <div className="alert alert-secondary rounded-4 mb-0">
                      Serial number is optional for this item. The item will be saved without one.
                    </div>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Upload Image *</label>
                  <input
                    type="file"
                    name="image"
                    className="form-control form-control-lg rounded-3"
                    accept="image/*"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-success px-4 py-2 fw-semibold rounded-3"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Item"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="btn btn-outline-secondary px-4 py-2 fw-semibold rounded-3"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItem;