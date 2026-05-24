'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  ArrowUp,
  Plus,
  ArrowLeft,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface QuizResponse {
  success: boolean;
  message: string;
  quiz_id: number;
  quiz_title: string;
}

export default function QuizList() {
  const [featuredQuizzes, setFeaturedQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFeaturedQuizzes = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('http://localhost:8000/api/v1/quiz/featured');
        if (!res.ok) {
          throw new Error(`Không tải được bài trắc nghiệm nổi bật (${res.status})`);
        }
        const data = await res.json();
        setFeaturedQuizzes(data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Lỗi khi lấy bài trắc nghiệm nổi bật.');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedQuizzes();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-indigo-600 font-semibold">Trắc nghiệm</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Bài trắc nghiệm nổi bật</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Khám phá các bài trắc nghiệm mới nhất.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-md transition hover:bg-slate-100 hover:text-slate-900 backdrop-blur-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-8 shadow-2xl transition-all hover:bg-slate-50">
          <div className="flex items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Danh sách nổi bật</h2>
              <p className="mt-1 text-sm text-slate-600">Những bài trắc nghiệm mới cập nhật và đáng chú ý.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-sm font-medium text-indigo-600">
              <ArrowUp className="h-4 w-4" />
              Mới nhất
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 backdrop-blur-sm">{error}</div>
          ) : featuredQuizzes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-600 shadow-inner">Chưa có bài trắc nghiệm nổi bật. Vui lòng thử lại sau.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredQuizzes.map((quiz) => (
                <Link
                  key={quiz.quiz_id}
                  href={`/quizzes/${quiz.quiz_id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/30 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)] shadow-inner"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all duration-300 group-hover:bg-indigo-100"></div>
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <HelpCircle className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Trắc nghiệm</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-700 transition-colors">{quiz.quiz_title}</h3>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-sm text-slate-600 relative z-10">
                    <span className={`flex items-center gap-1.5 font-medium px-3 py-1 rounded-lg border ${quiz.success ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                      <CheckCircle className="w-4 h-4" /> {quiz.success ? "Thành công" : "Lỗi"}
                    </span>
                    <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-indigo-700 font-mono shadow-md">#{quiz.quiz_id}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
