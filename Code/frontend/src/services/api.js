// frontend/src/services/api.js
export const API_BASE = "http://54.85.60.202:3000";

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
    const isAuthError = res.status === 401 || res.status === 403;
    const isLoginRequest = endpoint === "/api/login";

    if (isAuthError && !isLoginRequest) {
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

// Optional helper
export const getUserRole = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return String(u?.user_type || "").toLowerCase();
  } catch {
    return "";
  }
};

// ===================== AUTH SERVICE =====================
export const authService = {
  login: (email, password) =>
    apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
        password,
      }),
    }),

  register: (formData) =>
    apiRequest("/api/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: formData.first_name,
        last_name: formData.last_name,
        student_id: formData.student_id,
        username: formData.username,
        email: String(formData.email || "").trim().toLowerCase(),
        password: formData.password,
        user_type: formData.user_type === "student" ? "Student" : "Faculty",
      }),
    }),

  getCurrentUser: () => apiRequest("/api/getUser"),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  forgotPassword: (email) =>
    apiRequest("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
      }),
    }),

  resetPassword: (token, password) =>
    apiRequest(`/api/auth/reset-password/${token}`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
};

// ===================== ITEMS SERVICE =====================
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

  getBorrowRequestConditionImages: async (requestId) => {
    if (!requestId) throw new Error("Missing borrow request ID");
    const d = await apiRequest(`/api/borrowrequest/${requestId}/condition-images`);
    return d.images || [];
  },

  uploadConditionImage: async (requestId, formData) => {
    if (!requestId) throw new Error("Missing borrow request ID");
    if (!formData) throw new Error("Missing form data");

    return await apiRequest(`/api/borrowrequest/${requestId}/condition-image`, {
      method: "POST",
      body: formData,
    });
  },
};

// ===================== BOOKINGS SERVICE =====================
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

  getOwnerItems: async () => {
    const d = await apiRequest("/api/owner/items");
    return d.items || [];
  },

  getOwnerBookingHistory: async (params = {}) => {
    const query = new URLSearchParams();

    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.item_id) query.set("item_id", params.item_id);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.admin_all) query.set("admin_all", params.admin_all);

    const qs = query.toString();

    const d = await apiRequest(
      `/api/owner/booking-history${qs ? `?${qs}` : ""}`
    );

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
        msg.includes("cancel");

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
};
// ===================== NOTIFICATIONS SERVICE =====================
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

// ===================== ADMIN SERVICE =====================
export const adminService = {
  // ================= USERS =================
  getAllUsers: async () => {
    const d = await apiRequest("/api/admin/users");
    return d.users || [];
  },

  updateUserRole: (userId, role) =>
    apiRequest(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ user_type:  role }),
    }),

  deleteUser: (userId) =>
    apiRequest(`/api/admin/users/${userId}`, {
      method: "DELETE",
    }),

  // ================= CATEGORIES =================
  createCategory: (name, description) =>
    apiRequest("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),

  deleteCategory: (categoryId) =>
    apiRequest(`/api/admin/categories/${categoryId}`, {
      method: "DELETE",
    }),

  // ================= FACULTIES =================
  getFaculties: async () => {
    const d = await apiRequest("/api/admin/faculties");
    return d.faculties || [];
  },

  createFaculty: (name, description) =>
    apiRequest("/api/admin/faculties", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),

  deleteFaculty: (facultyId) =>
    apiRequest(`/api/admin/faculties/${facultyId}`, {
      method: "DELETE",
    }),

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
