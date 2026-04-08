import { BookOpen, Users, MessageSquare, Video, BrainCircuit, Search } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: "Kho tài liệu mở",
      desc: "Đăng tải và tải xuống hàng ngàn tài liệu, giáo trình từ cộng đồng.",
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
    },
    {
      title: "Diễn đàn thảo luận",
      desc: "Đặt câu hỏi, giải đáp thắc mắc và tranh luận các chủ đề học thuật.",
      icon: <Users className="w-8 h-8 text-purple-500" />,
    },
    {
      title: "Nhóm chat & Video Call",
      desc: "Học nhóm trực tuyến với chất lượng HD và độ trễ thấp.",
      icon: <Video className="w-8 h-8 text-red-500" />,
    },
    {
      title: "Hệ thống Quiz AI",
      desc: "Tự tạo bộ câu hỏi ôn tập hoặc thử thách bản thân với kho Quiz có sẵn.",
      icon: <BrainCircuit className="w-8 h-8 text-yellow-500" />,
    },
    {
      title: "Tìm kiếm thông minh",
      desc: "Lọc tài liệu và nhóm học tập theo môn học, chuyên ngành chính xác.",
      icon: <Search className="w-8 h-8 text-green-500" />,
    },
    {
      title: "Kết nối bạn học",
      desc: "Nhắn tin trực tiếp và xây dựng mạng lưới học tập cá nhân.",
      icon: <MessageSquare className="w-8 h-8 text-pink-500" />,
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* 1. Header/Navbar */}
      <nav className="flex justify-between items-center p-6 bg-white shadow-sm sticky top-0 z-50">
        <div className="text-2xl font-bold text-blue-600">EduSocial</div>
        <div className="space-x-6 hidden md:block">
          <a href="#" className="hover:text-blue-600 transition">Tài liệu</a>
          <a href="#" className="hover:text-blue-600 transition">Diễn đàn</a>
          <a href="#" className="hover:text-blue-600 transition">Về chúng tôi</a>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium">Bắt đầu miễn phí</button>
      </nav>

      {/* 2. Hero Section */}
      <header className="py-20 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
          Học tập <span className="text-blue-600 underline">hiệu quả hơn</span> cùng đồng đội
        </h1>
        <p className="text-lg text-slate-600 mb-10">
          Nền tảng mạng xã hội chuyên biệt cho học tập: Chia sẻ tài liệu, thảo luận forum, 
          gọi video học nhóm và ôn thi bằng Quiz thông minh.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-blue-600 text-white px-10 py-4 rounded-xl text-lg font-bold shadow-lg hover:bg-blue-700 transition">
            Tạo tài khoản ngay
          </button>
          <button className="bg-white border-2 border-slate-200 px-10 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 transition">
            Xem demo Video Call
          </button>
        </div>
      </header>

      {/* 3. Features Grid */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Mọi công cụ bạn cần để dẫn đầu</h2>
          <p className="text-slate-500">Tích hợp đầy đủ các tính năng hỗ trợ tối đa cho việc tự học và học nhóm.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <div key={i} className="p-8 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-xl transition-all group">
              <div className="mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>© 2026 EduSocial Project. Made with passion for students.</p>
      </footer>
    </div>
  );
}