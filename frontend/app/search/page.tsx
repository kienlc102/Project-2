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
  HardDrive,
  XCircle
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
    case 'lecture': return <BookOpen className="w-7 h-7 text-indigo-400" />;
    case 'exercise': return <FileCode className="w-7 h-7 text-emerald-400" />;
    case 'exam': return <FileText className="w-7 h-7 text-rose-400" />;
    default: return <File className="w-7 h-7 text-slate-400" />;
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
    <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
      {/* Top Bar: Back button & Search Input */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
        <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 shadow-sm transition hover:bg-white/10 hover:text-white backdrop-blur-md self-start md:self-auto shrink-0">
          <ArrowLeft className="w-4 h-4" />
          Trang chủ
        </Link>
        
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <div className="relative flex items-center w-full h-14 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 bg-[#131A2B] border border-white/10 transition-all overflow-hidden shadow-inner">
            <div className="grid place-items-center h-full w-14 text-slate-500">
              <SearchIcon className="h-6 w-6" />
            </div>
            <input
              className="peer h-full w-full outline-none text-base text-white pr-4 bg-transparent placeholder-slate-600"
              type="text"
              placeholder="Tìm kiếm tài liệu, giáo trình, đề thi..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 h-full font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]">
              Tìm
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Kết quả tìm kiếm</h1>
          <p className="text-slate-400 mt-2 text-lg">
            {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${results.length + subjects.length} kết quả cho "${initialQuery}"`}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-500/10 text-rose-400 p-5 rounded-2xl border border-rose-500/20 mb-8 flex items-center gap-3 font-medium">
          <XCircle className="w-6 h-6 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : hasSearched && results.length === 0 && subjects.length === 0 && !error ? (
        /* Empty State */
        <div className="text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <SearchIcon className="w-20 h-20 text-slate-600 mx-auto mb-6 relative z-10" />
          <h3 className="text-2xl font-bold text-white mb-3 relative z-10">Không tìm thấy kết quả nào</h3>
          <p className="text-slate-400 relative z-10">Hãy thử sử dụng các từ khóa khác hoặc kiểm tra lại lỗi chính tả.</p>
        </div>
      ) : hasSearched && (results.length > 0 || subjects.length > 0) ? (
        /* Results - Split into two sections */
        <div className="space-y-12">
          {/* Documents Section */}
          {results.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                Tài liệu ({results.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/search/${doc.id}`)}
                    className="bg-[#131A2B] p-6 rounded-3xl border border-white/10 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)] hover:border-indigo-500/30 transition-all duration-300 group flex flex-col cursor-pointer relative overflow-hidden shadow-inner"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all duration-300 group-hover:bg-indigo-500/20"></div>

                    <div className="flex items-start gap-4 mb-5 relative z-10">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {getFileIcon(doc.doc_type)}
                      </div>
                      <h3 className="font-bold text-white line-clamp-2 leading-tight flex-1 group-hover:text-indigo-300 transition-colors mt-1">
                        {doc.file_name}
                      </h3>
                    </div>
                    <div className="mt-auto flex items-center justify-between text-sm text-slate-400 pt-5 border-t border-white/10 relative z-10">
                      <span className="bg-white/5 px-3 py-1.5 rounded-lg font-medium text-slate-300 border border-white/5">{getTypeName(doc.doc_type)}</span>
                      <span className="flex items-center gap-1.5 font-medium"><HardDrive className="w-4 h-4 text-indigo-400"/> {formatBytes(doc.file_size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects Section */}
          {subjects.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                </div>
                Môn học ({subjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => router.push(`/search/subject/${subject.id}`)}
                    className="bg-[#131A2B] p-6 rounded-3xl border border-white/10 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/30 transition-all group cursor-pointer relative overflow-hidden shadow-inner"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all duration-300 group-hover:bg-emerald-500/20"></div>

                    <div className="flex items-start gap-4 relative z-10">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0 shadow-sm">
                        <BookOpen className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1.5">{subject.subject_code}</p>
                        <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-emerald-300 transition-colors">
                          {subject.subject_name}
                        </h3>
                      </div>
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
    <div className="min-h-screen bg-[#0B0F19] font-sans relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none" />

      <Suspense fallback={
        <div className="min-h-screen flex justify-center items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}
