'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  FileCode,
  File,
  Loader2,
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
      return <BookOpen className="w-6 h-6 text-blue-600" />;
    case 'exercise':
      return <FileCode className="w-6 h-6 text-green-600" />;
    case 'exam':
      return <FileText className="w-6 h-6 text-red-600" />;
    default:
      return <File className="w-6 h-6 text-gray-600" />;
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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tài liệu</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Tài liệu nổi bật</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Khám phá nội dung mới nhất và tải lên tài liệu của bạn ngay.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
            <Link
              href="/document/upload"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Upload tài liệu mới
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tài liệu nổi bật</h2>
              <p className="mt-1 text-sm text-slate-500">Những tài liệu mới cập nhật và đáng chú ý.</p>
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
          ) : featured.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-600">Chưa có tài liệu nổi bật. Vui lòng thử lại sau hoặc upload tài liệu mới.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/search/${doc.id}`}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white shadow-sm">{getIcon(doc.doc_type)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500">{getTypeLabel(doc.doc_type)}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900 line-clamp-2">{doc.file_name}</h3>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                    <span>{formatBytes(doc.file_size)}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm">#{doc.subject_id}</span>
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
