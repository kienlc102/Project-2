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
  Eye,
  Calendar,
  HardDrive,
  Book,
  Brain,
  ClipboardList
} from 'lucide-react';

// Dùng next/dynamic để TẮT SSR cho component chứa react-pdf
const DynamicPDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 border border-gray-300 rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
  ai_flashcard_set_id?: number | null;
  ai_quiz_id?: number | null;
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

const getIcon = (type: string) => {
  switch (type) {
    case 'lecture': return <BookOpen className="w-6 h-6 text-blue-600" />;
    case 'exercise': return <FileCode className="w-6 h-6 text-green-600" />;
    case 'exam': return <FileText className="w-6 h-6 text-red-600" />;
    default: return <File className="w-6 h-6 text-gray-600" />;
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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
        if (!res.ok) throw new Error(`Không tải được thông tin (${res.status})`);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Đang tải thông tin tài liệu...</p>
        </div>
      </div>
    );
  }

  // UI Lỗi
  if (error || !doc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy tài liệu</h2>
          <p className="text-gray-600 mb-6">{error || 'Tài liệu không tồn tại hoặc đã bị xóa.'}</p>
          <Link
            href="/document"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const isPDF = doc.mime_type === 'application/pdf';

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/document"
            className="inline-flex items-center gap-2 mb-4 px-3 py-2 -ml-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {getIcon(doc.doc_type)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                  {doc.file_name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(doc.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="h-4 w-4 text-gray-400" />
                    {formatBytes(doc.file_size)}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold border border-blue-100">
                    {getTypeLabel(doc.doc_type)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm w-full md:w-auto justify-center"
              >
                <Download className="h-4 w-4" />
                Tải tài liệu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- NỘI DUNG CHÍNH --- */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI (Preview Tài Liệu) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <Eye className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">Xem trước nội dung</h2>
              </div>

              <div className="p-6">
                {isPDF ? (
                  <div className="space-y-6">
                    {/* Render file PDF */}
                    <div className="w-full">
                      <DynamicPDFViewer docId={doc.id} onDownload={handleDownload} />
                    </div>

                    {/* Preview văn bản trích xuất từ PDF (nếu có) */}
                    {doc.preview && doc.preview.trim() && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <h3 className="text-sm font-semibold text-gray-700">Văn bản trích xuất (Dạng text)</h3>
                        </div>
                        <div className="bg-white border border-gray-200 rounded p-4 max-h-64 overflow-y-auto custom-scrollbar">
                          <pre className="text-sm text-gray-600 font-sans whitespace-pre-wrap leading-relaxed">
                            {doc.preview}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Giao diện cho các file không phải PDF (txt, docx chưa hỗ trợ render...)
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Nội dung văn bản thô</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {doc.total_content_length > 0
                              ? `Đã trích xuất ${doc.total_content_length.toLocaleString()} ký tự`
                              : 'Không có nội dung văn bản'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-5 max-h-[500px] overflow-y-auto custom-scrollbar">
                      <pre className="text-sm text-gray-700 font-sans whitespace-pre-wrap leading-relaxed">
                        {doc.preview || <span className="text-gray-400 italic">Tài liệu này không có nội dung xem trước...</span>}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (Sidebar Thông Tin) */}
          <div className="space-y-6">
            
            {/* Card 1: Thông số kỹ thuật của file */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900">Chi tiết tệp</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Loại tài liệu</span>
                  <span className="text-sm font-medium text-gray-900">{getTypeLabel(doc.doc_type)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Dung lượng</span>
                  <span className="text-sm font-medium text-gray-900">{formatBytes(doc.file_size)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Ngày tải lên</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(doc.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Định dạng (MIME)</span>
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs">
                    {doc.mime_type || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Thông tin môn học liên quan (Chỉ hiện khi có doc.subject) */}
            {doc.subject && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                  <Book className="h-5 w-5 text-gray-500" />
                  <h3 className="text-base font-semibold text-gray-900">Môn học liên kết</h3>
                </div>
                <div className="p-5">
                  <div className="bg-blue-50/50 rounded-lg border border-blue-100 p-4 mb-4">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                      {doc.subject.subject_code}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {doc.subject.subject_name}
                    </p>
                  </div>
                  
                  <Link
                    href={`/search/subject/${doc.subject.id}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors font-medium shadow-sm"
                  >
                    <BookOpen className="h-4 w-4" />
                    Xem tất cả tài liệu môn này
                  </Link>
                </div>
              </div>
            )}

            {/* Card 3: AI Flashcard & Quiz */}
            {(doc.ai_flashcard_set_id || doc.ai_quiz_id) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="text-base font-semibold text-gray-900">Flashcard & Quiz AI</h3>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-xs text-gray-500 mb-2">Được tạo tự động bởi AI từ nội dung tài liệu</p>
                  {doc.ai_flashcard_set_id && (
                    <Link
                      href={`/flashcards/${doc.ai_flashcard_set_id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
                    >
                      <BookOpen className="h-4 w-4" />
                      Xem Flashcard
                    </Link>
                  )}
                  {doc.ai_quiz_id && (
                    <Link
                      href={`/quizzes/${doc.ai_quiz_id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Xem Quiz
                    </Link>
                  )}
                </div>
              </div>
            )}
            
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      }
    >
      <DocumentDetailContent />
    </Suspense>
  );
}