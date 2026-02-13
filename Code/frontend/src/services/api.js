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
    throw new Error(data.error || "Request failed");
  }

  return data;
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
  // categories for dropdown/filter
  getCategories: async () => {
    const d = await apiRequest("/api/categories");
    return d.categories || [];
  },

  getItems: async () => {
    const d = await apiRequest("/api/items");
    return d.items || [];
  },

  // calendar availability filter
  getAvailableItems: async (start, end) => {
    const d = await apiRequest(
      `/api/items/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
    return d.items || [];
  },

  // add item
  addItem: (formData) =>
    apiRequest("/api/items", {
      method: "POST",
      body: formData,
    }),

  // edit item (supports category_id too)
  editItem: (item_id, { name, description, category_id }) =>
    apiRequest("/api/edit-item", {
      method: "PUT",
      body: JSON.stringify({ item_id, name, description, category_id }),
    }),

  // delete item
  deleteItem: (id) =>
    apiRequest(`/api/items/${id}`, {
      method: "DELETE",
    }),
};

// BOOKINGS SERVICE
export const bookingsService = {
  // single item request (existing)
  bookItem: (data) =>
    apiRequest("/api/book-item", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // CART submit (multiple items in one request)
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

  // CHECKOUT (Approved -> CheckedOut)
  checkoutRequest: (requestId) =>
    apiRequest("/api/request-checkout", {
      method: "PUT",
      body: JSON.stringify({ request_id: requestId }),
    }),

  // RETURN (CheckedOut/Overdue -> Returned)
  returnRequest: (requestId) =>
    apiRequest("/api/request-return", {
      method: "PUT",
      body: JSON.stringify({ request_id: requestId }),
    }),

  // (Optional) faculty overdue list
  getOverdueBookings: async () => {
    const d = await apiRequest("/api/overdue-requests");
    return d.requests || [];
  },
};

// NOTIFICATIONS SERVICE
export const notificationsService = {
  // returns: { notifications: [...], unreadCount: number }
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
