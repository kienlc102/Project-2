'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getToken, removeToken } from '@/lib/auth';
import { LogIn, LogOut, UserPlus, User, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search navigation/logic
      console.log('Search:', searchQuery);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-blue-600 flex-shrink-0">MyApp</h1>

          {/* Search Bar */}
          {isAuthenticated && (
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </form>
          )}

          <div className="flex items-center gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <User className="w-5 h-5" />
                  <span>Hồ sơ</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Đăng ký</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Column */}
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Chào mừng bạn đến với MyApp
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Một nền tảng hiện đại để quản lý và chia sẻ tài liệu với bạn bè, đồng nghiệp.
            </p>

            {isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-lg text-green-600 font-semibold">
                  ✓ Bạn đã đăng nhập thành công!
                </p>
              </div>
            ) : (
              <div className="flex gap-4">
                <Link
                  href="/signup"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  Tạo tài khoản
                </Link>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Tính năng chính</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Xác thực an toàn</h4>
                  <p className="text-gray-600 text-sm">
                    Đăng ký & đăng nhập với mật khẩu mã hóa an toàn
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📄</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Quản lý tài liệu</h4>
                  <p className="text-gray-600 text-sm">
                    Tải lên, lưu trữ và chia sẻ tài liệu dễ dàng
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Cộng tác nhóm</h4>
                  <p className="text-gray-600 text-sm">
                    Làm việc cùng nhau trong các nhóm và dự án
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Trò chuyện tức thời</h4>
                  <p className="text-gray-600 text-sm">
                    Giao tiếp với đội nhóm của bạn trong thời gian thực
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2026 MyApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
