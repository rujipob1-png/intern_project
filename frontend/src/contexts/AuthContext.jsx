import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth.api';
import { STORAGE_KEYS } from '../utils/constants';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from sessionStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = sessionStorage.getItem(STORAGE_KEYS.USER);

      if (storedToken && storedUser) {
        // Validate token with backend and get fresh user data
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            // Use fresh data from API
            setToken(storedToken);
            setUser(response.data);
            sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));

            // Sync with Supabase client for realtime
            if (supabase) {
              supabase.auth.setSession({
                access_token: storedToken,
                refresh_token: '' // JWT doesn't have refresh token in this implementation
              });
            }
          } else {
            throw new Error('Invalid token');
          }
        } catch (error) {
          // Token invalid - clear localStorage
          console.log('Token invalid, clearing auth...');
          sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
          sessionStorage.removeItem(STORAGE_KEYS.USER);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Auto-refresh profile ทุก 60 วิ สำหรับ user ที่มี/เคยมี delegation (เพื่อ sync role กลับ)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const res = await authAPI.getProfile();
        if (res.success) {
          setUser(prev => {
            const changed = prev?.role_name !== res.data.role_name || prev?.isDelegated !== res.data.isDelegated;
            if (changed) {
              sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data));
              return res.data;
            }
            return prev;
          });
        }
      } catch { /* ignore */ }
    }, 60000);
    return () => clearInterval(interval);
  }, [token]);

  // Login function
  const login = async (employeeCode, password) => {
    try {
      const data = await authAPI.login(employeeCode, password);

      if (data.success) {
        const { token, user } = data.data;

        // Save to state
        setToken(token);
        setUser(user);

        // Save to sessionStorage
        sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        // Sync with Supabase client for realtime
        if (supabase) {
          supabase.auth.setSession({
            access_token: token,
            refresh_token: ''
          });
        }

        // Fetch profile to get delegation info (middleware runs on getProfile)
        try {
          const profileRes = await authAPI.getProfile();
          if (profileRes.success) {
            setUser(profileRes.data);
            sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profileRes.data));
          }
        } catch {
          // ไม่เป็นไร ใช้ data จาก login ก่อน
        }

        return { success: true };
      }

      return {
        success: false,
        message: data.message,
        errorCode: data.data?.errorCode
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
        errorCode: error.data?.errorCode
      };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);

    // Clear Supabase session
    if (supabase) {
      supabase.auth.signOut();
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Check user role
  const hasRole = (requiredLevel) => {
    return user?.roleLevel >= requiredLevel;
  };

  // Refresh user data from API
  const refreshUser = async () => {
    try {
      const data = await authAPI.getProfile();
      if (data.success) {
        setUser(data.data);
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data));
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error refreshing user:', error);
      return { success: false };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
