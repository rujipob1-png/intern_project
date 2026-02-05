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

  // Partial approve leave at level 4 (approve some dates, reject others)
  partialApproveLeaveFinal: async (leaveId, approvedDates, rejectedDates, rejectReason, remarks = '') => {
    const response = await axios.put(`/admin/leaves/${leaveId}/partial-approve`, {
      approvedDates,
      rejectedDates,
      rejectReason,
      remarks
    });
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

  // ============= CANCEL REQUESTS (Final Level) =============
  // Get pending cancel requests for final approval
  getPendingCancelRequests: async () => {
    const response = await axios.get('/admin/cancel-requests/pending');
    return response.data;
  },

  // Approve cancel final (actually cancels the leave)
  approveCancelFinal: async (leaveId, remarks = '') => {
    const response = await axios.put(`/admin/cancel-requests/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject cancel at final level
  rejectCancelFinal: async (leaveId, remarks) => {
    const response = await axios.put(`/admin/cancel-requests/${leaveId}/reject`, { remarks });
    return response.data;
  },

  // Get approval history (leaves that admin has processed)
  getApprovalHistory: async () => {
    const response = await axios.get('/admin/leaves/history');
    return response.data;
  },

  // Get cancel history (cancelled leaves history)
  getCancelHistory: async () => {
    const response = await axios.get('/admin/cancel-requests/history');
    return response.data;
  },
};
