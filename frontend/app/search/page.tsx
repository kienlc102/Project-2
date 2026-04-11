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
  id: string;
  file_name: string;
  doc_type: string;
  subject_id: number;
  file_size: number;
}

interface SubjectResult {
  id: number;
  subject_code: string;
  subject_name: string;
  university_id: number;
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
  const [subjects, setSubjects] = useState<SubjectResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  // Gọi API tìm kiếm mỗi khi URL query thay đổi
  useEffect(() => {
    if (initialQuery) {
      setKeyword(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setHasSearched(true);
    
    try {
      const API_BASE = 'http://localhost:8000';
      const token = getToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Gọi API GET /api/v1/document/search
      const res = await fetch(`${API_BASE}/api/v1/document/search?keyword=${encodeURIComponent(query)}&limit=20`, {
        headers
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Response Error:', res.status, errorData);
        throw new Error(errorData.detail || `Lỗi server: ${res.status}`);
      }
      
      const data = await res.json();
      setResults(data.documents || []);
      setSubjects(data.subjects || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Không thể kết nối đến máy chủ.');
      setResults([]);
      setSubjects([]);
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
              autoFocus
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-full font-medium transition-colors">
              Tìm
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Kết quả tìm kiếm</h1>
          <p className="text-gray-500 mt-1">
            {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${results.length + subjects.length} kết quả cho "${initialQuery}"`}
          </p>
        </div>
      )}

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
      ) : hasSearched && results.length === 0 && subjects.length === 0 && !error ? (
        /* Empty State */
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy kết quả nào</h3>
          <p className="text-gray-500">Hãy thử sử dụng các từ khóa khác hoặc kiểm tra lại lỗi chính tả.</p>
        </div>
      ) : hasSearched && (results.length > 0 || subjects.length > 0) ? (
        /* Results - Split into two sections */
        <div className="space-y-8">
          {/* Documents Section */}
          {results.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Tài liệu ({results.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/search/${doc.id}`)}
                    className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all group flex flex-col cursor-pointer"
                  >
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
            </div>
          )}

          {/* Subjects Section */}
          {subjects.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-green-600" />
                Môn học ({subjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => router.push(`/search/subject/${subject.id}`)}
                    className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-50 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 mb-1">{subject.subject_code}</p>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors">
                          {subject.subject_name}
                        </h3>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">ID: {subject.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
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
