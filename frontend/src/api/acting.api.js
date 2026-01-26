/**
 * Acting API
 * เรียกใช้ API สำหรับผู้ปฏิบัติหน้าที่แทนและการแจ้งเตือน
 */

import api from './axios.config';

/**
 * ดึงรายชื่อพนักงานในชั้นเดียวกัน
 */
export const getSameLevelEmployees = async () => {
  const response = await api.get('/acting/same-level-employees');
  return response.data;
};

/**
 * ดึงคำขอที่ต้องอนุมัติการเป็นผู้ปฏิบัติหน้าที่แทน
 */
export const getActingRequests = async () => {
  const response = await api.get('/acting/requests');
  return response.data;
};

/**
 * อนุมัติการเป็นผู้ปฏิบัติหน้าที่แทน
 */
export const approveActingRequest = async (leaveId, comment = '') => {
  const response = await api.post(`/acting/requests/${leaveId}/approve`, { comment });
  return response.data;
};

/**
 * ดึงการแจ้งเตือนทั้งหมด
 */
export const getNotifications = async (params = {}) => {
  const response = await api.get('/acting/notifications', { params });
  return response.data;
};

/**
 * ทำเครื่องหมายว่าอ่านแล้ว
 */
export const markNotificationAsRead = async (notificationId) => {
  const response = await api.put(`/acting/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * ทำเครื่องหมายว่าอ่านทั้งหมด
 */
export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/acting/notifications/read-all');
  return response.data;
};

export default {
  getSameLevelEmployees,
  getActingRequests,
  approveActingRequest,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
