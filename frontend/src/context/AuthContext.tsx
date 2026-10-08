import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import {
  getAuthToken,
  clearAuthToken,
  loginApi,
  registerApi,
  getMeApi,
  updateProfileApi,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (payload: { username: string; email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: { full_name?: string; avatar?: string; password?: string }) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: 'login' | 'register') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Khôi phục phiên đăng nhập khi load trang
  useEffect(() => {
    const savedToken = getAuthToken();
    if (savedToken) {
      getMeApi()
        .then((userData) => {
          setUser(userData);
          setToken(savedToken);
        })
        .catch(() => {
          // Token hết hạn hoặc không hợp lệ -> xóa
          clearAuthToken();
          setUser(null);
          setToken(null);
        });
    }
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const resp = await loginApi(usernameOrEmail, password);
    setUser(resp.user);
    setToken(resp.token);
    setIsAuthModalOpen(false);
  }, []);

  const register = useCallback(async (payload: {
    username: string;
    email: string;
    password: string;
    full_name: string;
  }) => {
    const resp = await registerApi(payload);
    setUser(resp.user);
    setToken(resp.token);
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setToken(null);
  }, []);

  const updateProfile = useCallback(async (payload: {
    full_name?: string;
    avatar?: string;
    password?: string;
  }) => {
    const updated = await updateProfileApi(payload);
    setUser(updated);
  }, []);

  const openAuthModal = useCallback((tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isGuest = !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isGuest,
        login,
        register,
        logout,
        updateProfile,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        setAuthModalTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
