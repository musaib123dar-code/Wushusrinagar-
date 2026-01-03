import { create } from 'zustand';
import { User } from '../../../shared/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const accessToken = localStorage.getItem('accessToken');
  const storedUser = localStorage.getItem('user');
  
  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    isAuthenticated: !!accessToken,
    setUser: (user) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
      set({ user, isAuthenticated: !!user });
    },
    setTokens: (accessToken, refreshToken) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      set({ isAuthenticated: true });
    },
    clearAuth: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  };
});
