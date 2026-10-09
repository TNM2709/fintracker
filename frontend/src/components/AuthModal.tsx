import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../context/useLanguage';
import { X, LogIn, UserPlus, Shield, User, Lock, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    loginWithOAuth,
    register,
  } = useAuth();
  const { t } = useLanguage();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Custom Social Email state (allows users to enter their own real Gmail / Facebook)
  const [showCustomSocialInput, setShowCustomSocialInput] = useState(false);
  const [socialCustomProvider, setSocialCustomProvider] = useState<'google' | 'facebook'>('google');
  const [socialCustomEmail, setSocialCustomEmail] = useState('');
  const [socialCustomName, setSocialCustomName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(usernameOrEmail, password);
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t.auth.loginFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      await register({
        full_name: regFullName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
      });
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t.auth.registerFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(user, pass);
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t.auth.loginFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await loginWithOAuth(provider);
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t.auth.loginFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialCustomEmail.trim()) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      await loginWithOAuth(socialCustomProvider, {
        email: socialCustomEmail.trim(),
        full_name: socialCustomName.trim() || undefined,
        provider_id: `${socialCustomProvider}-${Date.now()}`,
      });
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t.auth.loginFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-card)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 229, 255, 0.1)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00E5FF',
              }}
            >
              {authModalTab === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {authModalTab === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                {authModalTab === 'login'
                  ? t.auth.loginSubtitle
                  : t.auth.registerSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div style={{ padding: '16px 24px 0 24px' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-body)',
              border: '1px solid var(--border-card)',
              borderRadius: 8,
              padding: 3,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('login');
                setErrorMessage('');
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: authModalTab === 'login' ? 'var(--bg-surface)' : 'transparent',
                color: authModalTab === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: authModalTab === 'login' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.auth.loginTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('register');
                setErrorMessage('');
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: authModalTab === 'register' ? 'var(--bg-surface)' : 'transparent',
                color: authModalTab === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: authModalTab === 'register' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.auth.registerTab}
            </button>
          </div>
        </div>

        {/* Social Login Buttons (Google / Gmail & Facebook) */}
        <div style={{ padding: '16px 24px 0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Google / Gmail button */}
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-card)',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Đăng nhập tài khoản Google / Gmail"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Facebook button */}
            <button
              type="button"
              onClick={() => handleSocialLogin('facebook')}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-card)',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Đăng nhập tài khoản Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          {/* Toggle custom social email input */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setShowCustomSocialInput(!showCustomSocialInput)}
              style={{
                background: 'none',
                border: 'none',
                color: '#00E5FF',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '2px 4px',
                textDecoration: 'underline',
              }}
            >
              {showCustomSocialInput ? '✕ Đóng nhập tùy chọn' : `✉️ ${t.auth.customSocialPrompt}`}
            </button>
          </div>

          {/* Optional custom social email form */}
          {showCustomSocialInput && (
            <form
              onSubmit={handleCustomSocialSubmit}
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'var(--bg-body)',
                border: '1px solid var(--border-card)',
              }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => setSocialCustomProvider('google')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '11px',
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: socialCustomProvider === 'google' ? '#00E5FF' : 'var(--border-card)',
                    backgroundColor: socialCustomProvider === 'google' ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Gmail (Google)
                </button>
                <button
                  type="button"
                  onClick={() => setSocialCustomProvider('facebook')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: '11px',
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: socialCustomProvider === 'facebook' ? '#1877F2' : 'var(--border-card)',
                    backgroundColor: socialCustomProvider === 'facebook' ? 'rgba(24, 119, 242, 0.1)' : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Facebook
                </button>
              </div>

              <input
                type="email"
                required
                placeholder={socialCustomProvider === 'google' ? 'user@gmail.com' : 'user@facebook.com'}
                value={socialCustomEmail}
                onChange={(e) => setSocialCustomEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 6,
                }}
              />

              <input
                type="text"
                placeholder="Tên hiển thị (tùy chọn)"
                value={socialCustomName}
                onChange={(e) => setSocialCustomName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 8,
                }}
              />

              <button
                type="submit"
                disabled={isLoading || !socialCustomEmail.trim()}
                style={{
                  width: '100%',
                  padding: '7px',
                  backgroundColor: '#00E5FF',
                  color: '#09090B',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? t.auth.authenticating : `Xác nhận & Đăng nhập ${socialCustomProvider === 'google' ? 'Google' : 'Facebook'}`}
              </button>
            </form>
          )}

          {/* Divider between Social and Form */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 0 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-card)' }} />
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {t.auth.orContinueWith}
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-card)' }} />
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div style={{ padding: '12px 24px 0 24px' }}>
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 14px',
                borderRadius: 8,
                color: '#EF4444',
                fontSize: '13px',
              }}
            >
              {errorMessage}
            </div>
          </div>
        )}

        {/* Form Body */}
        <div style={{ padding: '16px 24px 20px 24px' }}>
          {authModalTab === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {t.auth.usernameOrEmail}
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder={t.auth.placeholderUserOrEmail}
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      backgroundColor: 'var(--bg-body)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {t.auth.password}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 36px',
                      backgroundColor: 'var(--bg-body)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 8,
                  backgroundColor: '#00E5FF',
                  color: '#09090B',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  boxShadow: '0 0 20px rgba(0, 229, 255, 0.25)',
                }}
              >
                {isLoading ? t.auth.authenticating : t.auth.signInBtn}
              </button>

              {/* Quick Demo logins */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-card)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 10px 0', textAlign: 'center' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#F59E0B' }} />
                  {t.auth.quickDemo}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', 'admin123')}
                    disabled={isLoading}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 8,
                      color: '#F87171',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Shield size={14} />
                    <span>Admin Demo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('demo', 'user123')}
                    disabled={isLoading}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 8,
                      color: '#34D399',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <User size={14} />
                    <span>User Demo</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {t.auth.fullName}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.auth.placeholderFullName}
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-body)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {t.profile.username}
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="nguyenvana"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      backgroundColor: 'var(--bg-body)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="vana@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      backgroundColor: 'var(--bg-body)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {t.auth.passwordMin6}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 36px',
                      backgroundColor: 'var(--bg-body)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 8,
                  backgroundColor: '#00E5FF',
                  color: '#09090B',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  boxShadow: '0 0 20px rgba(0, 229, 255, 0.25)',
                }}
              >
                {isLoading ? t.auth.registering : t.auth.signUpBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
