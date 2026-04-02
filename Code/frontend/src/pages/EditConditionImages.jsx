// src/pages/EditConditionImages.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { itemsService, bookingsService, API_BASE } from "../services/api";

const EditConditionImages = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const requestId = location.state?.requestId;
  const type = location.state?.mode; // "checkout" or "return"

  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({ image: null });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // ---------------- LOAD IMAGES ----------------
  useEffect(() => {
    if (!requestId) {
      alert("Invalid request. Please try again.");
      navigate("/home");
      return;
    }

    const fetchImages = async () => {
      try {
        setLoading(true);
        const res = await itemsService.getBorrowRequestConditionImages(requestId);
        setImages(res);
      } catch (err) {
        console.error(err);
        alert("Failed to load condition images");
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [requestId, navigate]);

  // ---------------- FILE SELECT ----------------
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ image: file });
    }
  };

  // ---------------- UPLOAD + ACTION ----------------
  const handleUpload = async () => {
    if (!formData.image) {
      setError("Please select an image first.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("image", formData.image);
      data.append("image_type", type === "checkout" ? "Before" : "After");

      // Upload image
      const res = await itemsService.uploadConditionImage(requestId, data);

      const newImg = res.image_url || res.filename;
      setImages((prev) => [...prev, newImg]);
      setFormData({ image: null });

      // THEN perform action
      if (type === "checkout") {
        await bookingsService.checkoutRequest(requestId);
        alert("Checked out successfully!");
      } else if (type === "return") {
        await bookingsService.returnRequest(requestId);
        alert("Returned successfully!");
      }

      // Redirect
      navigate("/home");

    } catch (err) {
      console.error(err);
      setError("Upload failed. Must be JPEG, PNG, or WebP under 5MB.");
    } finally {
      setUploading(false);
    }
  };

  // ---------------- IMAGE URL ----------------
  const getImageSrc = (image) => {
    if (!image) return "https://via.placeholder.com/150?text=No+Image";
    if (image.startsWith("http")) return image;
    return `${API_BASE}${image}`;
  };

  if (loading) return <div className="container p-4">Loading...</div>;

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-2">
        {type === "checkout" ? "Checkout Condition Images" : "Return Condition Images"}
      </h2>

      <div className="text-muted mb-4">
        {type === "checkout"
          ? "Upload images BEFORE giving the item."
          : "Upload images AFTER receiving the item."}
      </div>

      {/* EXISTING IMAGES */}
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
                  src={getImageSrc(img.image_url || img.filename)}
                  alt={`Condition ${idx + 1}`}
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* UPLOAD CARD */}
      <div className="card shadow p-4" style={{ maxWidth: "400px" }}>
        <h5 className="fw-bold mb-3">Upload Image</h5>

        {error && <div className="alert alert-danger">{error}</div>}

        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="mb-3"
        />

        <div className="d-flex gap-2">
          <button
            className="btn btn-success fw-bold"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload & Continue"}
          </button>

          <button
            className="btn btn-secondary fw-bold"
            onClick={() => navigate("/home")}
          >
            Cancel
          </button>
        </div>

        <div className="mt-2 text-muted small">
          Allowed: JPEG, PNG, WebP (max 5MB)
        </div>
      </div>
    </div>
  );
};

export default EditConditionImages;