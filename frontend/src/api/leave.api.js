import axios from './axios.config';

export const leaveAPI = {
  // Get all leave types
  getLeaveTypes: async () => {
    const response = await axios.get('/leaves/types');
    return response.data;
  },

  // Create leave request
  createLeave: async (data) => {
    const response = await axios.post('/leaves', data);
    return response.data;
  },

  // Get my leaves with filters
  getMyLeaves: async (params) => {
    const response = await axios.get('/leaves', { params });
    return response.data;
  },

  // Get leave by ID
  getLeaveById: async (id) => {
    const response = await axios.get(`/leaves/${id}`);
    return response.data;
  },

  // Cancel leave
  cancelLeave: async (id, reason) => {
    const response = await axios.put(`/leaves/${id}/cancel`, { reason });
    return response.data;
  },

  // Get leave balance
  getLeaveBalance: async () => {
    const response = await axios.get('/leaves/balance');
    return response.data;
  },
};
