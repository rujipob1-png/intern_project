/**
 * RealtimeContext
 * จัดการ Supabase Realtime subscriptions สำหรับ real-time updates
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isRealtimeEnabled } from '../config/supabase';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [notificationUpdate, setNotificationUpdate] = useState(0);
  const [leaveUpdate, setLeaveUpdate] = useState(0);
  const [approvalUpdate, setApprovalUpdate] = useState(0);
  const channelRef = useRef(null);

  // Subscribe to realtime changes when user is authenticated
  useEffect(() => {
    if (!user?.id || !isRealtimeEnabled()) {
      return;
    }

    // Create a channel for this user
    const channel = supabase
      .channel(`user-${user.id}`)
      // Listen to notifications for this user
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Notification update:', payload);
          setNotificationUpdate(prev => prev + 1);
        }
      )
      // Listen to leave requests created by this user
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaves',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📋 Leave update:', payload);
          setLeaveUpdate(prev => prev + 1);
        }
      )
      // Listen to approvals related to leaves of this user
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approvals'
        },
        (payload) => {
          console.log('✅ Approval update:', payload);
          setApprovalUpdate(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id]);

  // Trigger notification refresh
  const triggerNotificationRefresh = useCallback(() => {
    setNotificationUpdate(prev => prev + 1);
  }, []);

  // Trigger leave refresh
  const triggerLeaveRefresh = useCallback(() => {
    setLeaveUpdate(prev => prev + 1);
  }, []);

  // Trigger approval refresh
  const triggerApprovalRefresh = useCallback(() => {
    setApprovalUpdate(prev => prev + 1);
  }, []);

  const value = {
    // Update counters - components can use these in useEffect dependencies
    notificationUpdate,
    leaveUpdate,
    approvalUpdate,
    // Manual trigger functions
    triggerNotificationRefresh,
    triggerLeaveRefresh,
    triggerApprovalRefresh,
    // Check if realtime is enabled
    isRealtimeEnabled: isRealtimeEnabled(),
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

// Custom hook to use realtime context
export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};
