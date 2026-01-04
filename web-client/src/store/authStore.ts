import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/apiService';
import { User, AuthResponse } from '../types/shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; avatar?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getUser: () => User | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const authStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiService.login({ email, password });
          
          if (response.success && response.data) {
            const authData: AuthResponse = response.data;
            
            set({
              user: authData.user,
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Login failed',
          });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiService.register(data);
          
          if (response.success && response.data) {
            const authData: AuthResponse = response.data;
            
            set({
              user: authData.user,
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Registration failed',
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get();
          if (refreshToken) {
            await apiService.logout(refreshToken);
          }
        } catch (error) {
          console.error('Logout API call failed:', error);
        } finally {
          // Clear local state regardless of API call success
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          // Clear any stored data
          localStorage.removeItem('vc_user_token');
          localStorage.removeItem('vc_user_refresh_token');
          localStorage.removeItem('vc_user_profile');
        }
      },

      refreshTokens: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await apiService.refreshToken(refreshToken);
          
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            user: response.user,
            isAuthenticated: true,
          });
        } catch (error: any) {
          console.error('Token refresh failed:', error);
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      updateProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiService.updateProfile(data);
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Profile update failed');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Profile update failed',
          });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiService.changePassword({ currentPassword, newPassword });
          
          if (response.success) {
            set({ isLoading: false, error: null });
          } else {
            throw new Error(response.message || 'Password change failed');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Password change failed',
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Helper methods
      getAccessToken: () => {
        const state = get();
        return state.accessToken;
      },
      getRefreshToken: () => {
        const state = get();
        return state.refreshToken;
      },
      getUser: () => {
        const state = get();
        return state.user;
      },
      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },
    }),
    {
      name: 'vc-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);