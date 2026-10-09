import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { X, User, Lock, Mail, Shield, LogOut, Check, Calendar } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      setIsLoading(false);
      return;
    }

    try {
      await updateProfile({
        full_name: fullName,
        password: newPassword || undefined,
      });
      setSuccessMsg('Cập nhật thông tin thành công!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Cập nhật thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: '#121214',
          border: '1px solid #27272A',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00E5FF',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                  {user.full_name || user.username}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                    color: user.role === 'admin' ? '#EF4444' : '#00E5FF',
                    border: `1px solid ${user.role === 'admin' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 229, 255, 0.3)'}`,
                    textTransform: 'uppercase',
                  }}
                >
                  {user.role === 'admin' ? 'Quản Trị Viên' : 'Nhà Đầu Tư'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '2px 0 0 0' }}>
                @{user.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#A1A1AA',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          {successMsg && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '10px 14px',
                borderRadius: 8,
                color: '#10B981',
                fontSize: '13px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 14px',
                borderRadius: 8,
                color: '#EF4444',
                fontSize: '13px',
                marginBottom: 16,
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUpdate}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                Họ và tên
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#71717A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#71717A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    backgroundColor: '#18181B',
                    border: '1px solid #27272A',
                    borderRadius: 8,
                    color: '#71717A',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                Đổi mật khẩu mới (để trống nếu không đổi)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#71717A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {newPassword && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#D4D4D8', marginBottom: 6 }}>
                  Xác nhận mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#71717A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  backgroundColor: '#00E5FF',
                  color: '#09090B',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <LogOut size={15} />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </form>

          {/* Account Meta */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: '1px solid #27272A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#71717A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} />
              <span>Tham gia: {new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={13} />
              <span>Mã ID: {user.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
