'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, User, LogOut, Upload, GraduationCap } from 'lucide-react';
import { getToken, removeToken } from '@/lib/auth';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAuthenticated(!!getToken());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
      setKeyword('');
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    router.push('/login');
  };

  if (!mounted) return <div className="h-16 border-b border-slate-100 bg-slate-50/80" />;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-40 bg-slate-50/80 backdrop-blur-xl border-b border-slate-100 transition-all">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        
        {/* Left: Mobile Menu & Logo (Mobile Only) */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/" className="md:hidden flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-lg">
              <GraduationCap className="w-5 h-5 text-slate-900" />
            </div>
          </Link>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-2xl mx-4">
          <form onSubmit={handleSearch} className="relative group hidden sm:block">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
            <div className="relative flex items-center w-full h-10 rounded-xl bg-white border border-slate-200 overflow-hidden transition-all shadow-inner focus-within:ring-2 focus-within:ring-indigo-500">
              <div className="pl-4 pr-3 text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                className="peer h-full w-full outline-none text-sm text-slate-900 bg-transparent placeholder-slate-500"
                type="text"
                placeholder="Tìm kiếm môn học, tài liệu, đề thi..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Link href="/document/upload" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl transition text-sm font-bold shadow-md">
            <Upload className="w-4 h-4" />
            <span className="hidden lg:block">Tải tài liệu</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition"
                title="Hồ sơ cá nhân"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-rose-600 hover:text-rose-300 hover:bg-rose-50 rounded-xl transition"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-slate-700 hover:text-slate-900 text-sm font-bold hidden sm:block transition"
              >
                Đăng nhập
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-200 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
