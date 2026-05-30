'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  BookOpen,
  ClipboardList,
  Layers,
  GraduationCap,
  X,
  Upload,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Tài liệu', href: '/document', icon: FileText },
    { name: 'Môn học', href: '/subject', icon: BookOpen },
    { name: 'Flashcards', href: '/flashcards', icon: Layers },
    { name: 'Trắc nghiệm', href: '/quizzes', icon: ClipboardList },
    { name: 'Diễn đàn', href: '/forum', icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-50 border-r border-slate-100 
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600">EduLearn</span>
          </Link>

          <button 
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Danh mục chính</div>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-600 shadow-inner' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Footer actions inside sidebar (Mobile mainly) */}
        <div className="p-4 border-t border-slate-100 md:hidden">
          <Link 
            href="/document/upload" 
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            <Upload className="w-5 h-5" />
            Tải tài liệu lên
          </Link>
        </div>

      </aside>
    </>
  );
}
