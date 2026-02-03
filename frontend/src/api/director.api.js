import axios from './axios.config';

export const directorAPI = {
  // Get pending leaves for director's department
  getPendingLeaves: async () => {
    const response = await axios.get('/director/leaves/pending');
    return response.data;
  },

  // Get approval history
  getApprovalHistory: async () => {
    const response = await axios.get('/director/leaves/history');
    return response.data;
  },

  // Approve leave (send to level 2)
  approveLeave: async (leaveId, remarks = '') => {
    const response = await axios.post(`/director/leaves/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject leave
  rejectLeave: async (leaveId, remarks) => {
    const response = await axios.post(`/director/leaves/${leaveId}/reject`, { remarks });
    return response.data;
  },

  // Get pending cancel requests
  getPendingCancelRequests: async () => {
    const response = await axios.get('/director/cancel-requests/pending');
    return response.data;
  },

  // Approve cancel request (level 1)
  approveCancelRequest: async (leaveId, remarks = '') => {
    const response = await axios.post(`/director/cancel-requests/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject cancel request
  rejectCancelRequest: async (leaveId, remarks) => {
    const response = await axios.post(`/director/cancel-requests/${leaveId}/reject`, { remarks });
    return response.data;
  },
};
