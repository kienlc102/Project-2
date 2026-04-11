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

const getDocumentTypeColor = (type: string) => {
  switch (type) {
    case 'lecture':
      return 'bg-blue-100 text-blue-700';
    case 'exercise':
      return 'bg-green-100 text-green-700';
    case 'exam':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <Link href="/search" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại tìm kiếm
        </Link>
        <div className="max-w-2xl mx-auto bg-white border border-red-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700 mb-3">Không thể tải môn học</h2>
          <p className="text-gray-600">{error || 'Môn học không tồn tại.'}</p>
        </div>
      </div>
    );
  }

  const searchQuery = encodeURIComponent(subject.subject_name);
  const flashcardsLink = `/flashcards?search=${searchQuery}`;
  const quizzesLink = `/quizzes?search=${searchQuery}`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/search" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="w-4 h-4" /> Trở về tìm kiếm
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{subject.subject_name}</h1>
            <p className="text-gray-500 mt-2">
              {subject.subject_code} • {subject.university.university_name || 'Không rõ trường'}
            </p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Tài liệu</p>
                <p className="text-xl font-semibold text-gray-900">{subject.documents.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Bài giảng</p>
                <p className="text-xl font-semibold text-blue-700">{subject.document_counts.lecture}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Bài tập</p>
                <p className="text-xl font-semibold text-green-700">{subject.document_counts.exercise}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Đề thi</p>
                <p className="text-xl font-semibold text-red-700">{subject.document_counts.exam}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Layers className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">Mã môn học</p>
                  <p className="mt-2 font-semibold text-gray-900">{subject.subject_code}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">Trường</p>
                  <p className="mt-2 font-semibold text-gray-900">{subject.university.university_name || 'Không rõ trường'}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">Mã trường</p>
                  <p className="mt-2 font-semibold text-gray-900">{subject.university.university_code || '-'}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-5">
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="mt-2 font-semibold text-gray-900">{new Date(subject.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-5">
                <p className="text-sm font-medium text-gray-600">Mô tả môn học</p>
                <p className="mt-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {subject.description || 'Chưa có mô tả cho môn học này.'}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <ClipboardList className="w-6 h-6 text-sky-600" />
                <h2 className="text-xl font-semibold text-gray-900">Tài liệu liên quan</h2>
              </div>
              <div className="grid gap-4">
                {subject.documents.length === 0 ? (
                  <div className="rounded-3xl bg-gray-50 p-6 text-gray-600">Chưa có tài liệu nào cho môn học này.</div>
                ) : (
                  subject.documents.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/search/${doc.id}`}
                      className="block rounded-3xl border border-gray-200 p-5 transition hover:border-blue-300 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-indigo-50">
                          {doc.doc_type === 'lecture' ? <BookOpen className="w-5 h-5 text-indigo-700" /> : doc.doc_type === 'exercise' ? <FileCode className="w-5 h-5 text-green-700" /> : doc.doc_type === 'exam' ? <FileText className="w-5 h-5 text-red-700" /> : <File className="w-5 h-5 text-gray-700" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-500">{getDocumentTypeLabel(doc.doc_type)}</p>
                          <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-gray-900">{doc.file_name}</h3>
                          <p className="mt-2 text-sm text-gray-500">{formatBytes(doc.file_size)}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">Học tập nhanh</h2>
              </div>
              <div className="space-y-4">
                <Link href={flashcardsLink} className="block rounded-3xl border border-gray-200 px-4 py-5 hover:border-green-300 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Flashcards</p>
                      <p className="mt-2 font-semibold text-gray-900">Tìm flashcards</p>
                    </div>
                    <Bookmark className="w-5 h-5 text-green-600" />
                  </div>
                </Link>
                <Link href={quizzesLink} className="block rounded-3xl border border-gray-200 px-4 py-5 hover:border-blue-300 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Quiz</p>
                      <p className="mt-2 font-semibold text-gray-900">Tìm quiz</p>
                    </div>
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </Link>
              </div>
            </section>
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <LayoutGrid className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold text-gray-900">Chi tiết môn học</h2>
              </div>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="rounded-3xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Mã</p>
                  <p className="mt-2 font-medium text-gray-900">{subject.subject_code}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Trường</p>
                  <p className="mt-2 font-medium text-gray-900">{subject.university.university_name || '-'}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Loại tài liệu</p>
                  <p className="mt-2 font-medium text-gray-900">Bài giảng, bài tập, đề thi</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>}>
      <SubjectDetailPage />
    </Suspense>
  );
}
