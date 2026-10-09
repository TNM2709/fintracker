import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { X, LogIn, UserPlus, Shield, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab, login, register } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

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
        setErrorMessage('Đăng nhập thất bại');
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
        setErrorMessage('Đăng ký thất bại');
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
        setErrorMessage('Đăng nhập thất bại');
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
          backgroundColor: '#121214',
          border: '1px solid #27272A',
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
            borderBottom: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(24, 24, 27, 0.8), rgba(18, 18, 20, 0.8))',
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
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                {authModalTab === 'login' ? 'Đăng Nhập Tài Khoản' : 'Tạo Tài Khoản Mới'}
              </h2>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '2px 0 0 0' }}>
                {authModalTab === 'login'
                  ? 'Quản lý sổ cái và thông báo cá nhân hóa'
                  : 'Bắt đầu theo dõi tài sản và danh mục riêng'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            style={{
              background: 'none',
              border: 'none',
              color: '#A1A1AA',
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
              backgroundColor: '#09090B',
              border: '1px solid #27272A',
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
                backgroundColor: authModalTab === 'login' ? '#27272A' : 'transparent',
                color: authModalTab === 'login' ? '#FAFAFA' : '#A1A1AA',
                transition: 'all 0.15s',
              }}
            >
              Đăng Nhập
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
                backgroundColor: authModalTab === 'register' ? '#27272A' : 'transparent',
                color: authModalTab === 'register' ? '#FAFAFA' : '#A1A1AA',
                transition: 'all 0.15s',
              }}
            >
              Đăng Ký
            </button>
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
        <div style={{ padding: '20px 24px' }}>
          {authModalTab === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                  Tên đăng nhập hoặc Email
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#71717A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="admin hoặc email..."
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      backgroundColor: '#09090B',
                      border: '1px solid #3F3F46',
                      borderRadius: 8,
                      color: '#FAFAFA',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#71717A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 36px',
                      backgroundColor: '#09090B',
                      border: '1px solid #3F3F46',
                      borderRadius: 8,
                      color: '#FAFAFA',
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
                      color: '#71717A',
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
                {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
              </button>

              {/* Quick Demo logins */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #27272A' }}>
                <p style={{ fontSize: '11px', color: '#A1A1AA', margin: '0 0 10px 0', textAlign: 'center' }}>
                  ⚡ Thử nghiệm nhanh 1 chạm:
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#09090B',
                    border: '1px solid #3F3F46',
                    borderRadius: 8,
                    color: '#FAFAFA',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                  Tên đăng nhập
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#71717A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="nguyenvana"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      backgroundColor: '#09090B',
                      border: '1px solid #3F3F46',
                      borderRadius: 8,
                      color: '#FAFAFA',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="#71717A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="vana@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      backgroundColor: '#09090B',
                      border: '1px solid #3F3F46',
                      borderRadius: 8,
                      color: '#FAFAFA',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                  Mật khẩu (tối thiểu 6 ký tự)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#71717A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
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
                      backgroundColor: '#09090B',
                      border: '1px solid #3F3F46',
                      borderRadius: 8,
                      color: '#FAFAFA',
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
                      color: '#71717A',
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
                {isLoading ? 'Đang đăng ký...' : 'Tạo Tài Khoản Ngay'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
