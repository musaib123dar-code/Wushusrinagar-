import axios from 'axios';
import { User, Meeting, AuthTokens } from '../../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  }
};

export const meetingAPI = {
  create: async (data: {
    title: string;
    description?: string;
    scheduledStartTime?: Date;
    scheduledEndTime?: Date;
    password?: string;
    maxParticipants?: number;
    settings?: any;
  }) => {
    const response = await api.post('/meetings', data);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/meetings/${id}`);
    return response.data;
  },

  getByCode: async (code: string) => {
    const response = await api.get(`/meetings/code/${code}`);
    return response.data;
  },

  listMyMeetings: async (limit = 50, offset = 0) => {
    const response = await api.get(`/meetings/my-meetings?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  listUpcoming: async (limit = 50) => {
    const response = await api.get(`/meetings/upcoming?limit=${limit}`);
    return response.data;
  },

  start: async (id: string) => {
    const response = await api.post(`/meetings/${id}/start`);
    return response.data;
  },

  end: async (id: string) => {
    const response = await api.post(`/meetings/${id}/end`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/meetings/${id}`);
    return response.data;
  }
};

export default api;
