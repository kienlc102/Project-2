'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getToken, removeToken } from '@/lib/auth';
import {
  LogIn,
  LogOut,
  UserPlus,
  User,
  Layers,
  ClipboardList,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Search,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

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
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">EduLearn</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-900 transition text-sm"
                >
                  <User className="w-4 h-4" />
                  Hồ sơ
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:text-red-700 transition text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition text-sm font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Nền tảng học tập thông minh
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Học hiệu quả hơn với
          <br />
          <span className="text-blue-600">EduLearn</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Tạo flashcard, làm quiz và theo dõi tiến trình học tập của bạn. Chia sẻ tài liệu với bạn bè và cùng nhau tiến bộ.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10 relative">
          <div className="relative flex items-center w-full h-14 rounded-2xl focus-within:shadow-xl bg-white overflow-hidden border border-gray-200 transition-all">
            <div className="grid place-items-center h-full w-14 text-gray-400">
              <Search className="h-6 w-6" />
            </div>
            <input
              className="peer h-full w-full outline-none text-base text-gray-700 pr-2 bg-transparent"
              type="text"
              placeholder="Tìm kiếm tài liệu, flashcard, bài quiz..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-full font-semibold transition-colors">
              Tìm kiếm
            </button>
          </div>
        </form>

        {!isAuthenticated && (
          <div className="flex gap-3 justify-center mb-12">
            <Link
              href="/signup"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center gap-2"
            >
              Bắt đầu miễn phí
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-white transition"
            >
              Đã có tài khoản?
            </Link>
          </div>
        )}
      </section>

      {/* Main Learning Tools - Centered Cards */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Flashcards Card */}
          <Link
            href="/flashcards"
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-8 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-200 transition">
              <Layers className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Flashcards</h3>
            <p className="text-gray-600 mb-4">
              Tạo bộ thẻ ghi nhớ với hình ảnh, học và ôn tập hiệu quả. Chia sẻ với bạn bè để cùng học.
            </p>
            <div className="flex items-center gap-1 text-indigo-600 font-medium text-sm group-hover:gap-2 transition-all">
              Khám phá Flashcards
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Quiz Card */}
          <Link
            href="/quizzes"
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-8 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-purple-200 transition">
              <ClipboardList className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quiz</h3>
            <p className="text-gray-600 mb-4">
              Tạo bài kiểm tra với nhiều loại câu hỏi, chấm điểm tự động và xem analytics chi tiết.
            </p>
            <div className="flex items-center gap-1 text-purple-600 font-medium text-sm group-hover:gap-2 transition-all">
              Khám phá Quiz
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Document Upload Card */}
          <Link
            href="/document"
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-8 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-sky-200 transition">
              <BookOpen className="w-7 h-7 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tài liệu</h3>
            <p className="text-gray-600 mb-4">
              Tải tài liệu học tập lên, xử lý OCR và lưu trữ để tra cứu nhanh sau này.
            </p>
            <div className="flex items-center gap-1 text-sky-600 font-medium text-sm group-hover:gap-2 transition-all">
              Tải tài liệu lên
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Subject Card */}
          <Link
            href="/subject"
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-8 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-green-200 transition">
              <GraduationCap className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Môn học</h3>
            <p className="text-gray-600 mb-4">
              Khám phá các môn học được quan tâm nhiều nhất.
            </p>
            <div className="flex items-center gap-1 text-green-600 font-medium text-sm group-hover:gap-2 transition-all">
              Khám phá Môn học
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Tại sao chọn EduLearn?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Học mọi lúc, mọi nơi</h4>
              <p className="text-sm text-gray-600">
                Truy cập tài liệu học tập từ bất kỳ thiết bị nào, mọi lúc mọi nơi.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Chấm điểm tự động</h4>
              <p className="text-sm text-gray-600">
                Quiz được chấm điểm ngay lập tức với analytics chi tiết cho từng câu hỏi.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Chia sẻ & cộng tác</h4>
              <p className="text-sm text-gray-600">
                Chia sẻ flashcard và quiz với bạn bè, học nhóm hiệu quả hơn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 EduLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
