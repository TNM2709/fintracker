import React, { useState, useEffect, useCallback } from 'react';
import type { User, OAuthLoginRequest } from '../types';
import {
  getAuthToken,
  clearAuthToken,
  loginApi,
  registerApi,
  loginWithOAuthApi,
  getMeApi,
  updateProfileApi,
} from '../services/api';
import { AuthContext } from './auth-context';
export type { AuthContextType } from './auth-context';

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

  const loginWithOAuth = useCallback(
    async (provider: 'google' | 'facebook', customData?: Partial<OAuthLoginRequest>) => {
      const defaultName = provider === 'google' ? 'Google Trader' : 'Facebook Trader';
      const defaultEmail =
        provider === 'google' ? 'google.trader@gmail.com' : 'fb.trader@facebook.com';
      const defaultAvatar =
        provider === 'google'
          ? 'https://api.dicebear.com/7.x/identicon/svg?seed=google_trader'
          : 'https://api.dicebear.com/7.x/identicon/svg?seed=fb_trader';

      const payload: OAuthLoginRequest = {
        provider,
        email: customData?.email || defaultEmail,
        full_name: customData?.full_name || defaultName,
        avatar: customData?.avatar || defaultAvatar,
        provider_id: customData?.provider_id || `${provider}-id-${Date.now()}`,
        token: customData?.token || `oauth-token-${Date.now()}`,
      };

      const resp = await loginWithOAuthApi(payload);
      setUser(resp.user);
      setToken(resp.token);
      setIsAuthModalOpen(false);
    },
    []
  );

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
        loginWithOAuth,
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
