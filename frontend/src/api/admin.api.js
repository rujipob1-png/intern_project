import axios from './axios.config';

export const adminAPI = {
  // Get leaves approved at level 3 (by central office head)
  getApprovedLevel3Leaves: async () => {
    const response = await axios.get('/admin/leaves/pending');
    return response.data;
  },

  // Final approval (level 4) - deducts leave balance
  approveLeaveFinal: async (leaveId, remarks = '') => {
    const response = await axios.put(`/admin/leaves/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject leave at level 4
  rejectLeaveFinal: async (leaveId, remarks) => {
    const response = await axios.put(`/admin/leaves/${leaveId}/reject`, { remarks });
    return response.data;
  },

  // Get all users (for user management)
  getAllUsers: async () => {
    const response = await axios.get('/admin/users');
    return response.data;
  },

  // Update user
  updateUser: async (userId, data) => {
    const response = await axios.put(`/admin/users/${userId}`, data);
    return response.data;
  },
};
