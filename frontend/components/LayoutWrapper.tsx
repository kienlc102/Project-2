'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Không hiển thị Navbar và Sidebar trên các trang đăng nhập, đăng ký
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Area */}
      {/* Thêm pt-16 để đẩy nội dung xuống dưới Navbar (h-16) */}
      {/* Thêm md:pl-64 để đẩy nội dung sang phải nhường chỗ cho Sidebar (w-64) trên desktop */}
      <main className="flex-1 pt-16 md:pl-64 flex flex-col relative z-0 transition-all duration-300">
        <div className="flex-1 max-w-[1600px] w-full mx-auto relative">
          {children}
        </div>
      </main>
    </div>
  );
}
