import api from './api';

// ─── Auth ───────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// ─── Sports ─────────────────────────────────────────────────────────
export const sportService = {
  getAll: () => api.get('/sports'),
  getById: (id) => api.get(`/sports/${id}`),
  create: (data) => api.post('/sports', data),
  update: (id, data) => api.put(`/sports/${id}`, data),
  delete: (id) => api.delete(`/sports/${id}`),
  getAnalytics: () => api.get('/sports/analytics'),
};

// ─── Facility Requests ───────────────────────────────────────────────
export const facilityService = {
  request: (data) => api.post('/facility/request', data),
  getAll: (status) => api.get('/facility/requests', { params: status ? { status } : {} }),
  getMyRequests: () => api.get('/facility/my-requests'),
  approve: (id) => api.put(`/facility/approve/${id}`),
  reject: (id, reason) => api.put(`/facility/reject/${id}`, { reason }),
  release: (id) => api.put(`/facility/release/${id}`),
};

// ─── Equipment ────────────────────────────────────────────────────────
export const equipmentService = {
  getAll: () => api.get('/equipment'),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  request: (data) => api.post('/equipment/request', data),
  getAllRequests: (status) => api.get('/equipment/requests', { params: status ? { status } : {} }),
  getMyRequests: () => api.get('/equipment/my-requests'),
  approve: (id) => api.put(`/equipment/approve/${id}`),
  reject: (id, reason) => api.put(`/equipment/reject/${id}`, { reason }),
  markReturned: (id) => api.put(`/equipment/return/${id}`),
};

// ─── Chat ─────────────────────────────────────────────────────────────
export const chatService = {
  send: (message, sessionId) => api.post('/chat', { message, sessionId }),
  getHistory: (sessionId) => api.get('/chat/history', { params: { sessionId } }),
};
