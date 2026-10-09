import { createContext, useContext } from 'react';
import type { User, OAuthLoginRequest } from '../types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'facebook', customData?: Partial<OAuthLoginRequest>) => Promise<void>;
  register: (payload: { username: string; email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: { full_name?: string; avatar?: string; password?: string }) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: 'login' | 'register') => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
