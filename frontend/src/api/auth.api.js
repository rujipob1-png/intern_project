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
};
