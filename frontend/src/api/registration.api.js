import axios from './axios.config';

export const registrationAPI = {
  // ลงทะเบียนพนักงานใหม่ (Public)
  register: async (data) => {
    const response = await axios.post('/registration/register', data);
    return response.data;
  },

  // ดึงรายการคำขอลงทะเบียน (Admin / Central Office Head)
  getRequests: async (status = 'all') => {
    const response = await axios.get('/registration/requests', {
      params: { status },
    });
    return response.data;
  },

  // อนุมัติคำขอ
  approve: async (id, data = {}) => {
    const response = await axios.put(`/registration/requests/${id}/approve`, data);
    return response.data;
  },

  // ปฏิเสธคำขอ
  reject: async (id, data = {}) => {
    const response = await axios.put(`/registration/requests/${id}/reject`, data);
    return response.data;
  },

  // ลบคำขอ
  delete: async (id) => {
    const response = await axios.delete(`/registration/requests/${id}`);
    return response.data;
  },
};
