import axios from './axios.config';

export const delegationAPI = {
  // ดูรายชื่อพนักงานที่โอนสิทธิ์ให้ได้
  getEligibleDelegates: async () => {
    const response = await axios.get('/delegations/eligible-delegates');
    return response.data;
  },

  // delegations ที่ฉันสร้าง
  getMyDelegations: async () => {
    const response = await axios.get('/delegations/my');
    return response.data;
  },

  // delegations ที่ฉันได้รับ
  getReceivedDelegations: async () => {
    const response = await axios.get('/delegations/received');
    return response.data;
  },

  // สร้าง delegation ใหม่
  createDelegation: async (data) => {
    const response = await axios.post('/delegations', data);
    return response.data;
  },

  // ยกเลิก delegation
  cancelDelegation: async (id) => {
    const response = await axios.delete(`/delegations/${id}`);
    return response.data;
  },

  // Admin: ดู delegations ทั้งหมด
  getAllDelegations: async () => {
    const response = await axios.get('/delegations/all');
    return response.data;
  },
};
