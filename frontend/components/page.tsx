'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search as SearchIcon, 
  FileText, 
  BookOpen, 
  FileCode, 
  File, 
  Loader2,
  HardDrive
} from 'lucide-react';
import { getToken } from '@/lib/auth';

// --- TYPES 
interface SearchResult {
  id: number;
  file_name: string;
  doc_type: string;
  subject_id: number;
  file_size: number;
}

// --- HELPER FUNCTIONS ---
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'lecture': return <BookOpen className="w-8 h-8 text-blue-500" />;
    case 'exercise': return <FileCode className="w-8 h-8 text-green-500" />;
    case 'exam': return <FileText className="w-8 h-8 text-red-500" />;
    default: return <File className="w-8 h-8 text-gray-500" />;
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'lecture': return 'Bài giảng';
    case 'exercise': return 'Bài tập';
    case 'exam': return 'Đề thi';
    default: return 'Khác';
  }
};

// --- MAIN CONTENT COMPONENT ---
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [keyword, setKeyword] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Gọi API tìm kiếm mỗi khi URL query thay đổi
  useEffect(() => {
    if (initialQuery) {
      setKeyword(initialQuery);
      performSearch(initialQuery);
    } else {
      setLoading(false);
    }
  }, [initialQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const token = getToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Gọi API GET /documents/search (giả sử router documents được mount tại /documents hoặc /api/documents)
      const res = await fetch(`${API_BASE}/api/documents/search?keyword=${encodeURIComponent(query)}&limit=20`, {
        headers
      });

      if (!res.ok) {
        throw new Error('Lỗi khi truy xuất dữ liệu từ máy chủ');
      }
      
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Không thể kết nối đến máy chủ.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Bar: Back button & Search Input */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <Link href="/" className="flex items-center text-gray-500 hover:text-blue-600 transition font-medium self-start md:self-auto">
          <ArrowLeft className="w-5 h-5 mr-1" />
          Trang chủ
        </Link>
        
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <div className="relative flex items-center w-full h-12 rounded-xl focus-within:shadow-md bg-white border border-gray-200 transition-all overflow-hidden">
            <div className="grid place-items-center h-full w-12 text-gray-400">
              <SearchIcon className="h-5 w-5" />
            </div>
            <input
              className="peer h-full w-full outline-none text-base text-gray-700 pr-4 bg-transparent"
              type="text"
              placeholder="Tìm kiếm tài liệu, giáo trình, đề thi..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-full font-medium transition-colors">
              Tìm
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kết quả tìm kiếm</h1>
        <p className="text-gray-500 mt-1">
          {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${results.length} tài liệu cho "${initialQuery}"`}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      ) : results.length === 0 && !error ? (
        /* Empty State */
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy tài liệu nào</h3>
          <p className="text-gray-500">Hãy thử sử dụng các từ khóa khác hoặc kiểm tra lại lỗi chính tả.</p>
        </div>
      ) : (
        /* Results Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((doc) => (
            <div key={doc.id} className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all group flex flex-col cursor-pointer">
              <div className="flex items-start gap-4 mb-3">
                <div className="p-2 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                  {getFileIcon(doc.doc_type)}
                </div>
                <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight flex-1 group-hover:text-blue-600 transition-colors">
                  {doc.file_name}
                </h3>
              </div>
              <div className="mt-auto flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-600">{getTypeName(doc.doc_type)}</span>
                <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5"/> {formatBytes(doc.file_size)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- PAGE WRAPPER ---
// Bọc SearchContent trong Suspense là bắt buộc trong Next.js App Router khi dùng useSearchParams
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Suspense fallback={
        <div className="min-h-screen flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}