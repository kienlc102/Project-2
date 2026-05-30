'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  FileCode,
  File,
  Loader2,
  HardDrive,
  University,
  Layers,
  Sparkles,
  ClipboardList,
  Grid,
  Bookmark,
  LayoutGrid,
  HelpCircle,
  XCircle
} from 'lucide-react';
import { getToken } from '@/lib/auth';

interface SubjectDetail {
  id: number;
  subject_code: string;
  subject_name: string;
  description?: string | null;
  created_at: string;
  university: {
    id?: number | null;
    university_code?: string | null;
    university_name?: string | null;
  };
  documents: Array<{
    id: string;
    file_name: string;
    doc_type: string;
    file_size: number;
    subject_id: number;
  }>;
  document_counts: {
    lecture: number;
    exercise: number;
    exam: number;
    other: number;
  };
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const getDocumentTypeLabel = (type: string) => {
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

const getDocumentTypeIcon = (type: string) => {
  switch (type) {
    case 'lecture':
      return <BookOpen className="w-6 h-6 text-indigo-600" />;
    case 'exercise':
      return <FileCode className="w-6 h-6 text-emerald-600" />;
    case 'exam':
      return <FileText className="w-6 h-6 text-rose-600" />;
    default:
      return <File className="w-6 h-6 text-slate-600" />;
  }
};

function SubjectDetailPage() {
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subjectId) {
      loadSubject(subjectId);
    }
  }, [subjectId]);

  const loadSubject = async (id: string) => {
    setLoading(true);
    setError('');

    try {
      const API_BASE = 'http://localhost:8000';
      const token = getToken();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/v1/document/subject/${id}`, {
        headers,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Lỗi server ${res.status}`);
      }

      const data = await res.json();
      setSubject(data);
    } catch (err: any) {
      console.error('Load subject error:', err);
      setError(err.message || 'Không thể tải thông tin môn học.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
        <div className="max-w-md mx-auto bg-white backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-2xl text-center relative z-10">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Không thể tải môn học</h2>
          <p className="text-slate-600 mb-8">{error || 'Môn học không tồn tại.'}</p>
          <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 rounded-xl transition font-medium">
            <ArrowLeft className="w-4 h-4" /> Quay lại tìm kiếm
          </Link>
        </div>
      </div>
    );
  }

  const searchQuery = encodeURIComponent(subject.subject_name);
  const flashcardsLink = `/flashcards?search=${searchQuery}`;
  const quizzesLink = `/quizzes?search=${searchQuery}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans px-4 py-10 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/search" className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 hover:text-slate-900 transition-all mb-6 text-sm font-medium w-fit">
              <ArrowLeft className="w-4 h-4" /> Trở về tìm kiếm
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{subject.subject_name}</h1>
            <div className="flex items-center gap-3 mt-4">
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-widest">{subject.subject_code}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-700 font-medium flex items-center gap-2">
                <University className="w-4 h-4 text-emerald-600" />
                {subject.university.university_name || 'Không rõ trường'}
              </span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-5 shadow-2xl">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center p-3 rounded-2xl bg-white border border-slate-100 shadow-inner">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Tài liệu</p>
                <p className="text-2xl font-bold text-slate-900">{subject.documents.length}</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-white border border-slate-100 shadow-inner">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Bài giảng</p>
                <p className="text-2xl font-bold text-indigo-600">{subject.document_counts.lecture}</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-white border border-slate-100 shadow-inner">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Bài tập</p>
                <p className="text-2xl font-bold text-emerald-600">{subject.document_counts.exercise}</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-white border border-slate-100 shadow-inner">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Đề thi</p>
                <p className="text-2xl font-bold text-rose-600">{subject.document_counts.exam}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-4">
                <div className="p-2.5 bg-indigo-100 rounded-xl border border-indigo-500/30">
                  <Layers className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Thông tin cơ bản</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-inner">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mã môn học</p>
                  <p className="mt-3 text-lg font-bold text-slate-900">{subject.subject_code}</p>
                </div>
                <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-inner">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trường</p>
                  <p className="mt-3 text-lg font-bold text-slate-900 line-clamp-1">{subject.university.university_name || 'Không rõ trường'}</p>
                </div>
                <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-inner">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mã trường</p>
                  <p className="mt-3 text-lg font-bold text-slate-900">{subject.university.university_code || '-'}</p>
                </div>
                <div className="rounded-2xl bg-white p-6 border border-slate-100 shadow-inner">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày tạo</p>
                  <p className="mt-3 text-lg font-bold text-slate-900">{new Date(subject.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white0 p-6 shadow-inner">
                <p className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Mô tả môn học</p>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {subject.description || <span className="italic text-slate-500">Chưa có mô tả cho môn học này.</span>}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-4">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-300">
                  <ClipboardList className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Tài liệu liên quan</h2>
              </div>
              <div className="grid gap-5">
                {subject.documents.length === 0 ? (
                  <div className="rounded-3xl bg-white p-10 text-center border border-slate-100 shadow-inner">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium text-lg">Chưa có tài liệu nào cho môn học này.</p>
                  </div>
                ) : (
                  subject.documents.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/search/${doc.id}`}
                      className="block rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] group shadow-inner"
                    >
                      <div className="flex items-start gap-5">
                        <div className="p-4 rounded-2xl bg-white border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                          {getDocumentTypeIcon(doc.doc_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{getDocumentTypeLabel(doc.doc_type)}</p>
                          <h3 className="line-clamp-2 text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{doc.file_name}</h3>
                          <div className="mt-4 flex items-center justify-between text-sm pt-4 border-t border-slate-100">
                            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                              <HardDrive className="w-4 h-4 text-indigo-600" />
                              {formatBytes(doc.file_size)}
                            </span>
                            <span className="text-indigo-600 font-bold group-hover:underline">Chi tiết &rarr;</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-4">
                <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Học tập nhanh</h2>
              </div>
              <div className="space-y-5">
                <Link href={flashcardsLink} className="block rounded-2xl border border-slate-200 bg-white p-6 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all shadow-inner group">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Flashcards</p>
                      <p className="mt-2 text-lg font-bold text-slate-900 group-hover:text-amber-400 transition-colors">Tìm flashcards</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100 group-hover:bg-amber-500/20 transition-colors">
                      <Bookmark className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                </Link>
                <Link href={quizzesLink} className="block rounded-2xl border border-slate-200 bg-white p-6 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-all shadow-inner group">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quiz</p>
                      <p className="mt-2 text-lg font-bold text-slate-900 group-hover:text-fuchsia-600 transition-colors">Tìm quiz</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100 group-hover:bg-fuchsia-100 transition-colors">
                      <HelpCircle className="w-6 h-6 text-fuchsia-600" />
                    </div>
                  </div>
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-4">
                <div className="p-2.5 bg-violet-500/20 rounded-xl border border-violet-500/30">
                  <LayoutGrid className="w-6 h-6 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Chi tiết môn học</h2>
              </div>
              <div className="space-y-5">
                <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-inner">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Mã
                  </p>
                  <p className="font-bold text-slate-900 text-lg ml-3.5">{subject.subject_code}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-inner">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Trường
                  </p>
                  <p className="font-bold text-slate-900 text-lg ml-3.5">{subject.university.university_name || '-'}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-inner">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Loại tài liệu
                  </p>
                  <p className="font-bold text-slate-900 text-base ml-3.5 leading-relaxed">Bài giảng, bài tập, đề thi</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function SearchSubjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SubjectDetailPage />
    </Suspense>
  );
}
