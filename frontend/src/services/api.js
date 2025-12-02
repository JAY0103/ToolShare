// src/services/api.js 
const API_BASE = 'http://localhost:3000';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Session expired. Please login again.');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

// AUTH SERVICE
export const authService = {
  login: (username, password) =>
    apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (formData) =>
    apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => apiRequest('/api/getUser'),
};

// ITEMS SERVICE
export const itemsService = {
  getItems: () => apiRequest('/api/items'),
  addItem: (data) =>
    apiRequest('/api/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// BORROW REQUESTS SERVICE 
export const bookingsService = {
  bookItem: (data) =>
    apiRequest('/api/borrow-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyBookings: () => apiRequest('/api/my-requests'),

  
  getRequestedBookings: () => apiRequest('/api/item-requests'),

  updateRequestStatus: (id, status) =>
    apiRequest(`/api/borrow-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export default apiRequest;