'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { getFlashcardSets, FlashcardSet } from '@/lib/flashcards';
import {
  Search, Plus, BookOpen, Lock, Globe, ChevronLeft, ChevronRight,
  ArrowLeft, Layers, User
} from 'lucide-react';

export default function FlashcardsPage() {
  const router = useRouter();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchSets = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await getFlashcardSets(
        { search, page, limit: 12, filter: filter === 'my' ? 'my' : undefined },
        token
      );
      if (res.success && res.data) {
        setSets(res.data.sets);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching flashcard sets:', error);
    }
    setLoading(false);
  }, [search, page, filter]);

  useEffect(() => {
    setIsAuthenticated(!!getToken());
    fetchSets();
  }, [fetchSets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSets();
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
              <Layers className="w-6 h-6" />
              Flashcards
            </h1>
          </div>
          {isAuthenticated && (
            <Link
              href="/flashcards/create"
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
                placeholder="Tìm kiếm bộ flashcard..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
          {isAuthenticated && (
            <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => { setFilter('all'); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Globe className="w-4 h-4 inline mr-1" /> Tất cả
              </button>
              <button
                onClick={() => { setFilter('my'); setPage(1); }}
                className={`px-4 py-2 text-sm font-medium transition ${filter === 'my' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <User className="w-4 h-4 inline mr-1" /> Của tôi
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {total} bộ flashcard {search && `cho "${search}"`}
        </p>

        {/* Sets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {search ? 'Không tìm thấy kết quả' : 'Chưa có bộ flashcard nào'}
            </h3>
            <p className="text-gray-400 mb-6">
              {search
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Hãy tạo bộ flashcard đầu tiên của bạn!'}
            </p>
            {isAuthenticated && !search && (
              <Link
                href="/flashcards/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
              >
                <Plus className="w-5 h-5" /> Tạo flashcard
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sets.map((set) => (
                <Link
                  key={set.id}
                  href={`/flashcards/${set.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition line-clamp-2 flex-1">
                      {set.title}
                    </h3>
                    {set.visibility === 'private' ? (
                      <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2 mt-0.5" />
                    ) : (
                      <Globe className="w-4 h-4 text-green-500 flex-shrink-0 ml-2 mt-0.5" />
                    )}
                  </div>
                  {set.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{set.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {set.card_count} thẻ
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {set.author_name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 px-4">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
