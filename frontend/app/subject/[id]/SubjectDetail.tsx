'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Calendar,
  GraduationCap,
  XCircle,
  FileText,
  FileCode,
  File,
  ArrowRight
} from 'lucide-react';

interface SubjectDetail {
  subject_code: string;
  subject_name: string;
  university_code: string;
  university_name: string;
  created_at: string;
  updated_at: string;
}

interface DocumentFeatured {
  id: string;
  file_name: string;
  doc_type: string;
  subject_id: number;
  file_size: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'lecture': return 'Bài giảng';
    case 'exercise': return 'Bài tập';
    case 'exam': return 'Đề thi';
    default: return 'Khác';
  }
};

const getDocIcon = (type: string) => {
  switch (type) {
    case 'lecture': return <BookOpen className="w-5 h-5 text-blue-600" />;
    case 'exercise': return <FileCode className="w-5 h-5 text-green-600" />;
    case 'exam': return <FileText className="w-5 h-5 text-red-600" />;
    default: return <File className="w-5 h-5 text-gray-600" />;
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

export default function SubjectDetailComponent() {
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [featuredDocs, setFeaturedDocs] = useState<DocumentFeatured[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!subjectId) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [subjectRes, docsRes] = await Promise.all([
          fetch(`http://localhost:8000/api/v1/subject/${subjectId}`),
          fetch(`http://localhost:8000/api/v1/document/featured-subject/${subjectId}`)
        ]);

        if (!subjectRes.ok) {
          throw new Error(`Không tải được thông tin môn học (${subjectRes.status})`);
        }
        
        const subjectData = await subjectRes.json();
        setSubject(subjectData);

        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setFeaturedDocs(docsData);
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin môn học');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Đang tải thông tin môn học...</p>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-red-100">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy môn học</h2>
          <p className="text-gray-600 mb-6">{error || 'Môn học không tồn tại hoặc đã bị xóa.'}</p>
          <Link
            href="/subject"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Về danh sách môn học
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Info */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link
            href="/subject"
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-slate-100 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-shrink-0 p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <BookOpen className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold uppercase tracking-wider mb-3">
                {subject.subject_code}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                {subject.subject_name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-slate-400" />
                  <span className="font-medium text-slate-700">{subject.university_name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Đã tạo: {formatDate(subject.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Content: Featured Documents */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Tài liệu nổi bật</h2>
              <Link 
                href={`/search/subject/${subjectId}`}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {featuredDocs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {featuredDocs.map(doc => (
                  <Link 
                    key={doc.id}
                    href={`/search/${doc.id}`}
                    className="group flex flex-col bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                        {getDocIcon(doc.doc_type)}
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        {getTypeLabel(doc.doc_type)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 line-clamp-2 mb-4 flex-1 group-hover:text-blue-600 transition-colors">
                      {doc.file_name}
                    </h3>
                    <div className="text-xs font-medium text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span>{formatBytes(doc.file_size)}</span>
                      <span>ID: {doc.id.substring(0, 8)}...</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Chưa có tài liệu nổi bật nào cho môn học này.</p>
                <Link 
                  href="/document/upload"
                  className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Tải lên tài liệu đầu tiên
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-32">
               <div className="flex items-center gap-3 mb-4">
                 <BookOpen className="w-6 h-6 text-purple-500" />
                 <h3 className="text-lg font-bold text-slate-900">Trắc nghiệm</h3>
               </div>
               <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                 Kiểm tra và củng cố kiến thức môn <strong>{subject.subject_name}</strong> bằng hệ thống bài tập trắc nghiệm đa dạng được tổng hợp tự động.
               </p>
               <Link 
                 href={`/quizzes`} 
                 className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 hover:shadow-md transition-all"
               >
                 Vào làm trắc nghiệm <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
