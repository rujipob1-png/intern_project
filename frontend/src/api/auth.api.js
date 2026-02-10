import axios from './axios.config';

export const authAPI = {
  // Login
  login: async (employeeCode, password) => {
    const response = await axios.post('/auth/login', {
      employeeCode,
      password,
    });
    return response.data;
  },

  // Get profile
  getProfile: async () => {
    const response = await axios.get('/auth/profile');
    return response.data;
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    const response = await axios.put('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Update notification settings (email)
  updateNotificationSettings: async (email, emailNotifications) => {
    const response = await axios.put('/auth/notification-settings', {
      email,
      emailNotifications,
    });
    return response.data;
  },

  // Upload profile image
  uploadProfileImage: async (imageBase64) => {
    const response = await axios.post('/auth/profile-image', {
      imageBase64,
    });
    return response.data;
  },

  // Delete profile image
  deleteProfileImage: async () => {
    const response = await axios.delete('/auth/profile-image');
    return response.data;
  },
};
