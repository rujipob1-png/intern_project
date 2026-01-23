import axios from './axios.config';

export const centralOfficeAPI = {
  // ============= STAFF (Level 2) =============
  // Get leaves approved by director (level 1)
  getApprovedLevel1Leaves: async () => {
    const response = await axios.get('/central-office/staff/leaves/pending');
    return response.data;
  },

  // Approve leave at level 2 (staff check documents)
  approveLeaveLevel2: async (leaveId, remarks = '') => {
    const response = await axios.put(`/central-office/staff/leaves/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject leave at level 2
  rejectLeaveLevel2: async (leaveId, remarks) => {
    const response = await axios.put(`/central-office/staff/leaves/${leaveId}/reject`, { remarks });
    return response.data;
  },

  // ============= HEAD (Level 3) =============
  // Get leaves approved by staff (level 2)
  getApprovedLevel2Leaves: async () => {
    const response = await axios.get('/central-office/head/leaves/pending');
    return response.data;
  },

  // Approve leave at level 3 (head approval)
  approveLeaveLevel3: async (leaveId, remarks = '') => {
    const response = await axios.put(`/central-office/head/leaves/${leaveId}/approve`, { remarks });
    return response.data;
  },

  // Reject leave at level 3
  rejectLeaveLevel3: async (leaveId, remarks) => {
    const response = await axios.put(`/central-office/head/leaves/${leaveId}/reject`, { remarks });
    return response.data;
  },
};
