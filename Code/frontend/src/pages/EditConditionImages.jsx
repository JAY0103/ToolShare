// src/pages/EditConditionImages.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { itemsService, bookingsService, API_BASE } from "../services/api";

const EditConditionImages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Support BOTH router state and query params
  const requestId =
    location.state?.requestId ||
    searchParams.get("requestId") ||
    searchParams.get("id");

  const type =
    location.state?.mode ||
    searchParams.get("mode") ||
    "view"; // checkout | return | view

  const source = location.state?.source || searchParams.get("source") || "";

  const isCheckout = type === "checkout";
  const isReturn = type === "return";
  const isViewOnly = type === "view";

  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    image: null,
    note: "",
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const backRoute =
    source === "home"
      ? "/"
      : source === "owner-history"
      ? "/owner-booking-history"
      : "/requested-bookings";

  useEffect(() => {
    if (!requestId) {
      alert("Invalid request. Please try again.");
      navigate(backRoute);
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
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [requestId, navigate, backRoute]);

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
    if (isViewOnly) return;

    if (!formData.image) {
      setError("Please select an image first.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("image", formData.image);
      data.append("image_type", isCheckout ? "Before" : "After");

      if (isReturn && formData.note.trim()) {
        data.append("note", formData.note.trim());
      }

      const uploadRes = await itemsService.uploadConditionImage(requestId, data);

      const newImage =
        uploadRes?.image ||
        (uploadRes?.image_url || uploadRes?.filename
          ? {
              image_url: uploadRes.image_url,
              filename: uploadRes.filename,
              image_type: isCheckout ? "Before" : "After",
              note: isReturn ? formData.note.trim() : "",
            }
          : null);

      if (newImage) {
        setImages((prev) => [...prev, newImage]);
      }

      if (isCheckout) {
        await bookingsService.checkoutRequest(requestId);
        alert("Checked out successfully!");
      } else if (isReturn) {
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
    if (!image) return "https://via.placeholder.com/600x400?text=No+Image";

    const path = image?.image_url || image?.filename || image;

    if (typeof path === "string" && path.startsWith("http")) return path;

    if (typeof path === "string" && path.startsWith("/uploads/condition-images/")) {
      return `${API_BASE}${path}`;
    }

    return `${API_BASE}/uploads/condition-images/${path}`;
  };

  const renderImageGrid = (list, emptyText, keyPrefix) => {
    if (list.length === 0) {
      return (
        <div className="border rounded-4 p-4 text-center bg-light-subtle text-muted">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="row g-3">
        {list.map((img, idx) => (
          <div className="col-sm-6" key={`${keyPrefix}-${idx}`}>
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "18px", overflow: "hidden" }}
            >
              <div
                className="bg-light d-flex align-items-center justify-content-center p-2"
                style={{ height: "220px" }}
              >
                <img
                  src={getImageSrc(img)}
                  alt={`${keyPrefix} ${idx + 1}`}
                  className="w-100 h-100"
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                    borderRadius: "12px",
                    background: "#fff",
                  }}
                />
              </div>

              {img?.note ? (
                <div className="card-body py-3">
                  <div className="small text-muted">
                    <span className="fw-semibold text-dark">Note:</span> {img.note}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
          <div className="text-center">
            <div className="spinner-border text-success mb-3" role="status" />
            <div className="fw-semibold text-muted">Loading condition images...</div>
          </div>
        </div>
      </div>
    );
  }

  const badgeText = isCheckout
    ? "Checkout Flow"
    : isReturn
    ? "Return Flow"
    : "View Only";

  const titleText = isCheckout
    ? "Checkout Condition Images"
    : isReturn
    ? "Return Condition Images"
    : "Condition Images";

  const subtitleText = isCheckout
    ? "Upload an image before giving the item to the user so the condition is recorded clearly."
    : isReturn
    ? "Upload an image after receiving the item back. You can also add a note for damage, missing parts, or anything important."
    : "View the item condition images recorded during checkout and return.";

  return (
    <div className="container-fluid px-3 px-md-4 py-4 py-md-5">
      <div className="mx-auto" style={{ maxWidth: "1280px" }}>
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: "22px", overflow: "hidden" }}
        >
          <div className="card-body p-4 p-md-5">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <div className="d-inline-flex align-items-center px-3 py-2 rounded-pill bg-light text-success fw-semibold small mb-3">
                  {badgeText}
                </div>

                <h2 className="fw-bold mb-2">{titleText}</h2>

                <p className="text-muted mb-0" style={{ maxWidth: "760px" }}>
                  {subtitleText}
                </p>
              </div>

              <button
                className="btn btn-outline-secondary fw-semibold px-4"
                onClick={() => navigate(backRoute)}
                disabled={uploading}
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4 align-items-start">
          <div className={isViewOnly ? "col-12" : "col-xl-8"}>
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "22px", overflow: "hidden" }}
            >
              <div className="card-body p-4 p-md-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
                  <div>
                    <h4 className="fw-bold mb-1">Condition Comparison</h4>
                    <p className="text-muted mb-0">
                      Compare item images from before checkout and after return.
                    </p>
                  </div>
                </div>

                {images.length === 0 ? (
                  <div className="alert alert-info border-0 rounded-4 mb-0">
                    No condition images available yet.
                  </div>
                ) : (
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div
                        className="h-100 p-3 p-md-4"
                        style={{
                          background: "#f8f9fa",
                          borderRadius: "20px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <h5 className="fw-bold mb-0">Before Checkout</h5>
                          <span className="badge text-bg-primary rounded-pill px-3 py-2">
                            {beforeImages.length}
                          </span>
                        </div>

                        {renderImageGrid(
                          beforeImages,
                          "No checkout images uploaded yet.",
                          "before"
                        )}
                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div
                        className="h-100 p-3 p-md-4"
                        style={{
                          background: "#f8f9fa",
                          borderRadius: "20px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <h5 className="fw-bold mb-0">After Return</h5>
                          <span className="badge text-bg-success rounded-pill px-3 py-2">
                            {afterImages.length}
                          </span>
                        </div>

                        {renderImageGrid(
                          afterImages,
                          "No return images uploaded yet.",
                          "after"
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isViewOnly && (
            <div className="col-xl-4">
              <div
                className="card border-0 shadow-sm"
                style={{ borderRadius: "22px", overflow: "hidden" }}
              >
                <div className="card-body p-4 p-md-4">
                  <h5 className="fw-bold mb-1">
                    {isCheckout ? "Upload Checkout Image" : "Upload Return Image"}
                  </h5>
                  <p className="text-muted small mb-4">
                    Allowed formats: JPEG, PNG, WebP. Maximum size: 5MB.
                  </p>

                  {error && (
                    <div className="alert alert-danger rounded-4 border-0">{error}</div>
                  )}

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Select Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="form-control"
                      style={{ borderRadius: "14px", padding: "12px" }}
                    />
                    {formData.image && (
                      <div className="small text-muted mt-2">
                        Selected: <span className="fw-semibold">{formData.image.name}</span>
                      </div>
                    )}
                  </div>

                  {isReturn && (
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        Return Note / Damage Note
                      </label>
                      <textarea
                        className="form-control"
                        rows={5}
                        placeholder="Example: Small scratch on the side, charger missing, item returned in good condition, etc."
                        value={formData.note}
                        onChange={handleNoteChange}
                        style={{ borderRadius: "14px", resize: "none" }}
                      />
                      <div className="form-text">
                        Add any note about damage, missing parts, or item condition.
                      </div>
                    </div>
                  )}

                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-success fw-bold py-2"
                      onClick={handleUploadAndContinue}
                      disabled={uploading}
                      style={{ borderRadius: "14px" }}
                    >
                      {uploading
                        ? "Processing..."
                        : isCheckout
                        ? "Upload & Check Out"
                        : "Upload & Return"}
                    </button>

                    <button
                      className="btn btn-light fw-semibold py-2"
                      onClick={() => navigate(backRoute)}
                      disabled={uploading}
                      style={{ borderRadius: "14px", border: "1px solid #dee2e6" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="card border-0 shadow-sm mt-4"
                style={{ borderRadius: "22px" }}
              >
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-2">Tip</h6>
                  <p className="text-muted small mb-0">
                    Try to capture the full item clearly so comparison is easier later.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditConditionImages;