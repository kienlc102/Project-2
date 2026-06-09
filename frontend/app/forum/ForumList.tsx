'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, ChevronUp, Search, Plus, Tag, Clock,
  ArrowLeft, Flame, Loader2, AlertCircle, Trophy
} from 'lucide-react';
import { fetchPosts, fetchTopUsers, ForumPost, PaginationInfo, TopUser, timeAgo } from '@/lib/forum';
import { getToken } from '@/lib/auth';

export default function ForumList({ initialTag = '' }: { initialTag?: string }) {
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [activeTag] = useState(initialTag);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const token = typeof window !== 'undefined' ? getToken() : null;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchPosts(page, 20, search, activeTag, token ?? undefined);
      if (res.success) {
        setPosts(res.data.posts);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Không tải được bài viết');
      }
    } catch {
      setError('Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTag, token]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  useEffect(() => {
    fetchTopUsers().then(res => {
      if (res.success) setTopUsers(res.data.users);
    }).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  // Collect popular tags from loaded posts
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags))).slice(0, 15);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-teal-600/15 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-5xl space-y-6 relative z-10">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-800 font-semibold">Cộng đồng</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {activeTag ? `#${activeTag}` : 'Diễn đàn'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-950">
              {activeTag ? `Các bài viết được gắn tag "${activeTag}"` : 'Đặt câu hỏi, chia sẻ kiến thức, thảo luận cùng cộng đồng.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={activeTag ? '/forum' : '/'} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-900 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all">
              <ArrowLeft className="w-4 h-4" /> {activeTag ? 'Tất cả bài viết' : 'Quay lại'}
            </Link>
            {token && (
              <Link href="/forum/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 transition">
                <Plus className="w-4 h-4" /> Đăng bài
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, nội dung, tag, bình luận..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
              />
            </form>

            {/* Post List */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <Flame className="w-4 h-4 text-cyan-500" />
                <h2 className="text-sm font-bold text-slate-900">
                  {search ? `Kết quả cho "${search}"` : 'Bài viết mới nhất'}
                </h2>
                {pagination && (
                  <span className="ml-auto text-xs text-slate-900">{pagination.total} bài viết</span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 m-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
              ) : posts.length === 0 ? (
                <div className="py-16 text-center text-slate-900">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold">Chưa có bài viết nào</p>
                  <p className="text-sm mt-1 text-slate-900">Hãy là người đầu tiên đăng bài!</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {posts.map(post => (
                    <li key={post.id} className="group hover:bg-cyan-50/30 transition-colors">
                      <Link href={`/forum/${post.id}`} className="flex gap-4 px-5 py-4">
                        {/* Score */}
                        <div className={`shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border font-bold text-sm ${
                          post.score > 0 ? 'bg-cyan-50 border-cyan-200 text-cyan-800' :
                          post.score < 0 ? 'bg-rose-50 border-rose-200 text-rose-700' :
                          'bg-slate-50 border-slate-200 text-slate-900'
                        }`}>
                          <ChevronUp className="w-3.5 h-3.5 -mb-0.5" />
                          {post.score}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 group-hover:text-cyan-800 transition-colors line-clamp-1 text-base leading-tight">
                            {post.title}
                          </h3>
                          <p className="text-sm text-slate-900 mt-1 line-clamp-2 leading-relaxed">
                            {post.content.replace(/\$\$[\s\S]*?\$\$/g, '[công thức]').replace(/\$[^$]+?\$/g, '[ct]').slice(0, 150)}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2.5">
                            {post.tags.slice(0, 4).map(tag => (
                              <button
                                key={tag}
                                onClick={e => { e.preventDefault(); router.push(`/forum/tag/${encodeURIComponent(tag)}`); }}
                                className={`text-xs px-2 py-0.5 rounded-full border font-medium transition ${
                                  tag === activeTag ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:bg-cyan-100'
                                }`}
                              >
                                #{tag}
                              </button>
                            ))}
                            <span className="text-xs text-slate-900 flex items-center gap-1 ml-auto">
                              <Clock className="w-3 h-3" /> {timeAgo(post.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Comment count */}
                        <div className="shrink-0 flex flex-col items-center justify-center text-xs text-slate-500 group-hover:text-cyan-600 transition-colors">
                          <MessageSquare className="w-4 h-4 mb-0.5" />
                          {post.comment_count}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-950 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  ← Trước
                </button>
                <span className="text-sm text-slate-900 font-medium px-3">
                  Trang {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-950 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  Tiếp →
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:w-56 shrink-0 space-y-4">
            {/* Tags */}
            {allTags.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags phổ biến
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => router.push(`/forum/tag/${encodeURIComponent(tag)}`)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                        tag === activeTag ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-950 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-800'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reputation - Top 5 Users */}
            {topUsers.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Bảng xếp hạng
                </h3>
                <div className="space-y-1">
                  {topUsers.map((user, idx) => (
                    <Link
                      href={`/forum/user/${user.id}`}
                      key={user.id}
                      className="flex items-center gap-2 py-1.5 px-1.5 rounded-lg hover:bg-slate-50 transition group"
                    >
                      <span className={`text-xs font-bold w-5 text-center shrink-0 ${
                        idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-900' : idx === 2 ? 'text-amber-600' : 'text-slate-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-950 truncate group-hover:text-cyan-800 transition">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-slate-900">{user.reputation_score} điểm · {user.post_count} bài</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Guidelines */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-cyan-800 uppercase tracking-wider mb-2">Quy định</h3>
              <ul className="text-xs text-cyan-800 space-y-1.5">
                <li>• Tôn trọng mọi người</li>
                <li>• Đặt câu hỏi rõ ràng</li>
                <li>• Hỗ trợ LaTeX cho công thức</li>
                <li>• Không spam/quảng cáo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
