// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { itemsService, bookingsService, adminService, API_BASE } from "../services/api";

const CART_KEY = "cart";

const Home = ({ searchTerm = "" }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const userType = String(user?.user_type || "").toLowerCase();
  const isFaculty = userType === "faculty";
  const isAdmin = userType === "admin";
  const isStaff = isFaculty || isAdmin;

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // student bookings OR faculty incoming requests
  const [myRequests, setMyRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  // admin-only data
  const [adminRequests, setAdminRequests] = useState([]);
  const [reports, setReports] = useState({
    statusCounts: [],
    topTools: [],
    topBorrowers: [],
  });

  // kept for compatibility (admin filters)
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // local action loading map
  const [actionBusy, setActionBusy] = useState({}); // { [request_id]: true }

  const getImageSrc = (image_url) => {
    if (!image_url) return "https://via.placeholder.com/400x250?text=ToolShare";
    if (String(image_url).startsWith("http")) return image_url;
    return `${API_BASE}${image_url}`;
  };

  // ----------- tiny helpers -----------
  const safeArr = (x) => (Array.isArray(x) ? x : []);
  const setBusy = (id, val) => setActionBusy((prev) => ({ ...prev, [id]: val }));

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "—";
    }
  };

  // normalize status once, use everywhere
  const normStatus = (s) => String(s || "").toLowerCase().replace(/\s+/g, "");
  const isStatus = (s, target) => normStatus(s) === normStatus(target);

  // student-friendly labels
  const displayStatus = (s) => {
    const v = normStatus(s);
    if (v === "pending") return "Requested";
    if (v === "approved") return "Approved";
    if (v === "rejected") return "Rejected";
    if (v === "checkedout") return "Checked Out";
    if (v === "returned") return "Returned";
    if (v === "overdue") return "Overdue";
    if (v === "cancelled" ) return "Cancelled";
    return s || "—";
  };

  const badgeClassForStatus = (s) => {
    const v = normStatus(s);
    if (v === "pending") return "bg-warning text-dark";
    if (v === "approved") return "bg-success";
    if (v === "rejected") return "bg-danger";
    if (v === "checkedout") return "bg-primary";
    if (v === "returned") return "bg-secondary";
    if (v === "overdue") return "bg-dark";
    if (v === "canceled" ) return "bg-secondary";
    return "bg-dark";
  };

  // DATE HELPERS
  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const endOfToday = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const isWithinToday = (dateStr) => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return t >= startOfToday().getTime() && t <= endOfToday().getTime();
  };

  const isPast = (dateStr) => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return t < Date.now();
  };

  // created date helper
  const getRequestCreatedDate = (r) => r?.created_at || r?.createdAt || r?.request_date || null;

  // ----------- API action resolver -----------
  const callStatusUpdate = async (requestId, nextStatus) => {
    const candidates = [
      adminService?.updateRequestStatus,
      adminService?.setRequestStatus,
      adminService?.changeRequestStatus,
      adminService?.updateBookingStatus,
      adminService?.setBookingStatus,
      bookingsService?.updateRequestStatus,
      bookingsService?.setRequestStatus,
      bookingsService?.changeRequestStatus,
      bookingsService?.updateBookingStatus,
      bookingsService?.setBookingStatus,
    ].filter(Boolean);

    if (candidates.length === 0) {
      throw new Error("No status update method found. Add updateRequestStatus(requestId, status) to your service.");
    }

    let lastErr;
    for (const fn of candidates) {
      try {
        return await fn(requestId, nextStatus);
      } catch (e1) {
        lastErr = e1;
        try {
          return await fn({ request_id: requestId, status: nextStatus });
        } catch (e2) {
          lastErr = e2;
        }
      }
    }
    throw lastErr || new Error("Failed to update status");
  };

  // ----------- cancel resolver (student) -----------
  const callCancelRequest = async (requestId) => {
    const candidates = [
      bookingsService?.cancelRequest,
      bookingsService?.cancelBooking,
      bookingsService?.deleteRequest,
      bookingsService?.deleteBooking,
      adminService?.cancelRequest,
      adminService?.cancelBooking,
      adminService?.deleteRequest,
      adminService?.deleteBooking,
    ].filter(Boolean);

    if (candidates.length === 0) {
      throw new Error("No cancel method found. Add cancelRequest(requestId) in your service.");
    }

    let lastErr;
    for (const fn of candidates) {
      try {
        return await fn(requestId);
      } catch (e1) {
        lastErr = e1;
        try {
          return await fn({ request_id: requestId });
        } catch (e2) {
          lastErr = e2;
        }
      }
    }
    throw lastErr || new Error("Failed to cancel request");
  };

  const handleStatusChange = async (requestId, nextStatus) => {
    if (!requestId) return;
    try {
      setBusy(requestId, true);
      await callStatusUpdate(requestId, nextStatus);
      await loadData();
    } catch (err) {
      alert(err?.message || "Could not update status. Check your backend route/service method.");
    } finally {
      setBusy(requestId, false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!requestId) return;
    const ok = window.confirm("Cancel this request?");
    if (!ok) return;

    try {
      setBusy(requestId, true);
      await callCancelRequest(requestId);
      await loadData();
    } catch (err) {
      alert(err?.message || "Could not cancel request. Check your backend route/service method.");
    } finally {
      setBusy(requestId, false);
    }
  };

  // ----------- CSV export (admin) -----------
  const exportRequestsCSV = (rows, filename = "toolshare_requests.csv") => {
    const data = safeArr(rows);
    if (!data.length) return alert("No data to export.");

    const columns = [
      { key: "request_id", label: "request_id" },
      { key: "item_name", label: "tool" },
      { key: "owner_name", label: "owner" },
      { key: "email", label: "requester_email" },
      { key: "borrower_name", label: "requester_name" },
      { key: "student_id", label: "student_id" },
      { key: "requested_start", label: "requested_start" },
      { key: "requested_end", label: "requested_end" },
      { key: "status", label: "status" },
    ];

    const escape = (val) => {
      const s = String(val ?? "");
      const needsQuote = /[",\n]/.test(s);
      const quoted = `"${s.replace(/"/g, '""')}"`;
      return needsQuote ? quoted : s;
    };

    const header = columns.map((c) => c.label).join(",");
    const lines = data.map((r) => columns.map((c) => escape(r?.[c.key])).join(","));
    const csv = [header, ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  // ---------------- BASKET HELPERS (student only) ----------------
  const getCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const arr = JSON.parse(raw || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const setCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Add item to basket with extra fields to prevent request failures
  const addToCart = (item) => {
    const cart = getCart();
    const exists = cart.some((c) => Number(c.item_id) === Number(item.item_id));
    if (exists) return false;

    cart.push({
      item_id: item.item_id,
      name: item.name,
      description: item.description,
      image_url: item.image_url,
      owner_name: item.owner_name,
      faculty_id: item.faculty_id ?? item.owner_id ?? item.user_id ?? null,
      category_id: item.category_id ?? null,
      location: item.location ?? null,
      requested_start: "",
      requested_end: "",
    });

    setCart(cart);
    return true;
  };

  const requestNow = (item) => {
    const ok = addToCart(item);
    if (!ok) {
      alert("This tool is already in your basket. Open basket to request it.");
      navigate("/basket");
      return;
    }
    alert("Added to basket. Select dates and submit your request.");
    navigate("/basket"); // change if your basket route differs
  };

  // ----------- load data -----------
  const loadData = async () => {
    try {
      setLoading(true);

      const items = await itemsService.getItems();
      setAllItems(safeArr(items));

      if (isAdmin) {
        const [reqs, rep] = await Promise.all([
          adminService.getAllRequests({ q, status, start, end }),
          adminService.getReportsSummary(),
        ]);

        setAdminRequests(safeArr(reqs));
        setReports(rep || { statusCounts: [], topTools: [], topBorrowers: [] });

        setIncomingRequests([]);
        setMyRequests([]);
        return;
      }

      if (isFaculty) {
        const reqs = await bookingsService.getRequestedBookings();
        setIncomingRequests(safeArr(reqs));
        setMyRequests([]);
        setAdminRequests([]);
        setReports({ statusCounts: [], topTools: [], topBorrowers: [] });
        return;
      }

      const reqs = await bookingsService.getMyBookings();
      setMyRequests(safeArr(reqs));
      setIncomingRequests([]);
      setAdminRequests([]);
      setReports({ statusCounts: [], topTools: [], topBorrowers: [] });
    } catch {
      setAllItems([]);
      setMyRequests([]);
      setIncomingRequests([]);
      setAdminRequests([]);
      setReports({ statusCounts: [], topTools: [], topBorrowers: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType]);

  // ---- Recommendation logic (student only)
  const recommendedItems = useMemo(() => {
    if (isStaff) return [];

    const bookedNames = myRequests
      .map((r) => (r.item_name || r.name || "").toLowerCase())
      .filter(Boolean);

    if (bookedNames.length === 0) return [...allItems].slice(0, 6);

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

    return top.length ? top : [...allItems].slice(0, 6);
  }, [allItems, myRequests, isStaff]);

  const displayedRecommended = useMemo(() => {
    if (!searchTerm) return recommendedItems;
    const term = searchTerm.toLowerCase();
    return recommendedItems.filter(
      (i) => i.name?.toLowerCase().includes(term) || i.description?.toLowerCase().includes(term)
    );
  }, [recommendedItems, searchTerm]);

  // Admin summary map
  const statusMap = useMemo(() => {
    const m = new Map();
    (reports.statusCounts || []).forEach((r) => m.set(r.status, Number(r.count || 0)));
    return m;
  }, [reports]);

  // Student: MOST RECENT bookings
  const recentStudent = useMemo(() => {
    if (isStaff) return [];
    const arr = safeArr(myRequests).slice();
    arr.sort((a, b) => {
      const da = new Date(getRequestCreatedDate(a) || a.requested_start || 0).getTime();
      const db = new Date(getRequestCreatedDate(b) || b.requested_start || 0).getTime();
      return db - da;
    });
    return arr.slice(0, 3);
  }, [myRequests, isStaff]);

  // FACULTY: today lists
  const todayPickups = useMemo(() => {
    if (!isFaculty) return [];
    const arr = safeArr(incomingRequests);
    return arr
      .filter((r) => isWithinToday(r.requested_start))
      .filter((r) => isStatus(r.status, "Approved"))
      .sort((a, b) => new Date(a.requested_start) - new Date(b.requested_start));
  }, [incomingRequests, isFaculty]);

  const todayDues = useMemo(() => {
    if (!isFaculty) return [];
    const arr = safeArr(incomingRequests);
    return arr
      .filter((r) => isWithinToday(r.requested_end))
      .filter((r) => {
        const st = normStatus(r.status);
        return st === "checkedout" || st === "overdue";
      })
      .sort((a, b) => new Date(a.requested_end) - new Date(b.requested_end));
  }, [incomingRequests, isFaculty]);

  // Faculty recent incoming (pending)
  const RECENT_HOURS = 24;
  const isWithinLastHours = (dateStr, hours = 24) => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    if (Number.isNaN(t)) return false;
    return t >= Date.now() - hours * 60 * 60 * 1000;
  };

  const facultyRecentIncoming = useMemo(() => {
    if (!isFaculty) return [];
    const arr = safeArr(incomingRequests);

    return arr
      .filter((r) => {
        const created = getRequestCreatedDate(r);
        if (created) return isWithinLastHours(created, RECENT_HOURS);
        return isWithinLastHours(r.requested_start, RECENT_HOURS);
      })
      .filter((r) => isStatus(r.status, "Pending"))
      .sort((a, b) => {
        const da = new Date(getRequestCreatedDate(a) || a.requested_start || 0).getTime();
        const db = new Date(getRequestCreatedDate(b) || b.requested_start || 0).getTime();
        return db - da;
      })
      .slice(0, 10);
  }, [incomingRequests, isFaculty]);

  // ADMIN lists
  const adminRequestsToday = useMemo(() => {
    if (!isAdmin) return [];
    const arr = safeArr(adminRequests);
    return arr.filter((r) => {
      const created = getRequestCreatedDate(r);
      if (created) return isWithinToday(created);
      return isWithinToday(r.requested_start);
    });
  }, [adminRequests, isAdmin]);

  const adminPending = useMemo(() => {
    if (!isAdmin) return [];
    const arr = safeArr(adminRequests);
    return arr
      .filter((r) => isStatus(r.status, "Pending"))
      .sort((a, b) => {
        const da = new Date(getRequestCreatedDate(a) || a.requested_start || 0).getTime();
        const db = new Date(getRequestCreatedDate(b) || b.requested_start || 0).getTime();
        return db - da;
      })
      .slice(0, 10);
  }, [adminRequests, isAdmin]);

  const adminOverdue = useMemo(() => {
    if (!isAdmin) return [];
    const arr = safeArr(adminRequests);

    const list = arr.filter((r) => {
      const st = normStatus(r.status);
      const checkedOutish = st === "checkedout" || st === "overdue";
      if (!checkedOutish) return false;
      if (st === "overdue") return true;
      return r.requested_end ? isPast(r.requested_end) : false;
    });

    return list
      .sort((a, b) => new Date(a.requested_end || 0).getTime() - new Date(b.requested_end || 0).getTime())
      .slice(0, 10);
  }, [adminRequests, isAdmin]);

  const adminPickupsToday = useMemo(() => {
    if (!isAdmin) return [];
    const arr = safeArr(adminRequests);
    return arr
      .filter((r) => isStatus(r.status, "Approved"))
      .filter((r) => isWithinToday(r.requested_start))
      .sort((a, b) => new Date(a.requested_start) - new Date(b.requested_start))
      .slice(0, 10);
  }, [adminRequests, isAdmin]);

  const adminDueToday = useMemo(() => {
    if (!isAdmin) return [];
    const arr = safeArr(adminRequests);
    return arr
      .filter((r) => {
        const st = normStatus(r.status);
        return st === "checkedout" || st === "overdue";
      })
      .filter((r) => isWithinToday(r.requested_end))
      .sort((a, b) => new Date(b.requested_end || 0).getTime() - new Date(a.requested_end || 0).getTime())
      .slice(0, 10);
  }, [adminRequests, isAdmin]);

  // ---- render ----
  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">Welcome{user?.first_name ? `, ${user.first_name}` : ""} 👋</h2>

          <span className={`badge ${isAdmin ? "bg-dark" : isStaff ? "bg-warning text-dark" : "bg-success"}`}>
            {isAdmin ? "Admin Dashboard" : isStaff ? "Faculty Dashboard" : "Student Dashboard"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">Loading dashboard...</div>
      ) : isAdmin ? (
        <>
          {/* ================== ADMIN: KPI CARDS ================== */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4 col-lg-3">
              <div className="card p-3 shadow-sm h-100">
                <div className="text-muted fw-bold">Total Tools</div>
                <div className="fs-3 fw-bold">{allItems.length}</div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="card p-3 shadow-sm h-100">
                <div className="text-muted fw-bold">Requests Today</div>
                <div className="fs-3 fw-bold">{adminRequestsToday.length}</div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="card p-3 shadow-sm h-100">
                <div className="text-muted fw-bold">Pending Approvals</div>
                <div className="fs-3 fw-bold">{statusMap.get("Pending") || statusMap.get("pending") || 0}</div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="card p-3 shadow-sm h-100">
                <div className="text-muted fw-bold">Active Checkouts</div>
                <div className="fs-3 fw-bold">
                  {statusMap.get("CheckedOut") || statusMap.get("Checked Out") || statusMap.get("checkedout") || 0}
                </div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="card p-3 shadow-sm h-100">
                <div className="text-muted fw-bold">Overdue</div>
                <div className="fs-3 fw-bold">{statusMap.get("Overdue") || statusMap.get("overdue") || 0}</div>
              </div>
            </div>
          </div>

          {/* ================== ADMIN: ACTION NEEDED ================== */}
          <div className="row g-3 mb-4">
            {/* Pending approvals */}
            <div className="col-12 col-lg-6">
              <div className="card p-3 shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h5 className="fw-bold mb-0">Pending Approvals</h5>
                    <div className="text-muted small">Only the newest pending requests</div>
                  </div>
                </div>

                {adminPending.length === 0 ? (
                  <div className="alert alert-info mb-0">No pending approvals</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Requester</th>
                          <th style={{ width: 260 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminPending.map((r) => {
                          const rid = r.request_id;
                          const busy = !!actionBusy[rid];
                          return (
                            <tr key={rid}>
                              <td className="fw-bold">{r.item_name || "Tool"}</td>
                              <td>
                                <div className="fw-bold">{r.email || r.borrower_name || "Requester"}</div>
                                <div className="text-muted small">Start: {fmtDate(r.requested_start)}</div>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-2">
                                  <button
                                    className="btn btn-success btn-sm fw-bold"
                                    disabled={busy}
                                    onClick={() => handleStatusChange(rid, "Approved")}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm fw-bold"
                                    disabled={busy}
                                    onClick={() => handleStatusChange(rid, "Rejected")}
                                  >
                                    Reject
                                  </button>
                                </div>
                                {busy && <div className="text-muted small mt-1">Updating...</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Overdue */}
            <div className="col-12 col-lg-6">
              <div className="card p-3 shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h5 className="fw-bold mb-0">⏰ Overdue Items</h5>
                    <div className="text-muted small">Needs attention</div>
                  </div>
                </div>

                {adminOverdue.length === 0 ? (
                  <div className="alert alert-info mb-0">No overdue items</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Borrower</th>
                          <th>Due</th>
                          <th style={{ width: 180 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOverdue.map((r) => {
                          const rid = r.request_id;
                          const busy = !!actionBusy[rid];
                          return (
                            <tr key={rid} className="table-warning">
                              <td className="fw-bold">{r.item_name || "Tool"}</td>
                              <td className="small">{r.email || r.borrower_name || "Borrower"}</td>
                              <td className="small">{fmtDate(r.requested_end)}</td>
                              <td>
                                <button
                                  className="btn btn-secondary btn-sm fw-bold"
                                  disabled={busy}
                                  onClick={() => handleStatusChange(rid, "Returned")}
                                >
                                  Mark Returned
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================== ADMIN: TODAY SCHEDULE ================== */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-6">
              <div className="card p-3 shadow-sm h-100">
                <h5 className="fw-bold mb-0">📦 Pickups Today</h5>
                <div className="text-muted small mb-2">Approved + start today</div>

                {adminPickupsToday.length === 0 ? (
                  <div className="alert alert-info mb-0">No pickups today.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Requester</th>
                          <th>Time</th>
                          <th style={{ width: 170 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminPickupsToday.map((r) => {
                          const rid = r.request_id;
                          const busy = !!actionBusy[rid];
                          return (
                            <tr key={rid}>
                              <td className="fw-bold">{r.item_name || "Tool"}</td>
                              <td className="small">{r.email || r.borrower_name || "Requester"}</td>
                              <td className="small">
                                {r.requested_start ? new Date(r.requested_start).toLocaleTimeString() : "—"}
                              </td>
                              <td>
                                <button
                                  className="btn btn-primary btn-sm fw-bold"
                                  disabled={busy}
                                  onClick={() => handleStatusChange(rid, "CheckedOut")}
                                >
                                  Mark Checked Out
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="card p-3 shadow-sm h-100">
                <h5 className="fw-bold mb-0">↩ Due Today</h5>
                <div className="text-muted small mb-2">Checked out + end today</div>

                {adminDueToday.length === 0 ? (
                  <div className="alert alert-info mb-0">No returns due today.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Borrower</th>
                          <th>Due Time</th>
                          <th>Status</th>
                          <th style={{ width: 160 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminDueToday.map((r) => {
                          const rid = r.request_id;
                          const busy = !!actionBusy[rid];
                          return (
                            <tr key={rid}>
                              <td className="fw-bold">{r.item_name || "Tool"}</td>
                              <td className="small">{r.email || r.borrower_name || "Borrower"}</td>
                              <td className="small">
                                {r.requested_end ? new Date(r.requested_end).toLocaleTimeString() : "—"}
                              </td>
                              <td>
                                <span className={`badge ${badgeClassForStatus(r.status)}`}>{displayStatus(r.status)}</span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-secondary btn-sm fw-bold"
                                  disabled={busy}
                                  onClick={() => handleStatusChange(rid, "Returned")}
                                >
                                  Mark Returned
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================== ADMIN: MINI REPORTS ================== */}
          <div className="card p-3 shadow-sm">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h5 className="fw-bold mb-0">Reports</h5>
              <button className="btn btn-outline-dark fw-bold btn-sm" onClick={() => exportRequestsCSV(adminRequests)}>
                ⬇ Export CSV
              </button>
            </div>

            <div className="row g-3">
              <div className="col-lg-6">
                <div className="card p-3 h-100">
                  <div className="fw-bold mb-2">Top Borrowed Tools</div>
                  {reports.topTools?.length ? (
                    <ol className="mb-0">
                      {reports.topTools.slice(0, 5).map((t) => (
                        <li key={t.item_id}>
                          {t.name} <span className="text-muted">({t.total_requests})</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-muted">No data yet.</div>
                  )}
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card p-3 h-100">
                  <div className="fw-bold mb-2">Top Borrowers</div>
                  {reports.topBorrowers?.length ? (
                    <ol className="mb-0">
                      {reports.topBorrowers.slice(0, 5).map((b) => (
                        <li key={b.user_id}>
                          {(b.first_name || b.last_name)
                            ? `${b.first_name || ""} ${b.last_name || ""}`.trim()
                            : b.email}
                          <span className="text-muted"> — {b.total_requests} requests</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-muted">No data yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : !isStaff ? (
        // ---------------- STUDENT HOME ----------------
        <>
          {/* Student: Recent bookings preview */}
          <div className="card p-3 shadow-sm mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="fw-bold mb-0">Recent Bookings</h5>
              <button className="btn btn-outline-dark fw-bold btn-sm" onClick={() => navigate("/my-bookings")}>
                View All
              </button>
            </div>

            {safeArr(myRequests).length === 0 ? (
              <div className="text-muted mt-2">You don’t have any bookings yet. Browse tools and request one.</div>
            ) : (
              <div className="mt-3 table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Tool</th>
                      <th>Dates</th>
                      <th>Status</th>
                      <th style={{ width: 160 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStudent.map((r) => {
                      const rid = r.request_id;
                      const busy = !!actionBusy[rid];
                      const st = normStatus(r.status);
                      const canCancel = st === "pending";

                      return (
                        <tr key={rid || `${r.item_id}-${r.requested_start}`}>
                          <td className="fw-bold">{r.item_name || r.name || "Tool"}</td>
                          <td className="small">
                            <div>
                              <b>From:</b> {fmtDate(r.requested_start)}
                            </div>
                            <div>
                              <b>To:</b> {fmtDate(r.requested_end)}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${badgeClassForStatus(r.status)}`}>{displayStatus(r.status)}</span>
                          </td>
                          <td>
                            {canCancel ? (
                              <button
                                className="btn btn-outline-danger btn-sm fw-bold"
                                disabled={busy}
                                onClick={() => handleCancelRequest(rid)}
                              >
                                Cancel
                              </button>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {safeArr(myRequests).length > 3 && (
                  <div className="text-muted small mt-2">
                    Showing 3 of {myRequests.length}. Click “View All” for the full list.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student: Recommended */}
          <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold mb-0">Recommended for you</h4>
              <span className="text-muted small">Based on your previous bookings</span>
            </div>
          </div>

          {displayedRecommended.length === 0 ? (
            <div className="alert alert-info">No recommendations found yet. Try browsing all tools.</div>
          ) : (
            <div className="items-grid">
              {displayedRecommended.map((item) => (
                <div key={item.item_id} className="item-card shadow-sm">
                  <div className="img-frame">
                    <img
                      src={getImageSrc(item.image_url)}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/400x250?text=Image+Not+Found";
                      }}
                    />
                  </div>

                  <h5 className="fw-bold mt-2 mb-1">{item.name}</h5>
                  <p className="text-muted mb-2">{item.description?.substring(0, 90) || "No description"}</p>

                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-success fw-bold flex-fill" onClick={() => requestNow(item)}>
                      Request Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // ---------------- FACULTY HOME ----------------
        <>
          <div className="row g-3">
            {/* RECENT INCOMING REQUESTS */}
            <div className="col-12">
              <div className="card p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold mb-0">📥 Recent Incoming Requests</h5>
                  </div>
                </div>

                {facultyRecentIncoming.length === 0 ? (
                  <div className="alert alert-info mt-3 mb-0">No new requests recently.</div>
                ) : (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Requester</th>
                          <th>Dates</th>
                          <th>Status</th>
                          <th style={{ width: 320 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyRecentIncoming.map((r) => {
                          const rid = r.request_id;
                          const busy = !!actionBusy[rid];

                          return (
                            <tr key={rid}>
                              <td className="fw-bold">{r.item_name || "Tool"}</td>

                              <td>
                                <div className="fw-bold">{r.email || r.borrower_name || "Requester"}</div>
                                <div className="text-muted small">Student ID: {r.student_id || "—"}</div>
                              </td>

                              <td className="small">
                                <div>
                                  <b>From:</b> {fmtDate(r.requested_start)}
                                </div>
                                <div>
                                  <b>To:</b> {fmtDate(r.requested_end)}
                                </div>
                              </td>

                              <td>
                                <span className={`badge ${badgeClassForStatus(r.status)}`}>{displayStatus(r.status)}</span>
                              </td>

                              <td>
                                <div className="d-flex flex-wrap gap-2">
                                  <button
                                    className="btn btn-success btn-sm fw-bold"
                                    disabled={busy}
                                    onClick={() => handleStatusChange(rid, "Approved")}
                                  >
                                    Approve
                                  </button>

                                  <button
                                    className="btn btn-danger btn-sm fw-bold"
                                    disabled={busy}
                                    onClick={() => handleStatusChange(rid, "Rejected")}
                                  >
                                    Reject
                                  </button>
                                </div>

                                {busy && <div className="text-muted small mt-1">Updating...</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="text-muted small mt-2">
                      Showing {facultyRecentIncoming.length} most recent requested bookings.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TODAY PICKUPS */}
            <div className="col-12 col-lg-6">
              <div className="card p-3 shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold mb-0">Today’s Pickup List</h5>
                  </div>
                </div>

                {todayPickups.length === 0 ? (
                  <div className="alert alert-info mt-3 mb-0">No pickups scheduled for today.</div>
                ) : (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Requester</th>
                          <th>Pickup Time</th>
                          <th style={{ width: 170 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayPickups.map((r) => {
                          const rid = r.request_id;
                          const busy = !!actionBusy[rid];
                          return (
                            <tr key={rid}>
                              <td className="fw-bold">{r.item_name || "Tool"}</td>
                              <td>
                                <div className="fw-bold">{r.email || r.borrower_name || "Requester"}</div>
                                <div className="text-muted small">Student ID: {r.student_id || "—"}</div>
                              </td>
                              <td className="small">
                                {r.requested_start ? new Date(r.requested_start).toLocaleTimeString() : "—"}
                              </td>
                              <td>
                                <button
                                  className="btn btn-primary btn-sm fw-bold"
                                  disabled={busy}
                                  onClick={() => handleStatusChange(rid, "CheckedOut")}
                                >
                                  Mark Checked Out
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* TODAY DUE */}
            <div className="col-12 col-lg-6">
              <div className="card p-3 shadow-sm h-100">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold mb-0">Due Today</h5>
                  </div>
                </div>

                {todayDues.length === 0 ? (
                  <div className="alert alert-info mt-3 mb-0">No returns due today.</div>
                ) : (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Requester</th>
                          <th>Due Time</th>
                          <th>Status</th>
                          <th style={{ width: 160 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayDues.map((r) => {
                          const rid = r.request_id;
                          const busy = !!actionBusy[rid];
                          return (
                            <tr key={rid}>
                              <td className="fw-bold">{r.item_name || "Tool"}</td>
                              <td>
                                <div className="fw-bold">{r.email || r.borrower_name || "Requester"}</div>
                                <div className="text-muted small">Student ID: {r.student_id || "—"}</div>
                              </td>
                              <td className="small">
                                {r.requested_end ? new Date(r.requested_end).toLocaleTimeString() : "—"}
                              </td>
                              <td>
                                <span className={`badge ${badgeClassForStatus(r.status)}`}>{displayStatus(r.status)}</span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-secondary btn-sm fw-bold"
                                  disabled={busy}
                                  onClick={() => handleStatusChange(rid, "Returned")}
                                >
                                  Mark Returned
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;