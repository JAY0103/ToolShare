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
  const [formData, setFormData] = useState({
    image: null,
    note: "",
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requestId) {
      alert("Invalid request. Please try again.");
      navigate("/requested-bookings");
      return;
    }

    const fetchImages = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await itemsService.getBorrowRequestConditionImages(requestId);
        setImages(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Condition image load failed:", err);
        // Keep page open even if no previous images exist
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [requestId, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setError("");
    }
  };

  const handleNoteChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      note: e.target.value,
    }));
  };

  const handleUploadAndContinue = async () => {
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

      // note can also be sent with image upload for return type, so we don't have to rely on the return endpoint supporting notes
      if (type === "return" && formData.note.trim()) {
        data.append("note", formData.note.trim());
      }

      // upload image first
      const uploadRes = await itemsService.uploadConditionImage(requestId, data);

      const newImg = uploadRes?.image_url || uploadRes?.filename;
      if (newImg) {
        setImages((prev) => [...prev, newImg]);
      }

      // then perform action
      if (type === "checkout") {
        await bookingsService.checkoutRequest(requestId);
        alert("Checked out successfully!");
      } else if (type === "return") {
        
        if (typeof bookingsService.returnRequest === "function") {
          await bookingsService.returnRequest(requestId, formData.note.trim());
        } else {
          throw new Error("Return service is not available.");
        }

        alert("Returned successfully!");
      } else {
        throw new Error("Invalid action type.");
      }

      navigate("/requested-bookings");
    } catch (err) {
      console.error("Upload/action failed:", err);
      setError(err?.message || "Upload failed. Must be JPEG, PNG, or WebP under 5MB.");
    } finally {
      setUploading(false);
    }
  };

  const getImageSrc = (image) => {
    if (!image) return "https://via.placeholder.com/150?text=No+Image";
    if (typeof image === "string" && image.startsWith("http")) return image;

    const path = image?.image_url || image?.filename || image;
    if (typeof path === "string" && path.startsWith("http")) return path;

    return `${API_BASE}${path}`;
  };

  if (loading) {
    return <div className="container p-4">Loading...</div>;
  }

  return (
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-2">
        {type === "checkout" ? "Checkout Condition Images" : "Return Condition Images"}
      </h2>

      <div className="text-muted mb-4">
        {type === "checkout"
          ? "Upload an image before giving the item to the user."
          : "Upload an image after receiving the item back. Add a note if there is damage or anything important to mention."}
      </div>

      {/* existing images */}
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
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* upload card */}
      <div className="card shadow p-4" style={{ maxWidth: "520px" }}>
        <h5 className="fw-bold mb-3">
          {type === "checkout" ? "Upload Checkout Image" : "Upload Return Image"}
        </h5>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label className="form-label fw-semibold">Select Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="form-control"
          />
        </div>

        {type === "return" && (
          <div className="mb-3">
            <label className="form-label fw-semibold">Return Note / Damage Note</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Example: Small scratch on the side, charger missing, item returned in good condition, etc."
              value={formData.note}
              onChange={handleNoteChange}
            />
            <div className="form-text">
              Add any note about damage, missing parts, or item condition.
            </div>
          </div>
        )}

        <div className="d-flex gap-2">
          <button
            className="btn btn-success fw-bold"
            onClick={handleUploadAndContinue}
            disabled={uploading}
          >
            {uploading
              ? "Processing..."
              : type === "checkout"
              ? "Upload & Check Out"
              : "Upload & Return"}
          </button>

          <button
            className="btn btn-secondary fw-bold"
            onClick={() => navigate("/requested-bookings")}
            disabled={uploading}
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