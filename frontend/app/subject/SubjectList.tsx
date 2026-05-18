'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowUp, ArrowLeft, BookOpen, GraduationCap } from 'lucide-react';

interface SubjectFeatured {
  id: number;
  subject_code: string;
  subject_name: string;
  university_code: string;
  university_name: string;
}

export default function SubjectList() {
  const [featuredSubjects, setFeaturedSubjects] = useState<SubjectFeatured[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeaturedSubjects = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('http://localhost:8000/api/v1/subject/featured');
        if (!res.ok) {
          throw new Error(`Không tải được môn học nổi bật (${res.status})`);
        }
        const data = await res.json();
        setFeaturedSubjects(data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Lỗi khi lấy môn học nổi bật.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedSubjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Môn học</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Môn học nổi bật</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Khám phá các môn học được quan tâm nhiều nhất.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Danh sách nổi bật</h2>
              <p className="mt-1 text-sm text-slate-500">Những môn học có nhiều tài liệu và bài tập.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              <ArrowUp className="h-4 w-4" />
              Mới nhất
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">{error}</div>
          ) : featuredSubjects.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-600">
              Chưa có môn học nào.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredSubjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/subject/${subject.id}`}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-sm">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        {subject.subject_code}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900 line-clamp-2">
                        {subject.subject_name}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[150px]">{subject.university_name}</span>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold border border-slate-100 text-slate-500 shadow-sm">
                      {subject.university_code}
                    </span>
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
