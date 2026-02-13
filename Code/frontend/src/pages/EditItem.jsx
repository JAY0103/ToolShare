import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { itemsService, API_BASE } from "../services/api";

const EditItem = () => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get("item_id");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    image_url: "",
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

        // Load item
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
        });

        // Load categories
        setCategoriesLoading(true);
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
    if (!image_url)
      return "https://via.placeholder.com/400x250?text=No+Image";
    if (image_url.startsWith("http")) return image_url;
    return `${API_BASE}${image_url}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await itemsService.editItem(itemId, {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id || null,
      });

      alert("Item updated successfully!");
      navigate("/home");
    } catch (err) {
      alert(err.message || "Failed to update item");
    }
  };

  if (loading) {
    return (
      <div className="container p-4">
        Loading...
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4">Edit Item</h2>

      <div className="row g-4">
        {/* Image Preview */}
        <div className="col-md-6">
          <div className="card shadow">
            <div
              style={{
                height: "320px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8f9fa",
                overflow: "hidden",
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
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x250?text=Image+Not+Found";
                }}
              />
            </div>

            <div className="p-3 text-muted small">
              Image editing is not enabled here. To change image,
              delete and re-create the item.
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="col-md-6">
          <div className="card shadow p-4">
            <form onSubmit={handleSubmit}>
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

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Description *
                </label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Category */}
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

              <button
                type="submit"
                className="btn btn-success fw-bold me-2"
              >
                Save Changes
              </button>

              <button
                type="button"
                onClick={() => navigate("/home")}
                className="btn btn-secondary fw-bold"
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
