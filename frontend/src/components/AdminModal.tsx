import React, { useState, useEffect, useCallback } from 'react';
import type { AdminUserSummary, AdminStats } from '../types';
import {
  fetchAdminUsers,
  updateAdminUserRole,
  deleteAdminUser,
  fetchAdminStats,
} from '../services/api';
import { useAuth } from '../context/useAuth';
import { useLanguage } from '../context/useLanguage';
import {
  X,
  Shield,
  Users,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Database,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setActionMsg(null);
    try {
      const [uList, sData] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminStats(),
      ]);
      setUsers(uList);
      setStats(sData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionMsg({ text: err.message, error: true });
      } else {
        setActionMsg({ text: t.common.error, error: true });
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        loadData();
      });
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const handleRoleToggle = async (targetUser: AdminUserSummary) => {
    const newRole = targetUser.user.role === 'admin' ? 'user' : 'admin';
    const confirmText = `${t.admin.toggleRole}: ${targetUser.user.username} -> ${newRole}?`;

    if (!window.confirm(confirmText)) return;

    try {
      await updateAdminUserRole(targetUser.user.id, newRole);
      setActionMsg({ text: `${t.admin.toggleRole}: ${targetUser.user.username} (${newRole})` });
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionMsg({ text: err.message, error: true });
      } else {
        setActionMsg({ text: t.common.error, error: true });
      }
    }
  };

  const handleDelete = async (targetUser: AdminUserSummary) => {
    if (!window.confirm(`${t.admin.deleteConfirm} (${targetUser.user.username})`)) {
      return;
    }

    try {
      await deleteAdminUser(targetUser.user.id);
      setActionMsg({ text: `${t.admin.deleteUser}: ${targetUser.user.username} (${t.common.success})` });
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionMsg({ text: err.message, error: true });
      } else {
        setActionMsg({ text: t.common.error, error: true });
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.user.username.toLowerCase().includes(q) ||
      u.user.email.toLowerCase().includes(q) ||
      (u.user.full_name && u.user.full_name.toLowerCase().includes(q))
    );
  });

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
          maxWidth: 820,
          maxHeight: '92vh',
          backgroundColor: '#121214',
          border: '1px solid #27272A',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(239, 68, 68, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(24, 24, 27, 0.9))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {t.admin.controlCenter}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  ADMIN ONLY
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                {t.admin.controlDesc}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={loadData}
              title={t.header.quickRefresh}
              style={{
                background: 'none',
                border: '1px solid #3F3F46',
                borderRadius: 8,
                color: '#A1A1AA',
                cursor: 'pointer',
                padding: 6,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RefreshCw size={15} />
            </button>
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
        </div>

        {/* Action feedback message */}
        {actionMsg && (
          <div style={{ padding: '10px 24px 0 24px' }}>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: actionMsg.error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${actionMsg.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                color: actionMsg.error ? '#EF4444' : '#10B981',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {actionMsg.text}
            </div>
          </div>
        )}

        {/* Content body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Stats cards */}
          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  padding: 14,
                  backgroundColor: '#18181B',
                  border: '1px solid #27272A',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#A1A1AA', fontSize: '11px' }}>
                  <Users size={13} />
                  <span>{t.admin.totalUsers}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA', marginTop: 4 }}>
                  {stats.total_users}
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  backgroundColor: '#18181B',
                  border: '1px solid #27272A',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: '11px' }}>
                  <Shield size={13} />
                  <span>{t.admin.roleAdmin}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444', marginTop: 4 }}>
                  {stats.total_admins}
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  backgroundColor: '#18181B',
                  border: '1px solid #27272A',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00E5FF', fontSize: '11px' }}>
                  <TrendingUp size={13} />
                  <span>{t.admin.ledgerTxCount}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#00E5FF', marginTop: 4 }}>
                  {stats.total_transactions}
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  backgroundColor: '#18181B',
                  border: '1px solid #27272A',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: '11px' }}>
                  <Database size={13} />
                  <span>{t.admin.database}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', marginTop: 8, textTransform: 'uppercase' }}>
                  {stats.database_driver}
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={15}
                color="#71717A"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder={t.admin.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
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
            <div style={{ fontSize: '12px', color: '#71717A' }}>
              {filteredUsers.length} / {users.length}
            </div>
          </div>

          {/* User Table */}
          <div
            style={{
              border: '1px solid #27272A',
              borderRadius: 10,
              overflow: 'hidden',
              backgroundColor: '#09090B',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#18181B', borderBottom: '1px solid #27272A', color: '#A1A1AA' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '12px' }}>{t.admin.colUser}</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '12px' }}>{t.admin.colRole}</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '12px' }}>{t.admin.colTxCount}</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '12px' }}>{t.admin.colAlerts}</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '12px' }}>{t.admin.colCreatedAt}</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '12px', textAlign: 'right' }}>{t.admin.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {t.common.loading}
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                      {t.common.search}: 0
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => {
                    const isMasterAdmin = item.user.id === 'usr-admin';
                    const isCurrent = item.user.id === currentUser?.id;

                    return (
                      <tr
                        key={item.user.id}
                        style={{
                          borderBottom: '1px solid #1F1F23',
                          transition: 'background-color 0.1s',
                        }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: item.user.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                                color: item.user.role === 'admin' ? '#EF4444' : '#00E5FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              {item.user.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {item.user.full_name || item.user.username}
                                {isCurrent && (
                                  <span style={{ fontSize: '10px', color: '#00E5FF', marginLeft: 6 }}>
                                    {t.admin.youTag}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#71717A' }}>
                                {item.user.email} • @{item.user.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 4,
                              backgroundColor: item.user.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 229, 255, 0.1)',
                              color: item.user.role === 'admin' ? '#EF4444' : '#00E5FF',
                              border: `1px solid ${item.user.role === 'admin' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 229, 255, 0.25)'}`,
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.user.role}
                          </span>
                        </td>

                        <td style={{ padding: '12px 14px', color: '#D4D4D8' }}>
                          {item.transaction_count} GD
                        </td>

                        <td style={{ padding: '12px 14px', color: '#D4D4D8' }}>
                          {item.alert_count}
                        </td>

                        <td style={{ padding: '12px 14px', color: '#71717A', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} />
                            <span>{new Date(item.user.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            {/* Role toggle button */}
                            {!isMasterAdmin && (
                              <button
                                onClick={() => handleRoleToggle(item)}
                                title={item.user.role === 'admin' ? t.admin.demoteUser : t.admin.promoteAdmin}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  backgroundColor: item.user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                  border: `1px solid ${item.user.role === 'admin' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                  color: item.user.role === 'admin' ? '#EF4444' : '#10B981',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                {item.user.role === 'admin' ? <UserX size={13} /> : <UserCheck size={13} />}
                                <span>{item.user.role === 'admin' ? t.admin.demoteUser : t.admin.promoteAdmin}</span>
                              </button>
                            )}

                            {/* Delete button */}
                            {!isMasterAdmin && !isCurrent && (
                              <button
                                onClick={() => handleDelete(item)}
                                title={t.admin.deleteUser}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
