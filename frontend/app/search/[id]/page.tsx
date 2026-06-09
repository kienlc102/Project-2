'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Download,
  FileText,
  BookOpen,
  FileCode,
  File,
  Loader2,
  Calendar,
  HardDrive,
  Book,
  AlertCircle,
  ThumbsUp,
  Share2,
  Bookmark,
  ChevronRight
} from 'lucide-react';

// Dùng next/dynamic để TẮT SSR cho component chứa react-pdf
const DynamicPDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-white w-full">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
    </div>
  ),
});

interface DocumentDetail {
  id: string;
  file_name: string;
  file_size: number;
  doc_type: string;
  mime_type: string;
  created_at: string;
  subject?: {
    id: number;
    subject_code: string;
    subject_name: string;
    university_id: number;
  };
  preview: string;
  total_content_length: number;
  file_path: string;
}

// --- CÁC HÀM HELPER ---
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'lecture': return 'Bài giảng';
    case 'exercise': return 'Bài tập';
    case 'exam': return 'Đề thi';
    default: return 'Khác';
  }
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// --- COMPONENT CHÍNH ---
function DocumentDetailContent() {
  const params = useParams();
  const docId = params.id as string;

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!docId) return;

    const fetchDocumentDetail = async (id: string) => {
      setLoading(true);
      setError('');
      try {
        const API_BASE = 'http://localhost:8000/api/v1';
        const res = await fetch(`${API_BASE}/document/${id}`);
        if (!res.ok) throw new Error(`Không tải được thông tin tài liệu (${res.status})`);
        const data = await res.json();
        setDoc(data);
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin tài liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentDetail(docId);
  }, [docId]);

  const handleDownload = async () => {
    if (!doc) return;
    try {
      const API_BASE = 'http://localhost:8000/api/v1';
      const downloadUrl = `${API_BASE}/document/download/${doc.id}`;
      window.open(downloadUrl, '_blank');
    } catch (error) {
      alert('Không thể tải xuống tài liệu. Vui lòng thử lại.');
    }
  };

  // UI Đang tải
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 font-medium">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  // UI Lỗi
  if (error || !doc) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
        <div className="text-center max-w-md p-8 bg-white backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 relative z-10">
          <AlertCircle className="h-16 w-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Không tìm thấy tài liệu</h2>
          <p className="text-slate-600 mb-8">{error || 'Tài liệu không tồn tại hoặc đã bị xóa.'}</p>
          <Link
            href="/document"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 rounded-xl transition duration-300 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isPDF = doc.mime_type === 'application/pdf';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header / Breadcrumb (StuDocu Style) */}
        <div className="mb-8">
          <nav className="flex flex-wrap items-center text-sm text-slate-600 gap-2 mb-4 font-medium">
            <Link href="/" className="hover:text-indigo-600 transition-colors">EduLearn</Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <Link href="/document" className="hover:text-indigo-600 transition-colors">Tài liệu</Link>
            {doc.subject && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <Link href={`/subject/${doc.subject.id}`} className="hover:text-indigo-600 transition-colors">
                  {doc.subject.subject_name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-700 truncate max-w-[200px] sm:max-w-xs md:max-w-md">{doc.file_name}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
            {doc.file_name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            {doc.subject && (
              <Link href={`/subject/${doc.subject.id}`} className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                <Book className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-slate-700">{doc.subject.subject_name}</span>
              </Link>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Đăng ngày {formatDate(doc.created_at)}
            </span>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column (Main PDF Viewer) - 8 columns */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl relative group">
              {/* PDF Toolbar Fake / Top bar for viewer */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#0B0F19]/80 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {isPDF ? (
                <div className="w-full bg-white min-h-[600px] flex flex-col">
                  <DynamicPDFViewer docId={doc.id} onDownload={handleDownload} />
                </div>
              ) : (
                <div className="p-8 min-h-[500px] flex flex-col items-center justify-center text-center bg-white backdrop-blur-sm">
                  <FileText className="w-20 h-20 text-slate-500 mb-6" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Tài liệu không hỗ trợ xem trước</h3>
                  <p className="text-slate-600 max-w-md mx-auto mb-8">
                    Định dạng {doc.mime_type} hiện tại chưa được hỗ trợ xem trực tiếp trên nền tảng.
                    Bạn vui lòng tải xuống để xem nội dung chi tiết.
                  </p>
                  <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all">
                    <Download className="w-5 h-5" />
                    Tải tệp tin gốc
                  </button>
                </div>
              )}
            </div>

            {/* Trích xuất văn bản OCR */}
            {doc.preview && doc.preview.trim() && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Nội dung trích xuất tự động (OCR)
                </h3>
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
                  <pre className="text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                    {doc.preview}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Sidebar Actions) - 4 columns */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">

              {/* Main Action Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>

                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 relative z-10"
                >
                  <Download className="w-5 h-5" />
                  Tải xuống ({formatBytes(doc.file_size)})
                </button>

                <div className="mt-6 flex justify-around border-t border-slate-200 pt-6 relative z-10">
                  <button className="flex flex-col items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group">
                    <div className="p-3 bg-white rounded-full group-hover:bg-indigo-100 transition-colors">
                      <ThumbsUp className="w-5 h-5 group-hover:text-indigo-600" />
                    </div>
                    <span className="text-xs font-medium">Hữu ích</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group">
                    <div className="p-3 bg-white rounded-full group-hover:bg-emerald-500/20 transition-colors">
                      <Share2 className="w-5 h-5 group-hover:text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium">Chia sẻ</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group">
                    <div className="p-3 bg-white rounded-full group-hover:bg-amber-500/20 transition-colors">
                      <Bookmark className="w-5 h-5 group-hover:text-amber-400" />
                    </div>
                    <span className="text-xs font-medium">Lưu lại</span>
                  </button>
                </div>
              </div>

              {/* Document Information Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-5">Chi tiết tài liệu</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Định dạng file</span>
                    <span className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg uppercase">
                      {doc.mime_type.split('/').pop() || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Phân loại</span>
                    <span className="text-sm font-semibold text-slate-700">{getTypeLabel(doc.doc_type)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Độ dài văn bản</span>
                    <span className="text-sm font-semibold text-slate-700">{doc.total_content_length.toLocaleString()} ký tự</span>
                  </div>
                </div>
              </div>

              {/* Subject Info Card */}
              {doc.subject && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[30px] -mr-8 -mt-8 pointer-events-none group-hover:bg-emerald-50 transition-colors"></div>

                  <div className="flex items-start gap-4 mb-4 relative z-10">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <Book className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{doc.subject.subject_code}</p>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-tight">
                        {doc.subject.subject_name}
                      </h3>
                    </div>
                  </div>

                  <Link
                    href={`/subject/${doc.subject.id}`}
                    className="flex items-center justify-center w-full px-4 py-2.5 bg-white border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all relative z-10"
                  >
                    Xem tất cả tài liệu môn này
                  </Link>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DocumentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <DocumentDetailContent />
    </Suspense>
  );
}