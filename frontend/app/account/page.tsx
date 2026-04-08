'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout, getToken, removeToken } from '@/lib/auth';
import { LogOut, User } from 'lucide-react';

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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
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

          {/* User Information */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800">
                {user.fullName}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái xác minh
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  user.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.isVerified ? '✓ Đã xác minh' : 'Chưa xác minh'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày tạo tài khoản
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800">
                {formatDate(user.createdAt)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID tài khoản
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-mono">
                #{user.id}
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="my-8" />

          {/* Danger Zone */}
          <div className="border-t-2 border-red-200 pt-8">
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
    </div>
  );
}
