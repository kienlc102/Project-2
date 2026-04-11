'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { getQuizzes, deleteQuiz, Quiz } from '@/lib/quizzes';
import {
  Search, Plus, ArrowLeft, ClipboardList, Lock, Globe,
  ChevronLeft, ChevronRight, Trash2, Edit, User, Loader2,
} from 'lucide-react';

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await getQuizzes(
        { search, page, limit: 12, filter: filter === 'my' ? 'my' : undefined },
        token
      );
      if (res.success && res.data) {
        setQuizzes(res.data.quizzes);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
    setLoading(false);
  }, [search, page, filter]);

  useEffect(() => {
    setIsAuthenticated(!!getToken());
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuizzes();
  };

  const handleDelete = async (quizId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa quiz này?')) return;
    const token = getToken();
    if (!token) return;
    setDeletingId(quizId);
    try {
      const res = await deleteQuiz(token, quizId);
      if (res.success) {
        fetchQuizzes();
      }
    } catch (error) {
      console.error('Delete quiz error:', error);
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Quiz
            </h1>
          </div>
          {isAuthenticated && (
            <Link
              href="/quizzes/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Tạo mới
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm quiz..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
          {isAuthenticated && (
            <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => { setFilter('all'); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => { setFilter('my'); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition ${
                  filter === 'my' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Của tôi
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            {total > 0 ? `${total} quiz được tìm thấy` : 'Chưa có quiz nào'}
          </p>
        )}

        {/* Quiz Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Chưa có quiz nào</p>
            {isAuthenticated && (
              <Link
                href="/quizzes/create"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
              >
                <Plus className="w-5 h-5" /> Tạo Quiz đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition overflow-hidden group"
              >
                <Link href={`/quizzes/${quiz.id}`} className="block p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-2 flex-1">{quiz.title}</h3>
                    {quiz.visibility === 'private' ? (
                      <Lock className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                    ) : (
                      <Globe className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{quiz.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {quiz.author_name}
                    </span>
                    <span>{quiz.question_count} câu hỏi</span>
                    <span>{new Date(quiz.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
