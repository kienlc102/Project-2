'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ChevronUp, MessageSquare, Clock, Loader2,
  AlertCircle, Trophy, User, FileText
} from 'lucide-react';
import { fetchUserPosts, ForumPost, TopUser, timeAgo } from '@/lib/forum';

interface UserStats {
  reputation_score: number;
  post_count: number;
}

export default function ForumUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.userId);

  const [user, setUser] = useState<Pick<TopUser, 'id' | 'full_name' | 'email'> | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchUserPosts(userId)
      .then(res => {
        if (res.success) {
          setUser(res.data.user);
          setPosts(res.data.posts);
          setStats(res.data.stats);
        } else {
          setError(res.message || 'Không tải được dữ liệu');
        }
      })
      .catch(() => setError('Lỗi kết nối đến máy chủ'))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-teal-600/15 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-3xl space-y-6 relative z-10">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-900 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        ) : (
          <>
            {/* User Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-200">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-slate-900 truncate">
                    {user?.full_name || user?.email || 'Người dùng'}
                  </h1>
                  {user?.full_name && (
                    <p className="text-sm text-slate-900 mt-0.5">{user.email}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-950 bg-cyan-50 border border-cyan-100 px-3 py-1.5 rounded-xl">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-slate-950">{stats?.reputation_score ?? 0}</span>
                      <span className="text-slate-900">điểm</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-950 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                      <FileText className="w-4 h-4 text-cyan-500" />
                      <span className="font-semibold text-slate-950">{stats?.post_count ?? 0}</span>
                      <span className="text-slate-900">bài viết</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <FileText className="w-4 h-4 text-cyan-500" />
                <h2 className="text-sm font-bold text-slate-900">
                  Tất cả bài viết
                </h2>
                <span className="ml-auto text-xs text-slate-900">{posts.length} bài viết</span>
              </div>

              {posts.length === 0 ? (
                <div className="py-16 text-center text-slate-900">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold">Chưa có bài viết nào</p>
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
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            {post.tags.slice(0, 4).map(tag => (
                              <Link
                                key={tag}
                                href={`/forum/tag/${encodeURIComponent(tag)}`}
                                onClick={e => e.stopPropagation()}
                                className="text-xs px-2 py-0.5 rounded-full border bg-cyan-50 border-cyan-200 text-cyan-800 hover:bg-cyan-100 font-medium transition"
                              >
                                #{tag}
                              </Link>
                            ))}
                            <span className="text-xs text-slate-900 flex items-center gap-1 ml-auto">
                              <Clock className="w-3 h-3" /> {timeAgo(post.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Comment count */}
                        <div className="shrink-0 flex flex-col items-center justify-center text-xs text-slate-900">
                          <MessageSquare className="w-4 h-4 mb-0.5" />
                          {post.comment_count}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
