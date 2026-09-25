import api from './api';

export const safeZoneService = {
  list: async () => {
    const response = await api.get('/safe-zones');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/safe-zones', data);
    return response.data;
  },

  update: async (zoneId, data) => {
    const response = await api.put(`/safe-zones/${zoneId}`, data);
    return response.data;
  },

  remove: async (zoneId) => {
    await api.delete(`/safe-zones/${zoneId}`);
  },
};
