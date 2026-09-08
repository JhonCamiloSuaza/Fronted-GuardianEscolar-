import api from './api';

export const adminService = {
  dashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  recentAlerts: async (limit = 10) => {
    const response = await api.get('/admin/alerts', { params: { limit } });
    return response.data;
  },

  recentAudit: async (limit = 10) => {
    const response = await api.get('/admin/audit', { params: { limit } });
    return response.data;
  },

  recentErrors: async (limit = 10) => {
    const response = await api.get('/admin/errors', { params: { limit } });
    return response.data;
  },
};
