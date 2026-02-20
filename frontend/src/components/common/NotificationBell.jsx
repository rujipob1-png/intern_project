/**
 * NotificationBell Component
 * แสดงกระดิ่งแจ้งเตือนพร้อม dropdown
 */

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, Trash2 } from 'lucide-react';
import { notificationAPI } from '../../api/notification.api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import toast from 'react-hot-toast';

export const NotificationBell = () => {
  const { user } = useAuth();
  const { notificationUpdate, isRealtimeEnabled } = useRealtime();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch on mount and when realtime triggers update
  useEffect(() => {
    fetchUnreadCount();
  }, [notificationUpdate]);

  // Fallback polling if realtime is not enabled (every 30 seconds)
  useEffect(() => {
    if (isRealtimeEnabled) return; // Skip polling if realtime is enabled

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isRealtimeEnabled]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const result = await notificationAPI.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.data?.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationAPI.getNotifications();
      if (result.success) {
        setNotifications(result.data || []);
        // Update unread count based on fetched data
        const unread = (result.data || []).filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId, actionUrl) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      if (actionUrl) {
        setIsOpen(false);
        navigate(actionUrl);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.deleteNotification(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    const readCount = notifications.filter(n => n.is_read).length;
    if (readCount === 0) {
      toast('ไม่มีแจ้งเตือนที่อ่านแล้ว', { icon: 'ℹ️' });
      return;
    }
    try {
      const result = await notificationAPI.deleteAllRead();
      setNotifications(prev => prev.filter(n => !n.is_read));
      toast.success(`ลบแจ้งเตือนที่อ่านแล้ว ${result.data?.deletedCount || readCount} รายการ`);
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    const userRole = user?.role_name;
    const notificationType = notification.type;

    // Navigate based on notification type and user role
    if (notificationType === 'leave_request' || notificationType === 'new_leave' || notificationType === 'leave_pending') {
      // คำขอลาใหม่ - ไปหน้าอนุมัติตาม role
      if (userRole === 'director') {
        navigate('/director/dashboard');
      } else if (userRole === 'central_office_staff') {
        navigate('/central-office/staff');
      } else if (userRole === 'central_office_head') {
        navigate('/central-office/head');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(`/leave-detail/${notification.reference_id}`);
      }
    } else if (notificationType === 'acting_request') {
      // คำขอปฏิบัติหน้าที่แทน - ไปหน้า acting requests
      navigate('/acting-requests');
    } else if (notificationType === 'cancel_request' || notificationType === 'cancel_pending') {
      // คำขอยกเลิกการลา - ไปหน้าอนุมัติยกเลิกตาม role
      if (userRole === 'director') {
        navigate('/director/cancel-requests');
      } else if (userRole === 'central_office_staff') {
        navigate('/central-office/staff/cancel-requests');
      } else if (userRole === 'central_office_head') {
        navigate('/central-office/head/cancel-requests');
      } else if (userRole === 'admin') {
        navigate('/admin/cancel-requests');
      } else {
        navigate(`/leave-detail/${notification.reference_id}`);
      }
    } else if (notification.reference_type === 'leave' && notification.reference_id) {
      // ประเภทอื่นๆ ที่เกี่ยวกับ leave
      navigate(`/leave-detail/${notification.reference_id}`);
    } else if (notification.action_url) {
      navigate(notification.action_url);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'acting_request':
        return '👤';
      case 'acting_approved':
        return '✅';
      case 'leave_approved':
        return '✔️';
      case 'leave_rejected':
        return '❌';
      case 'leave_request':
      case 'new_leave':
      case 'leave_pending':
        return '📋';
      case 'cancel_request':
      case 'cancel_pending':
        return '🚫';
      case 'cancel_approved':
        return '✅';
      case 'cancel_rejected':
        return '❌';
      default:
        return '🔔';
    }
  };

  // Get display title for notification type
  const getNotificationDisplayTitle = (notification) => {
    const type = notification.type;
    switch (type) {
      case 'leave_request':
      case 'new_leave':
      case 'leave_pending':
        return '📋 คำขอลาใหม่รอการอนุมัติ';
      case 'cancel_request':
      case 'cancel_pending':
        return '🚫 คำขอยกเลิกการลารอการอนุมัติ';
      case 'leave_approved':
        return '✅ คำขอลาได้รับการอนุมัติ';
      case 'leave_rejected':
        return '❌ คำขอลาถูกปฏิเสธ';
      case 'cancel_approved':
        return '✅ คำขอยกเลิกได้รับการอนุมัติ';
      case 'cancel_rejected':
        return '❌ คำขอยกเลิกถูกปฏิเสธ';
      case 'acting_request':
        return '👤 คำขอปฏิบัติหน้าที่แทน';
      case 'acting_approved':
        return '✅ อนุมัติปฏิบัติหน้าที่แทน';
      default:
        return notification.title || 'การแจ้งเตือน';
    }
  };

  const formatTimeAgo = (dateString) => {
    // แปลงเวลาจาก database (UTC) ให้ถูกต้อง
    let date;
    if (dateString) {
      // ถ้าไม่มี timezone indicator ให้เพิ่ม Z (UTC)
      if (!dateString.includes('Z') && !dateString.includes('+')) {
        date = new Date(dateString + 'Z');
      } else {
        date = new Date(dateString);
      }
    } else {
      return '-';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 0) return 'เมื่อสักครู่'; // กรณี timezone issues
    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-700 hover:bg-slate-100 rounded-lg transition-colors"
        style={{ color: '#374151' }}
      >
        <Bell className="w-6 h-6" style={{ color: '#374151' }} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-4 top-[70px] z-50 sm:z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 sm:shadow-lg border border-slate-200 max-h-[calc(100vh-100px)] sm:max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="font-semibold text-slate-900">การแจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500">{unreadCount} รายการใหม่</p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1">
                {notifications.some(n => n.is_read) && (
                  <button
                    onClick={handleDeleteAllRead}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบแจ้งเตือนที่อ่านแล้วทั้งหมด"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">ลบที่อ่านแล้ว</span>
                    <span className="xs:hidden">ลบ</span>
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden xs:inline">อ่านทั้งหมด</span>
                    <span className="xs:hidden">อ่าน</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`${notification.is_read ? 'bg-white' : 'bg-blue-50'
                        } hover:bg-slate-50 transition-colors`}
                    >
                      <div
                        onClick={() => handleNotificationClick(notification)}
                        className="w-full p-4 text-left cursor-pointer"
                      >
                        <div className="flex gap-3">
                          <span className="text-2xl flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-slate-900 text-sm">
                                {getNotificationDisplayTitle(notification)}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!notification.is_read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                                <button
                                  onClick={(e) => handleDelete(notification.id, e)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              {(notification.action_url || notification.reference_id) && (
                                <span className="text-xs text-blue-600 font-medium">
                                  คลิกเพื่อดูรายละเอียด →
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="w-16 h-16 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">ไม่มีการแจ้งเตือน</p>
                  <p className="text-sm text-slate-400 mt-1">คุณไม่มีการแจ้งเตือนใหม่</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500">แสดง {notifications.length} รายการ</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
