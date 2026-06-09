'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  FileCode,
  File,
  ArrowUp,
  Plus,
  ArrowLeft,
} from 'lucide-react';

interface DocumentCard {
  id: string;
  file_name: string;
  doc_type: string;
  file_size: number;
  subject_id?: string | number;
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'lecture':
      return 'Bài giảng';
    case 'exercise':
      return 'Bài tập';
    case 'exam':
      return 'Đề thi';
    default:
      return 'Khác';
  }
};

const getIcon = (type: string) => {
  switch (type) {
    case 'lecture':
      return <BookOpen className="w-7 h-7 text-indigo-600" />;
    case 'exercise':
      return <FileCode className="w-7 h-7 text-emerald-600" />;
    case 'exam':
      return <FileText className="w-7 h-7 text-rose-600" />;
    default:
      return <File className="w-7 h-7 text-slate-600" />;
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

export default function DocumentList() {
  const [featured, setFeatured] = useState<DocumentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('http://localhost:8000/api/v1/document/featured');
        if (!res.ok) {
          throw new Error(`Không tải được tài liệu nổi bật (${res.status})`);
        }
        const data = await res.json();
        setFeatured(data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Lỗi khi lấy tài liệu nổi bật.');
      } finally {
        setLoading(false);
      }
    };

    loadFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-indigo-600 font-semibold">Tài liệu</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Tài liệu nổi bật</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Khám phá nội dung mới nhất và tải lên tài liệu của bạn ngay.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-md transition hover:bg-slate-100 hover:text-slate-900 backdrop-blur-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
            <Link
              href="/document/upload"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition hover:from-indigo-500 hover:to-purple-500 hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
            >
              <Plus className="h-5 w-5" />
              Upload tài liệu mới
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-8 shadow-2xl transition-all hover:bg-slate-50">
          <div className="flex items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Danh sách tài liệu</h2>
              <p className="mt-1 text-sm text-slate-600">Những tài liệu mới cập nhật và đáng chú ý.</p>
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
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-600 shadow-inner">
              Chưa có tài liệu nổi bật. Vui lòng thử lại sau hoặc upload tài liệu mới.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/search/${doc.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/30 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)] shadow-inner"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all duration-300 group-hover:bg-indigo-100"></div>

                  <div className="flex items-start gap-4 relative z-10">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-md group-hover:scale-110 transition-transform duration-300">
                      {getIcon(doc.doc_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{getTypeLabel(doc.doc_type)}</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-700 transition-colors">{doc.file_name}</h3>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-sm text-slate-600 relative z-10">
                    <span className="font-medium bg-white px-3 py-1 rounded-lg border border-slate-100">{formatBytes(doc.file_size)}</span>
                    <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-indigo-700 font-mono shadow-md">#{doc.subject_id}</span>
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
