import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth.api';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (storedToken && storedUser) {
        // Validate token with backend
        try {
          await authAPI.getProfile(); // Call API to check if token is still valid
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // Token invalid - clear localStorage
          console.log('Token invalid, clearing auth...');
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = async (employeeCode, password) => {
    try {
      const data = await authAPI.login(employeeCode, password);
      
      if (data.success) {
        const { token, user } = data.data;
        
        // Save to state
        setToken(token);
        setUser(user);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        
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
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
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
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data));
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
