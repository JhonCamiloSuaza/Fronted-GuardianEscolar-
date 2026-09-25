import api from './api';

export const routeService = {
  list: async () => {
    const response = await api.get('/routes');
    return response.data;
  },

  geometry: async (id) => {
    const response = await api.get(`/routes/${id}/geometry`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/routes', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/routes/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    await api.delete(`/routes/${id}`);
  },

  addStop: async (routeId, data) => {
    const response = await api.post(`/routes/${routeId}/stops`, data);
    return response.data;
  },
};
