// src/pages/EditConditionImages.jsx
import React, { useEffect, useMemo, useState } from "react";
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

        const normalizedImages = Array.isArray(res)
          ? res
          : Array.isArray(res?.images)
          ? res.images
          : [];

        setImages(normalizedImages);
      } catch (err) {
        console.error("Condition image load failed:", err);
        // Keep the page open even if fetch fails or there are no old images yet
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

  const normalizeImageType = (value) => String(value || "").trim().toLowerCase();

  const beforeImages = useMemo(
    () => images.filter((img) => normalizeImageType(img?.image_type) === "before"),
    [images]
  );

  const afterImages = useMemo(
    () => images.filter((img) => normalizeImageType(img?.image_type) === "after"),
    [images]
  );

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

      // For return, optionally send a note with the upload too
      if (type === "return" && formData.note.trim()) {
        data.append("note", formData.note.trim());
      }

      // Upload image first
      const uploadRes = await itemsService.uploadConditionImage(requestId, data);

      // If backend returns full image object, use it.
      // Otherwise create a fallback object so UI updates immediately.
      const newImage =
        uploadRes?.image ||
        (uploadRes?.image_url || uploadRes?.filename
          ? {
              image_url: uploadRes.image_url,
              filename: uploadRes.filename,
              image_type: type === "checkout" ? "Before" : "After",
              note: type === "return" ? formData.note.trim() : "",
            }
          : null);

      if (newImage) {
        setImages((prev) => [...prev, newImage]);
      }

      // 2. Then perform booking action
      if (type === "checkout") {
        await bookingsService.checkoutRequest(requestId);
        alert("Checked out successfully!");
      } else if (type === "return") {
        await bookingsService.returnRequest(requestId, formData.note.trim());
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

    const path = image?.image_url || image?.filename || image;

    if (typeof path === "string" && path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };

  const renderImageGrid = (list, emptyText, keyPrefix) => {
    if (list.length === 0) {
      return <div className="alert alert-light mb-0">{emptyText}</div>;
    }

    return (
      <div className="row g-3">
        {list.map((img, idx) => (
          <div className="col-6" key={`${keyPrefix}-${idx}`}>
            <div className="border rounded p-2 bg-light">
              <img
                src={getImageSrc(img)}
                alt={`${keyPrefix} ${idx + 1}`}
                className="img-fluid rounded"
                style={{ height: "180px", width: "100%", objectFit: "cover" }}
              />
              {img?.note ? (
                <div className="small text-muted mt-2">
                  <strong>Note:</strong> {img.note}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
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

      {/* Condition comparison section */}
      <div className="mb-4">
        <h4 className="fw-bold mb-3">Condition Comparison</h4>

        {images.length === 0 ? (
          <div className="alert alert-info">No condition images yet.</div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card shadow h-100">
                <div className="card-header bg-primary text-white fw-bold">
                  Before Checkout
                </div>
                <div className="card-body">
                  {renderImageGrid(
                    beforeImages,
                    "No checkout images uploaded yet.",
                    "before"
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow h-100">
                <div className="card-header bg-success text-white fw-bold">
                  After Return
                </div>
                <div className="card-body">
                  {renderImageGrid(
                    afterImages,
                    "No return images uploaded yet.",
                    "after"
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload card */}
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