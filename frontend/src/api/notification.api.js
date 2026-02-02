import axios from './axios.config';

export const notificationAPI = {
  // ดึงรายการแจ้งเตือนทั้งหมด
  getNotifications: async () => {
    const response = await axios.get('/notifications');
    return response.data;
  },

  // ดึงจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
  getUnreadCount: async () => {
    const response = await axios.get('/notifications/unread-count');
    return response.data;
  },

  // ทำเครื่องหมายว่าอ่านแล้ว
  markAsRead: async (id) => {
    const response = await axios.put(`/notifications/${id}/read`);
    return response.data;
  },

  // ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
  markAllAsRead: async () => {
    const response = await axios.put('/notifications/read-all');
    return response.data;
  },

  // ลบแจ้งเตือน
  deleteNotification: async (id) => {
    const response = await axios.delete(`/notifications/${id}`);
    return response.data;
  },
};
