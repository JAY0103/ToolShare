// src/pages/EditConditionImages.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { itemsService, bookingsService, API_BASE } from "../services/api";

const EditConditionImages = () => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get("item_id");
  const requestId = searchParams.get("request_id");
  const type = searchParams.get("type"); // "checkout" or "return"
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({ image: null });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Fetch current condition images
  useEffect(() => {
    if (!itemId) {
      alert("Invalid item");
      navigate("/home");
      return;
    }

    const fetchImages = async () => {
      try {
        setLoading(true);
        const res = await itemsService.uploadConditionImage(requestId, formData.image, type);
		      	      setImages(res.data?.images || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load condition images");
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [itemId, navigate]);

  const handleChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleUpload = async () => {
    if (!formData.image) {
      setError("Please select an image first.");
      return;
    }

    setUploading(true);
    setError("");

    const data = new FormData();
    data.append("image", formData.image);
    data.append("image_type", type === "checkout" ? "Before" : "After"); // ✅ FIX

    try {
      // ✅ FIX: use requestId instead of itemId
      const res = await itemsService.uploadConditionImage(requestId, data);

      const newImg = res.data.filename || res.data.image_url;
      setImages((prev) => [...prev, newImg]);
      setFormData({ image: null });

      if (type === "checkout") {
        await bookingsService.checkoutRequest(requestId);
        alert("Checked out successfully!");
      } else if (type === "return") {
        await bookingsService.returnRequest(requestId);
        alert("Returned successfully!");
      }

      navigate("/requested-bookings");

    } catch (err) {
      console.error(err);
      setError("Upload failed. Must be JPEG, PNG, or WebP under 5MB.");
    } finally {
      setUploading(false);
    }
  };

  const getImageSrc = (image) => {
    if (!image) return "https://via.placeholder.com/150?text=No+Image";
    if (image.startsWith("http")) return image;
    return `${API_BASE}${image}`;
  };

  if (loading) return <div className="container p-4">Loading...</div>;

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4">Edit Condition Images</h2>

      {/* Current images */}
      <div className="row g-4 mb-4">
        {images.length === 0 && (
          <div className="col-12">
            <div className="alert alert-info">No condition images yet.</div>
          </div>
        )}

        {images.map((img, idx) => (
          <div className="col-md-3" key={idx}>
            <div className="card shadow">
              <div
                style={{
                  height: "180px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  background: "#f8f9fa",
                }}
              >
                <img
                  src={getImageSrc(img)}
                  alt={`Condition ${idx + 1}`}
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://via.placeholder.com/150?text=Image+Not+Found")
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload card */}
      <div className="card shadow p-4" style={{ maxWidth: "400px" }}>
        <h5 className="fw-bold mb-3">Upload New Condition Image</h5>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            key={formData.image ? formData.image.name : ""}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-success fw-bold"
            onClick={handleUpload}
            disabled={uploading || !formData.image}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            type="button"
            className="btn btn-secondary fw-bold"
            onClick={() => navigate("/home")}
          >
            Cancel
          </button>
        </div>

        <div className="mt-2 text-muted small">
          Allowed: JPEG, PNG, WebP. Max size: 5MB.
        </div>
      </div>
    </div>
  );
};

export default EditConditionImages;
