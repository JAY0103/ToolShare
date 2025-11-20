const API_BASE_URL = 'http://localhost:3000';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

export const authService = {
  login: (username, password) => apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),

  register: (formData) => apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify({
      first_name: formData.first_name,
      last_name: formData.last_name,
      student_id: formData.student_id,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      user_type: formData.user_type === 'student' ? 'Student' : 'Faculty'
    })
  }),

  getCurrentUser: () => apiRequest('/api/getUser'),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const itemsService = {
  getItems: () => apiRequest('/api/items').then(d => d.items),
  addItem: (item) => apiRequest('/api/items', { method: 'POST', body: JSON.stringify(item) })
};

export const bookingsService = {
  bookItem: (data) => apiRequest('/api/borrow-requests', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: () => apiRequest('/api/my-requests').then(d => d.requests),
  getRequestedBookings: () => apiRequest('/api/item-requests').then(d => d.requests),
  updateRequestStatus: (id, status) => apiRequest(`/api/borrow-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
};