'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ClipboardList,
  BookOpen,
  ArrowRight,
  Sparkles,
  Search,
  Zap,
  Shield,
  Globe,
  User,
  GraduationCap,
  MessageSquare
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Kỷ nguyên học tập kỹ thuật số mới
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
          Học tập thông minh <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">
            hiệu quả vượt trội
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Nền tảng tối ưu giúp bạn số hóa tài liệu, tạo flashcard tự động và luyện tập trắc nghiệm thông minh chỉ với vài cú click.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-14 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex items-center w-full h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all shadow-2xl">
            <div className="pl-6 pr-4 text-slate-500">
              <Search className="h-6 w-6" />
            </div>
            <input
              className="peer h-full w-full outline-none text-lg text-slate-900 bg-transparent placeholder-slate-500"
              type="text"
              placeholder="Tìm kiếm môn học, tài liệu, bộ thẻ..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-8 h-full font-bold transition-all duration-300">
              Tìm kiếm
            </button>
          </div>
        </form>
      </section>

      {/* Main Features Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {[
            {
              href: '/flashcards',
              icon: Layers,
              title: 'Flashcards',
              desc: 'Ghi nhớ siêu tốc với bộ thẻ thông minh, lặp lại ngắt quãng.',
              color: 'from-indigo-500 to-blue-500',
              glow: 'group-hover:shadow-indigo-500/20'
            },
            {
              href: '/quizzes',
              icon: ClipboardList,
              title: 'Quizzes',
              desc: 'Kiểm tra kiến thức với ngân hàng câu hỏi phong phú, chấm điểm tức thì.',
              color: 'from-purple-500 to-fuchsia-500',
              glow: 'group-hover:shadow-purple-500/20'
            },
            {
              href: '/document',
              icon: BookOpen,
              title: 'Tài liệu & OCR',
              desc: 'Số hóa tài liệu giấy, trích xuất văn bản từ hình ảnh tự động.',
              color: 'from-emerald-500 to-teal-500',
              glow: 'group-hover:shadow-emerald-500/20'
            },
            {
              href: '/subject',
              icon: Globe,
              title: 'Khám phá',
              desc: 'Tham gia không gian tri thức đa dạng với hàng ngàn môn học.',
              color: 'from-rose-500 to-orange-500',
              glow: 'group-hover:shadow-rose-500/20'
            },
            {
              href: '/forum',
              icon: MessageSquare,
              title: 'Diễn đàn',
              desc: 'Đặt câu hỏi, thảo luận, chia sẻ kiến thức cùng cộng đồng.',
              color: 'from-cyan-500 to-teal-500',
              glow: 'group-hover:shadow-cyan-500/20'
            }
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className={`group relative bg-white backdrop-blur-sm rounded-3xl border border-slate-200 p-8 transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.08] shadow-lg ${item.glow}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <item.icon className="w-7 h-7 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 mb-6 line-clamp-3 text-sm leading-relaxed">
                {item.desc}
              </p>
              <div className="flex items-center gap-2 text-slate-900 font-medium text-sm opacity-70 group-hover:opacity-100 group-hover:gap-3 transition-all">
                Khám phá ngay
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="border-t border-slate-200 bg-slate-50 relative z-10 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Hệ sinh thái học tập <span className="text-indigo-600">toàn diện</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Tích hợp các công cụ tiên tiến nhất để tối ưu hóa quá trình tiếp thu kiến thức của bạn.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6 border border-blue-200">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Tốc độ & Hiệu quả</h4>
              <p className="text-slate-600 leading-relaxed">
                Giao diện mượt mà, phản hồi tức thì giúp bạn duy trì sự tập trung cao độ trong suốt phiên học.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-6 border border-purple-200">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Lưu trữ An toàn</h4>
              <p className="text-slate-600 leading-relaxed">
                Mọi dữ liệu học tập, tài liệu của bạn đều được mã hóa và bảo mật an toàn trên nền tảng đám mây.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-200">
                <User className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Học nhóm dễ dàng</h4>
              <p className="text-slate-600 leading-relaxed">
                Chia sẻ không giới hạn bộ tài liệu, quiz cho bạn bè để cùng nhau thảo luận và thăng tiến.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition">
            <GraduationCap className="w-6 h-6 text-indigo-500" />
            <span className="text-xl font-bold text-slate-900">EduLearn</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} EduLearn. Kiến tạo tương lai tri thức.
          </p>
        </div>
      </footer>
    </div>
  );
}
