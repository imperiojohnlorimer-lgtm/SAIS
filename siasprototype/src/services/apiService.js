import axios from 'axios';

// Create axios instance with base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== Authentication Endpoints ==========
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  verifyToken: () => apiClient.get('/auth/verify'),
};

// ========== User Endpoints ==========
export const userAPI = {
  getAllUsers: (params) => apiClient.get('/users', { params }),
  getUserById: (id) => apiClient.get(`/users/${id}`),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  updateMyProfile: (data) => apiClient.put('/users/profile/me', data),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
};

// ========== Student Endpoints ==========
export const studentAPI = {
  getAllStudents: (params) => apiClient.get('/students', { params }),
  getStudentById: (id) => apiClient.get(`/students/${id}`),
  createStudent: (data) => apiClient.post('/students', data),
  updateStudent: (id, data) => apiClient.put(`/students/${id}`, data),
  deleteStudent: (id) => apiClient.delete(`/students/${id}`),
};

// ========== Attendance Endpoints ==========
export const attendanceAPI = {
  getAllAttendance: (params) => apiClient.get('/attendance', { params }),
  getAttendanceById: (id) => apiClient.get(`/attendance/${id}`),
  clockIn: (data) => apiClient.post('/attendance/clock-in', data),
  clockOut: (id, data) => apiClient.patch(`/attendance/${id}/clock-out`, data),
  deleteAttendance: (id) => apiClient.delete(`/attendance/${id}`),
};

// ========== Report Endpoints ==========
export const reportAPI = {
  getAllReports: (params) => apiClient.get('/reports', { params }),
  getReportById: (id) => apiClient.get(`/reports/${id}`),
  submitReport: (data) => apiClient.post('/reports', data),
  reviewReport: (id, data) => apiClient.patch(`/reports/${id}/review`, data),
};

// ========== Task Endpoints ==========
export const taskAPI = {
  getAllTasks: (params) => apiClient.get('/tasks', { params }),
  getTaskById: (id) => apiClient.get(`/tasks/${id}`),
  createTask: (data) => apiClient.post('/tasks', data),
  updateTask: (id, data) => apiClient.put(`/tasks/${id}`, data),
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
};

// ========== Schedule Endpoints ==========
export const scheduleAPI = {
  getSchedules: (params) => apiClient.get('/schedule', { params }),
  getScheduleById: (id) => apiClient.get(`/schedule/${id}`),
  createSchedule: (data) => apiClient.post('/schedule', data),
  updateSchedule: (id, data) => apiClient.put(`/schedule/${id}`, data),
  deleteSchedule: (id) => apiClient.delete(`/schedule/${id}`),
};

// ========== Convenience export for direct API calls ==========
export const apiService = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
};

// ========== Helper Functions ==========
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('auth_token');
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const clearAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  delete apiClient.defaults.headers.common.Authorization;
};

export default apiClient;
