import axios from './axios.config';

export const directorAPI = {
  // Get pending leaves for director's department
  getPendingLeaves: async () => {
    const response = await axios.get('/director/leaves/pending');
    return response.data;
  },

  // Approve leave (send to level 2)
  approveLeave: async (leaveId, remarks = '') => {
    const response = await axios.put(`/director/leaves/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject leave
  rejectLeave: async (leaveId, remarks) => {
    const response = await axios.put(`/director/leaves/${leaveId}/reject`, { remarks });
    return response.data;
  },
};
