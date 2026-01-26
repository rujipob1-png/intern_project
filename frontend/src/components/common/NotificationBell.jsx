/**
 * NotificationBell Component
 * แสดงกระดิ่งแจ้งเตือนพร้อม dropdown
 */

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/acting.api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true); // silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await getNotifications({ limit: 10 });
      if (result.success) {
        setNotifications(result.data.notifications || []);
        setUnreadCount(result.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId, actionUrl) => {
    try {
      await markNotificationAsRead(notificationId);
      await fetchNotifications(true);
      
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
      await markAllNotificationsAsRead();
      await fetchNotifications(true);
      toast.success('ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
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
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

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
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div>
              <h3 className="font-semibold text-slate-900">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500">{unreadCount} รายการใหม่</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                อ่านทั้งหมด
              </button>
            )}
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
                    className={`${
                      notification.is_read ? 'bg-white' : 'bg-blue-50'
                    } hover:bg-slate-50 transition-colors`}
                  >
                    <button
                      onClick={() => handleMarkAsRead(notification.id, notification.action_url)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 text-sm">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.action_url && (
                              <span className="text-xs text-blue-600 font-medium">
                                คลิกเพื่อดูรายละเอียด →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
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
            <div className="p-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                ดูการแจ้งเตือนทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
