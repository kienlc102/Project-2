'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout, getToken, removeToken, updateProfile, updatePassword } from '@/lib/auth';
import { LogOut, User, Check, X } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600 text-lg">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-600 text-lg">Không tìm thấy thông tin user</div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-0">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Hồ sơ của tôi</h1>
                <p className="text-gray-600">Quản lý thông tin tài khoản</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Update Full Name */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Cập nhật Họ và tên</h2>
          
          {fullNameMessage && (
            <div className={`mb-4 p-3 rounded flex items-center gap-2 ${
              fullNameMessage.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-400'
                : 'bg-red-100 text-red-800 border border-red-400'
            }`}>
              {fullNameMessage.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              {fullNameMessage.text}
            </div>
          )}

          {editingFullName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateFullName}
                  disabled={updatingFullName}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-200 disabled:opacity-50"
                >
                  {updatingFullName ? 'Đang cập nhật...' : 'Lưu'}
                </button>
                <button
                  onClick={() => {
                    setEditingFullName(false);
                    setNewFullName(user?.fullName || '');
                    setFullNameMessage(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition duration-200"
                >
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 mb-3">
                {user?.fullName}
              </div>
              <button
                onClick={() => {
                  setEditingFullName(true);
                  setNewFullName(user?.fullName || '');
                  setFullNameMessage(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
              >
                Chỉnh sửa
              </button>
            </div>
          )}
        </div>

        {/* Update Email */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Cập nhật Email</h2>
          
          {emailMessage && (
            <div className={`mb-4 p-3 rounded flex items-center gap-2 ${
              emailMessage.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-400'
                : 'bg-red-100 text-red-800 border border-red-400'
            }`}>
              {emailMessage.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              {emailMessage.text}
            </div>
          )}

          {editingEmail ? (
            <div className="space-y-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Nhập email mới"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateEmail}
                  disabled={updatingEmail}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-200 disabled:opacity-50"
                >
                  {updatingEmail ? 'Đang cập nhật...' : 'Lưu'}
                </button>
                <button
                  onClick={() => {
                    setEditingEmail(false);
                    setNewEmail(user?.email || '');
                    setEmailMessage(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition duration-200"
                >
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 mb-3">
                {user?.email}
              </div>
              <button
                onClick={() => {
                  setEditingEmail(true);
                  setNewEmail(user?.email || '');
                  setEmailMessage(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
              >
                Chỉnh sửa
              </button>
            </div>
          )}
        </div>

        {/* Update Password */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Cập nhật Mật khẩu</h2>
          
          {passwordMessage && (
            <div className={`mb-4 p-3 rounded flex items-center gap-2 ${
              passwordMessage.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-400'
                : 'bg-red-100 text-red-800 border border-red-400'
            }`}>
              {passwordMessage.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              {passwordMessage.text}
            </div>
          )}

          {editingPassword ? (
            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mật khẩu hiện tại"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mật khẩu mới"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition duration-200 disabled:opacity-50"
                >
                  {updatingPassword ? 'Đang cập nhật...' : 'Lưu'}
                </button>
                <button
                  onClick={() => {
                    setEditingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordMessage(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition duration-200"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
            >
              Thay đổi mật khẩu
            </button>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Thông tin tài khoản</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái xác minh
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  user?.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user?.isVerified ? '✓ Đã xác minh' : 'Chưa xác minh'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày tạo tài khoản
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-sm">
                {user && formatDate(user.createdAt)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID tài khoản
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-mono text-sm">
                #{user?.id}
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-red-600">
          <h2 className="text-lg font-bold text-red-600 mb-4">Vùng nguy hiểm</h2>
          <p className="text-gray-600 text-sm mb-4">
            Các hành động sau không thể được hoàn tác. Vui lòng thực hiện cẩn thận.
          </p>
          <button
            className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 border border-red-300 rounded-lg transition duration-200 font-medium"
            disabled
          >
            Xóa tài khoản (Sắp có)
          </button>
        </div>
      </div>
    </div>
  );
}
