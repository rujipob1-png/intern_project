import axios from './axios.config';

export const centralOfficeAPI = {
  // ============= STAFF (Level 2) =============
  // Get leaves approved by director (level 1)
  getApprovedLevel1Leaves: async () => {
    const response = await axios.get('/central-office/staff/pending');
    return response.data;
  },

  // Approve leave at level 2 (staff check documents)
  approveLeaveLevel2: async (leaveId, remarks = '') => {
    const response = await axios.post(`/central-office/staff/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject leave at level 2
  rejectLeaveLevel2: async (leaveId, remarks) => {
    const response = await axios.post(`/central-office/staff/${leaveId}/reject`, { remarks });
    return response.data;
  },

  // ============= HEAD (Level 3) =============
  // Get leaves approved by staff (level 2)
  getApprovedLevel2Leaves: async () => {
    const response = await axios.get('/central-office/head/pending');
    return response.data;
  },

  // Approve leave at level 3 (head approval)
  approveLeaveLevel3: async (leaveId, remarks = '') => {
    const response = await axios.post(`/central-office/head/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject leave at level 3
  rejectLeaveLevel3: async (leaveId, remarks) => {
    const response = await axios.post(`/central-office/head/${leaveId}/reject`, { remarks });
    return response.data;
  },

  // ============= CANCEL REQUESTS - STAFF (Level 2) =============
  // Get pending cancel requests for staff
  getPendingCancelRequestsStaff: async () => {
    const response = await axios.get('/central-office/staff/cancel-requests/pending');
    return response.data;
  },

  // Approve cancel at level 2
  approveCancelLevel2: async (leaveId, remarks = '') => {
    const response = await axios.post(`/central-office/staff/cancel-requests/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject cancel at level 2
  rejectCancelLevel2: async (leaveId, remarks) => {
    const response = await axios.post(`/central-office/staff/cancel-requests/${leaveId}/reject`, { remarks });
    return response.data;
  },

  // ============= CANCEL REQUESTS - HEAD (Level 3) =============
  // Get pending cancel requests for head
  getPendingCancelRequestsHead: async () => {
    const response = await axios.get('/central-office/head/cancel-requests/pending');
    return response.data;
  },

  // Approve cancel at level 3
  approveCancelLevel3: async (leaveId, remarks = '') => {
    const response = await axios.post(`/central-office/head/cancel-requests/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject cancel at level 3
  rejectCancelLevel3: async (leaveId, remarks) => {
    const response = await axios.post(`/central-office/head/cancel-requests/${leaveId}/reject`, { remarks });
    return response.data;
  },
};
