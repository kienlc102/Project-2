'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout, getToken, removeToken, updateProfile, updatePassword, deleteAccount } from '@/lib/auth';
import { LogOut, User, Check, X, Trash2, ArrowLeft } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Update full name state
  const [editingFullName, setEditingFullName] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [updatingFullName, setUpdatingFullName] = useState(false);
  const [fullNameMessage, setFullNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update email state
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update password state
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account state
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await getProfile(token);
        if (response.success) {
          setUser(response.data);
        } else {
          setError('Không thể tải thông tin profile');
          removeToken();
          router.push('/login');
        }
      } catch (err) {
        setError('Lỗi khi tải thông tin profile');
        console.error('Profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    const token = getToken();
    if (token) {
      try {
        await logout(token);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    removeToken();
    router.push('/login');
  };

  const handleUpdateFullName = async () => {
    if (!newFullName.trim()) {
      setFullNameMessage({ type: 'error', text: 'Họ và tên không được để trống' });
      return;
    }

    const token = getToken();
    if (!token) return;

    setUpdatingFullName(true);
    try {
      const response = await updateProfile(token, { fullName: newFullName });
      if (response.success) {
        setUser({ ...user!, fullName: response.data.fullName });
        setEditingFullName(false);
        setFullNameMessage({ type: 'success', text: 'Cập nhật tên thành công' });
        setTimeout(() => setFullNameMessage(null), 3000);
      } else {
        setFullNameMessage({ type: 'error', text: response.message || 'Lỗi cập nhật' });
      }
    } catch (err) {
      setFullNameMessage({ type: 'error', text: 'Lỗi khi cập nhật' });
    } finally {
      setUpdatingFullName(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      setEmailMessage({ type: 'error', text: 'Email không được để trống' });
      return;
    }

    if (!newEmail.includes('@')) {
      setEmailMessage({ type: 'error', text: 'Email không hợp lệ' });
      return;
    }

    const token = getToken();
    if (!token) return;

    setUpdatingEmail(true);
    try {
      const response = await updateProfile(token, { email: newEmail });
      if (response.success) {
        setUser({ ...user!, email: response.data.email });
        setEditingEmail(false);
        setEmailMessage({ type: 'success', text: 'Cập nhật email thành công' });
        setTimeout(() => setEmailMessage(null), 3000);
      } else {
        setEmailMessage({ type: 'error', text: response.message || 'Lỗi cập nhật' });
      }
    } catch (err) {
      setEmailMessage({ type: 'error', text: 'Lỗi khi cập nhật' });
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ các trường' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới không trùng khớp' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    const token = getToken();
    if (!token) return;

    setUpdatingPassword(true);
    try {
      const response = await updatePassword(token, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (response.success) {
        setEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMessage({ type: 'success', text: 'Cập nhật mật khẩu thành công' });
        setTimeout(() => setPasswordMessage(null), 3000);
      } else {
        setPasswordMessage({ type: 'error', text: response.message || 'Lỗi cập nhật' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'Lỗi khi cập nhật' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = getToken();
    if (!token) return;

    setDeleteLoading(true);
    try {
      const response = await deleteAccount(token, deleteConfirmPassword);
      if (response.success) {
        setDeleteMessage({ type: 'success', text: 'Tài khoản đã được xóa thành công' });
        removeToken();

        // Redirect ra Landing Page (trang chủ) sau 2 giây theo đúng flow
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setDeleteMessage({ type: 'error', text: response.message || 'Lỗi xóa tài khoản' });
        // Chỉ reset form khi xóa thất bại
        setDeleteConfirming(false);
        setDeleteConfirmPassword('');
      }
    } catch (err) {
      setDeleteMessage({ type: 'error', text: 'Lỗi khi xóa tài khoản' });
      setDeleteConfirming(false);
      setDeleteConfirmPassword('');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8">
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center gap-2">
            <X className="w-5 h-5 shrink-0" />
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600 text-lg">Không tìm thấy thông tin user</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden px-4 py-12">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        {/* Header Card */}
        <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8 transition-all hover:bg-slate-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-0">
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <User className="w-8 h-8 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Hồ sơ của tôi</h1>
                <p className="text-slate-600">Quản lý thông tin tài khoản</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 rounded-xl transition duration-300 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Trang chủ</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-500/20 border border-rose-200 text-rose-600 rounded-xl transition duration-300 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Update Full Name */}
        <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8 transition-all hover:bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Cập nhật Họ và tên</h2>

          {fullNameMessage && (
            <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 text-sm ${fullNameMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
              {fullNameMessage.type === 'success' ? (
                <Check className="w-5 h-5 shrink-0" />
              ) : (
                <X className="w-5 h-5 shrink-0" />
              )}
              {fullNameMessage.text}
            </div>
          )}

          {editingFullName ? (
            <div className="space-y-4">
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-500 shadow-inner"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateFullName}
                  disabled={updatingFullName}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition duration-300 disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                >
                  {updatingFullName ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                </button>
                <button
                  onClick={() => {
                    setEditingFullName(false);
                    setNewFullName(user?.fullName || '');
                    setFullNameMessage(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl transition duration-200"
                >
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 mb-4 shadow-inner">
                {user?.fullName}
              </div>
              <button
                onClick={() => {
                  setEditingFullName(true);
                  setNewFullName(user?.fullName || '');
                  setFullNameMessage(null);
                }}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-medium rounded-xl transition duration-300"
              >
                Chỉnh sửa
              </button>
            </div>
          )}
        </div>

        {/* Update Email */}
        <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8 transition-all hover:bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Cập nhật Email</h2>

          {emailMessage && (
            <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 text-sm ${emailMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
              {emailMessage.type === 'success' ? (
                <Check className="w-5 h-5 shrink-0" />
              ) : (
                <X className="w-5 h-5 shrink-0" />
              )}
              {emailMessage.text}
            </div>
          )}

          {editingEmail ? (
            <div className="space-y-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Nhập email mới"
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-500 shadow-inner"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateEmail}
                  disabled={updatingEmail}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition duration-300 disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                >
                  {updatingEmail ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                </button>
                <button
                  onClick={() => {
                    setEditingEmail(false);
                    setNewEmail(user?.email || '');
                    setEmailMessage(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl transition duration-200"
                >
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 mb-4 shadow-inner">
                {user?.email}
              </div>
              <button
                onClick={() => {
                  setEditingEmail(true);
                  setNewEmail(user?.email || '');
                  setEmailMessage(null);
                }}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-medium rounded-xl transition duration-300"
              >
                Chỉnh sửa
              </button>
            </div>
          )}
        </div>

        {/* Update Password */}
        <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8 transition-all hover:bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Cập nhật Mật khẩu</h2>

          {passwordMessage && (
            <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 text-sm ${passwordMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
              {passwordMessage.type === 'success' ? (
                <Check className="w-5 h-5 shrink-0" />
              ) : (
                <X className="w-5 h-5 shrink-0" />
              )}
              {passwordMessage.text}
            </div>
          )}

          {editingPassword ? (
            <div className="space-y-4">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mật khẩu hiện tại"
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-500 shadow-inner"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mật khẩu mới"
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-500 shadow-inner"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-500 shadow-inner"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition duration-300 disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                >
                  {updatingPassword ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                </button>
                <button
                  onClick={() => {
                    setEditingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordMessage(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl transition duration-200"
                >
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditingPassword(true);
                setPasswordMessage(null);
              }}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-medium rounded-xl transition duration-300"
            >
              Thay đổi mật khẩu
            </button>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8 transition-all hover:bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin bổ sung</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Trạng thái xác minh
              </label>
              <div className="px-4 py-3.5 bg-white border border-slate-200 rounded-xl">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${user?.isVerified
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                  {user?.isVerified ? (
                    <><Check className="w-4 h-4" /> Đã xác minh</>
                  ) : (
                    'Chưa xác minh'
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Ngày tạo tài khoản
              </label>
              <div className="px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm">
                {user && formatDate(user.createdAt)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                ID tài khoản
              </label>
              <div className="px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-indigo-700 font-mono text-sm">
                #{user?.id}
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white backdrop-blur-xl border border-rose-200 rounded-3xl shadow-2xl p-8 transition-all hover:bg-rose-50">
          <h2 className="text-xl font-bold text-rose-500 mb-5 flex items-center gap-3">
            <Trash2 className="w-6 h-6" />
            Vùng nguy hiểm
          </h2>

          {deleteMessage && (
            <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 text-sm ${deleteMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
              {deleteMessage.type === 'success' ? (
                <Check className="w-5 h-5 shrink-0" />
              ) : (
                <X className="w-5 h-5 shrink-0" />
              )}
              {deleteMessage.text}
            </div>
          )}

          <p className="text-slate-600 text-sm mb-6">
            Hành động này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn. Không thể hoàn tác.
          </p>

          {!deleteConfirming ? (
            <button
              onClick={() => setDeleteConfirming(true)}
              className="px-6 py-3 bg-rose-50 hover:bg-rose-500/20 text-rose-600 border border-rose-500/30 rounded-xl transition duration-300 font-medium"
            >
              Xóa tài khoản vĩnh viễn
            </button>
          ) : (
            <div className="space-y-4 p-5 bg-rose-50 border border-rose-200 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-rose-600 font-medium">
                ⚠️ Cảnh báo: Vui lòng nhập mật khẩu để xác nhận xóa tài khoản!
              </p>

              <input
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                placeholder="Nhập mật khẩu để xác nhận"
                className="w-full px-4 py-3 bg-white border border-rose-500/30 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all placeholder-rose-900/50"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || !deleteConfirmPassword}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition duration-300 disabled:opacity-50 font-bold shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                >
                  {deleteLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirming(false);
                    setDeleteConfirmPassword('');
                    setDeleteMessage(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl transition duration-200"
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}