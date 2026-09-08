import api from './api';

export const trackingService = {
  listTrips: async () => {
    const response = await api.get('/trips');
    return response.data;
  },

  startTrip: async ({ studentId, routeId, tripStartedAt }) => {
    const response = await api.post('/trips', {
      studentId,
      routeId,
      tripStartedAt,
    });
    return response.data;
  },

  updateStatus: async (tripId, data) => {
    const response = await api.patch(`/trips/${tripId}/status`, data);
    return response.data;
  },

  addCoordinate: async (tripId, data) => {
    const response = await api.post(`/trips/${tripId}/coordinates`, data);
    return response.data;
  },

  listCoordinates: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/coordinates`);
    return response.data;
  },
};
