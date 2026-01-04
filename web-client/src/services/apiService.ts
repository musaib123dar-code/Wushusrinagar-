import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config/constants';
import { ApiResponse } from '../types/shared';
import { authStore } from '../store/authStore';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = authStore.getState().getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = authStore.getState().getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              authStore.getState().setTokens(response.accessToken, response.refreshToken);
              
              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            authStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async login(data: { email: string; password: string }): Promise<ApiResponse> {
    const response = await this.api.post('/auth/login', data);
    return response.data;
  }

  async logout(refreshToken?: string): Promise<ApiResponse> {
    const response = await this.api.post('/auth/logout', { refreshToken });
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await this.api.post('/auth/refresh-token', { refreshToken });
    return response.data.data;
  }

  async getProfile(): Promise<ApiResponse> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): Promise<ApiResponse> {
    const response = await this.api.put('/auth/profile', data);
    return response.data;
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/auth/change-password', data);
    return response.data;
  }

  async searchUsers(query: string, limit?: number): Promise<ApiResponse> {
    const params = new URLSearchParams({ query, ...(limit && { limit: limit.toString() }) });
    const response = await this.api.get(`/auth/search?${params}`);
    return response.data;
  }

  async getOnlineUsers(): Promise<ApiResponse> {
    const response = await this.api.get('/auth/online');
    return response.data;
  }

  // Meeting endpoints
  async createMeeting(data: {
    title: string;
    description?: string;
    isPrivate?: boolean;
    password?: string;
    maxParticipants: number;
    startTime: string;
    duration?: number;
    recordingEnabled?: boolean;
    chatEnabled?: boolean;
    screenShareEnabled?: boolean;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/meetings', data);
    return response.data;
  }

  async getMeeting(meetingId: string): Promise<ApiResponse> {
    const response = await this.api.get(`/meetings/${meetingId}`);
    return response.data;
  }

  async getUserMeetings(page?: number, limit?: number): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.api.get(`/meetings/user/me?${params}`);
    return response.data;
  }

  async getUpcomingMeetings(limit?: number): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.api.get(`/meetings/upcoming?${params}`);
    return response.data;
  }

  async joinMeeting(meetingId: string, password?: string): Promise<ApiResponse> {
    const response = await this.api.post(`/meetings/${meetingId}/join`, { password });
    return response.data;
  }

  async leaveMeeting(meetingId: string): Promise<ApiResponse> {
    const response = await this.api.post(`/meetings/${meetingId}/leave`);
    return response.data;
  }

  async startMeeting(meetingId: string): Promise<ApiResponse> {
    const response = await this.api.post(`/meetings/${meetingId}/start`);
    return response.data;
  }

  async endMeeting(meetingId: string): Promise<ApiResponse> {
    const response = await this.api.post(`/meetings/${meetingId}/end`);
    return response.data;
  }

  async cancelMeeting(meetingId: string): Promise<ApiResponse> {
    const response = await this.api.post(`/meetings/${meetingId}/cancel`);
    return response.data;
  }

  async getParticipants(meetingId: string): Promise<ApiResponse> {
    const response = await this.api.get(`/meetings/${meetingId}/participants`);
    return response.data;
  }

  async updateMediaState(
    meetingId: string,
    mediaState: {
      isMuted?: boolean;
      isVideoEnabled?: boolean;
      isScreenSharing?: boolean;
    }
  ): Promise<ApiResponse> {
    const response = await this.api.put(`/meetings/${meetingId}/media-state`, mediaState);
    return response.data;
  }

  async deleteMeeting(meetingId: string): Promise<ApiResponse> {
    const response = await this.api.delete(`/meetings/${meetingId}`);
    return response.data;
  }

  // Message endpoints
  async sendMessage(data: {
    meetingId: string;
    content: string;
    type?: string;
    replyToId?: string;
    mentions?: string[];
  }): Promise<ApiResponse> {
    const response = await this.api.post('/messages', data);
    return response.data;
  }

  async getMeetingMessages(
    meetingId: string,
    limit?: number,
    offset?: number,
    before?: string
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (before) params.append('before', before);
    
    const response = await this.api.get(`/messages/meeting/${meetingId}?${params}`);
    return response.data;
  }

  async editMessage(messageId: string, content: string): Promise<ApiResponse> {
    const response = await this.api.put(`/messages/${messageId}`, { content });
    return response.data;
  }

  async deleteMessage(messageId: string): Promise<ApiResponse> {
    const response = await this.api.delete(`/messages/${messageId}`);
    return response.data;
  }

  async searchMessages(
    meetingId: string,
    query: string,
    limit?: number
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({ query });
    if (limit) params.append('limit', limit.toString());
    
    const response = await this.api.get(`/messages/meeting/${meetingId}/search?${params}`);
    return response.data;
  }

  async getMentions(limit?: number, offset?: number): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response = await this.api.get(`/messages/mentions?${params}`);
    return response.data;
  }

  async getMessageStats(meetingId: string): Promise<ApiResponse> {
    const response = await this.api.get(`/messages/meeting/${meetingId}/stats`);
    return response.data;
  }

  async markMessageAsRead(messageId: string): Promise<ApiResponse> {
    const response = await this.api.post(`/messages/${messageId}/read`);
    return response.data;
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.request(config);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();