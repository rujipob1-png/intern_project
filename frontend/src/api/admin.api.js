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

  // ============= USER MANAGEMENT =============
  // Get all roles (for dropdowns)
  getAllRoles: async () => {
    const response = await axios.get('/admin/roles');
    return response.data;
  },

  // Get all users (for user management)
  getAllUsers: async () => {
    const response = await axios.get('/admin/users');
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await axios.post('/admin/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userId, data) => {
    const response = await axios.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  // Delete/disable user
  // mode: 'deactivate' | 'archive' | 'permanent'
  deleteUser: async (userId, mode = 'deactivate', reason = '') => {
    const response = await axios.delete(`/admin/users/${userId}`, { 
      data: { mode, reason } 
    });
    return response.data;
  },

  // Activate user (re-enable disabled user)
  activateUser: async (userId) => {
    const response = await axios.put(`/admin/users/${userId}/activate`);
    return response.data;
  },

  // Reset user password
  resetUserPassword: async (userId, newPassword) => {
    const response = await axios.put(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
    return response.data;
  },

  // Update leave balance
  updateLeaveBalance: async (userId, balanceData) => {
    const response = await axios.put(`/admin/users/${userId}/leave-balance`, balanceData);
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

  // ============= VACATION CARRYOVER (ยกยอดวันลาพักผ่อน) =============
  // Get vacation summary for a user
  getVacationSummary: async (userId) => {
    const response = await axios.get(`/admin/users/${userId}/vacation-summary`);
    return response.data;
  },

  // Process vacation carryover for a single user
  processVacationCarryover: async (userId, force = false) => {
    const response = await axios.post(`/admin/users/${userId}/vacation-carryover`, { force });
    return response.data;
  },

  // Process vacation carryover for all users (fiscal year reset)
  processAllVacationCarryover: async (force = false) => {
    const response = await axios.post('/admin/vacation-carryover-all', { force });
    return response.data;
  },

  // Reset annual leave balance (sick, personal) for all users
  resetAnnualLeaveBalance: async () => {
    const response = await axios.post('/admin/reset-annual-leave');
    return response.data;
  },

  // Reset vacation carryover - ยกเลิกการยกยอด (vacation = 10, carryover = 0)
  resetVacationCarryover: async () => {
    const response = await axios.post('/admin/reset-vacation-carryover');
    return response.data;
  },

  // ============= ARCHIVED USERS (บุคลากรที่เก็บถาวร) =============
  // Get all archived users
  getArchivedUsers: async () => {
    const response = await axios.get('/admin/archived-users');
    return response.data;
  },

  // Get archived user's leave history
  getArchivedUserLeaves: async (archivedUserId) => {
    const response = await axios.get(`/admin/archived-users/${archivedUserId}/leaves`);
    return response.data;
  },

  // Delete archived user permanently
  deleteArchivedUser: async (archivedUserId) => {
    const response = await axios.delete(`/admin/archived-users/${archivedUserId}`);
    return response.data;
  },
};
