// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemsService, bookingsService } from "../services/api";

const Home = ({ searchTerm = "" }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isFaculty = user?.user_type?.toLowerCase() === "faculty";

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // student bookings OR faculty incoming
  const [myRequests, setMyRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);

      const items = await itemsService.getItems();
      setAllItems(Array.isArray(items) ? items : []);

      if (isFaculty) {
        const reqs = await bookingsService.getRequestedBookings();
        setIncomingRequests(Array.isArray(reqs) ? reqs : []);
        setMyRequests([]); // clear student list
      } else {
        const reqs = await bookingsService.getMyBookings();
        setMyRequests(Array.isArray(reqs) ? reqs : []);
        setIncomingRequests([]); // clear faculty list
      }
    } catch (e) {
      setAllItems([]);
      setMyRequests([]);
      setIncomingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFaculty]);

  const getImageSrc = (image_url) => {
    if (!image_url) return "https://via.placeholder.com/400x250?text=ToolShare";
    if (image_url.startsWith("http")) return image_url;
    return `http://localhost:3000${image_url}`;
  };

  // ---- Recommendation logic (student only)
  const recommendedItems = useMemo(() => {
    if (isFaculty) return [];

    const bookedNames = myRequests
      .map((r) => (r.item_name || "").toLowerCase())
      .filter(Boolean);

    // If no history, show a few newest items
    if (bookedNames.length === 0) {
      return [...allItems].slice(0, 6);
    }

    const keywords = new Set();
    for (const name of bookedNames) {
      name.split(/\s+/).forEach((w) => {
        const clean = w.replace(/[^a-z0-9]/g, "");
        if (clean.length >= 3) keywords.add(clean);
      });
    }

    const bookedItemIds = new Set(myRequests.map((r) => r.item_id));

    const scored = allItems
      .filter((i) => !bookedItemIds.has(i.item_id))
      .map((i) => {
        const text = `${i.name || ""} ${i.description || ""}`.toLowerCase();
        let score = 0;
        keywords.forEach((k) => {
          if (text.includes(k)) score += 1;
        });
        return { item: i, score };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored
      .filter((x) => x.score > 0)
      .slice(0, 6)
      .map((x) => x.item);

    if (top.length > 0) return top;

    return [...allItems].slice(0, 6);
  }, [allItems, myRequests, isFaculty]);

  // faculty dashboard cards
  const pendingIncoming = useMemo(() => {
    return incomingRequests.filter(
      (r) => (r.status || "").toLowerCase() === "pending"
    ).length;
  }, [incomingRequests]);

  // student dashboard cards
  const pendingMine = useMemo(() => {
    return myRequests.filter((r) => (r.status || "").toLowerCase() === "pending")
      .length;
  }, [myRequests]);

  // For student: only THEIR bookings due today
  // For faculty: ALL incoming bookings due today
  const dueTodayCount = useMemo(() => {
    const list = isFaculty ? incomingRequests : myRequests;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return list.filter((r) => {
      // Only count approved bookings as "due"
      const status = (r.status || "").toLowerCase();
      if (status !== "approved") return false;

      const end = new Date(r.requested_end);

      return end >= startOfDay && end < endOfDay;
    }).length;
  }, [isFaculty, incomingRequests, myRequests]);

  // apply searchTerm ONLY to recommended list on Home
  const displayedRecommended = useMemo(() => {
    if (!searchTerm) return recommendedItems;
    const term = searchTerm.toLowerCase();
    return recommendedItems.filter(
      (i) =>
        i.name?.toLowerCase().includes(term) ||
        i.description?.toLowerCase().includes(term)
    );
  }, [recommendedItems, searchTerm]);

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Welcome{user?.first_name ? `, ${user.first_name}` : ""} 👋
          </h2>
          <span
            className={`badge ${isFaculty ? "bg-warning text-dark" : "bg-success"}`}
          >
            {isFaculty ? "Faculty Dashboard" : "Student Dashboard"}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card p-3 shadow-sm">
            <div className="fw-bold text-muted">Total Items</div>
            <div className="fs-3 fw-bold">{allItems.length}</div>
          </div>
        </div>

        {!isFaculty ? (
          <div className="col-md-4">
            <div className="card p-3 shadow-sm">
              <div className="fw-bold text-muted">My Pending Requests</div>
              <div className="fs-3 fw-bold">{pendingMine}</div>
            </div>
          </div>
        ) : (
          <div className="col-md-4">
            <div className="card p-3 shadow-sm">
              <div className="fw-bold text-muted">Pending Incoming</div>
              <div className="fs-3 fw-bold">{pendingIncoming}</div>
            </div>
          </div>
        )}

        <div className="col-md-4">
          <div className="card p-3 shadow-sm">
            <div className="fw-bold text-muted">
              {isFaculty ? "Bookings Due Today" : "My Bookings Due Today"}
            </div>
            <div className="fs-3 fw-bold">{dueTodayCount}</div>
          </div>
        </div>
      </div>

      {/* Recommended section (student only) */}
      {!isFaculty && (
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 className="fw-bold mb-0">Recommended for you</h4>
          <span className="text-muted small">Based on your previous bookings</span>
        </div>
      )}

      {/* Faculty info */}

      {loading ? (
        <div className="text-center py-5">Loading dashboard...</div>
      ) : !isFaculty ? (
        displayedRecommended.length === 0 ? (
          <div className="alert alert-info">
            No recommendations found yet. Try booking an item from <b>Browse Items</b>.
          </div>
        ) : (
          <div className="items-grid">
            {displayedRecommended.map((item) => (
              <div key={item.item_id} className="item-card shadow-sm">
                <div className="img-frame">
                  <img
                    src={getImageSrc(item.image_url)}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/400x250?text=Image+Not+Found";
                    }}
                  />
                </div>

                <h5 className="fw-bold mt-2 mb-1">{item.name}</h5>
                <p className="text-muted mb-2">
                  {item.description?.substring(0, 90) || "No description"}
                </p>
                <button
                  className="btn btn-success fw-bold"
                  onClick={() => navigate(`/book-item?item_id=${item.item_id}`)}
                >
                  Request
                </button>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
};

export default Home;
