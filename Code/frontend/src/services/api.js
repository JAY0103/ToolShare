// frontend/src/services/api.js
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      alert("Session expired. Please login again.");
      window.location.href = "/login";
    }

    const err = new Error(data.error || data.message || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

// Optional helper (handy in pages)
export const getUserRole = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return String(u?.user_type || "").toLowerCase();
  } catch {
    return "";
  }
};

// AUTH SERVICE
export const authService = {
  login: (email, password) =>
    apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (formData) =>
    apiRequest("/api/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: formData.first_name,
        last_name: formData.last_name,
        student_id: formData.student_id,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        user_type: formData.user_type === "student" ? "Student" : "Faculty",
      }),
    }),

  getCurrentUser: () => apiRequest("/api/getUser"),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// ITEMS SERVICE
export const itemsService = {
  getCategories: async () => {
    const d = await apiRequest("/api/categories");
    return d.categories || [];
  },

  getItems: async () => {
    const d = await apiRequest("/api/items");
    return d.items || [];
  },

  getAvailableItems: async (start, end) => {
    const d = await apiRequest(
      `/api/items/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
    return d.items || [];
  },

  addItem: (formData) =>
    apiRequest("/api/items", {
      method: "POST",
      body: formData,
    }),

  editItem: (item_id, { name, description, category_id }) =>
    apiRequest("/api/edit-item", {
      method: "PUT",
      body: JSON.stringify({ item_id, name, description, category_id }),
    }),

  deleteItem: (id) =>
    apiRequest(`/api/items/${id}`, {
      method: "DELETE",
    }),
};

// BOOKINGS SERVICE
export const bookingsService = {
  bookItem: (data) =>
    apiRequest("/api/book-item", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  requestGroup: (payload) =>
    apiRequest("/api/request-group", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyBookings: async () => {
    const d = await apiRequest("/api/my-requests");
    return d.requests || [];
  },

  getRequestedBookings: async () => {
    const d = await apiRequest("/api/item-requests");
    return d.requests || [];
  },

  updateRequestStatus: (requestId, status, decision_note = "") =>
    apiRequest("/api/request-status", {
      method: "PUT",
      body: JSON.stringify({ request_id: requestId, status, decision_note }),
    }),

  cancelRequest: async (requestId) => {
    try {
      return await apiRequest("/api/request-cancel", {
        method: "PUT",
        body: JSON.stringify({ request_id: requestId }),
      });
    } catch (err) {
      const msg = String(err?.message || "").toLowerCase();
      const isAlready =
        err?.status === 409 ||
        msg.includes("already") ||
        msg.includes("cancel") ||
        msg.includes("canceled") ||
        msg.includes("cancelled");

      if (isAlready) {
        return { ok: true, status: "Cancelled", alreadyCancelled: true };
      }

      throw err;
    }
  },

  checkoutRequest: (requestId) =>
    apiRequest("/api/request-checkout", {
      method: "PUT",
      body: JSON.stringify({ request_id: requestId }),
    }),

  returnRequest: (requestId) =>
    apiRequest("/api/request-return", {
      method: "PUT",
      body: JSON.stringify({ request_id: requestId }),
    }),

  getOverdueBookings: async () => {
    const d = await apiRequest("/api/overdue-requests");
    return d.requests || [];
  },

  // With the updated backend:
  // - Faculty gets their owned items
  // - Admin gets ALL items (because server.js now returns all for admin)
  getOwnerItems: async () => {
    const d = await apiRequest("/api/owner/items");
    return d.items || [];
  },

  // With the updated backend:
  // - Faculty gets history for their owned items
  // - Admin gets ALL history
  getOwnerBookingHistory: async (filters = {}) => {
    const qs = new URLSearchParams();

    if (filters.search) qs.set("search", filters.search);
    if (filters.status) qs.set("status", filters.status);
    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);
    if (filters.item_id) qs.set("item_id", String(filters.item_id));

    const queryString = qs.toString();
    const endpoint = queryString ? `/api/owner/booking-history?${queryString}` : `/api/owner/booking-history`;

    const d = await apiRequest(endpoint);
    return d.requests || [];
  },
};

// NOTIFICATIONS SERVICE
export const notificationsService = {
  getNotifications: () => apiRequest("/api/notifications"),

  markRead: (notification_id) =>
    apiRequest(`/api/notifications/${notification_id}/read`, {
      method: "PUT",
    }),

  markAllRead: () =>
    apiRequest("/api/notifications/read-all", {
      method: "PUT",
    }),
};

// ADMIN SERVICE
export const adminService = {
  getAllRequests: async ({ q = "", status = "", start = "", end = "" } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (start) params.set("start", start);
    if (end) params.set("end", end);

    const d = await apiRequest(`/api/admin/requests?${params.toString()}`);
    return d.requests || [];
  },

  getReportsSummary: () => apiRequest("/api/admin/reports/summary"),
};