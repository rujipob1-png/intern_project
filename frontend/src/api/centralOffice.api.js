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
};
