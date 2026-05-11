'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ArrowRight,
  Sparkles
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
  const router = useRouter();

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [featuredDocs, setFeaturedDocs] = useState<DocumentFeatured[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quiz Form States
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizError, setQuizError] = useState('');

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

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleGenerateQuiz = async () => {
    if (selectedDocs.length === 0) return;

    setIsGenerating(true);
    setQuizError('');

    try {
      const response = await fetch('http://localhost:8000/api/v1/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_ids: selectedDocs,
          num_questions: numQuestions,
          difficulty: difficulty,
          additional_context: additionalContext || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Có lỗi xảy ra khi tạo quiz.');
      }

      const data = await response.json();
      if (data.success && data.quiz_id) {
        router.push(`/quizzes/${data.quiz_id}`);
      } else {
        throw new Error('Đã tạo quiz nhưng không nhận được ID quiz hợp lệ.');
      }
    } catch (err: any) {
      setQuizError(err.message || 'Lỗi kết nối đến máy chủ.');
    } finally {
      setIsGenerating(false);
    }
  };

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
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Đã chọn: <strong className="text-blue-600">{selectedDocs.length}</strong>
                </span>
                <Link
                  href={`/search/subject/${subjectId}`}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Xem tất cả <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {featuredDocs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {featuredDocs.map(doc => (
                  <div
                    key={doc.id}
                    className={`group flex flex-col bg-white rounded-2xl p-5 border transition-all cursor-pointer relative ${selectedDocs.includes(doc.id)
                      ? 'border-purple-500 shadow-md ring-1 ring-purple-500'
                      : 'border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300'
                      }`}
                    onClick={() => toggleDocSelection(doc.id)}
                  >
                    <div className="absolute top-4 right-4">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer pointer-events-none"
                        checked={selectedDocs.includes(doc.id)}
                        readOnly
                      />
                    </div>

                    <div className="flex items-center gap-3 mb-3 pr-8">
                      <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                        {getDocIcon(doc.doc_type)}
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        {getTypeLabel(doc.doc_type)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-900 line-clamp-2 mb-4 flex-1 group-hover:text-blue-600 transition-colors pr-6">
                      {doc.file_name}
                    </h3>

                    <div className="text-xs font-medium text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span>{formatBytes(doc.file_size)}</span>
                      <Link
                        href={`/search/${doc.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 hover:underline z-10 font-semibold"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Tạo Quiz AI</h3>
              </div>

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Tạo tự động bộ câu hỏi trắc nghiệm từ các tài liệu bạn đã chọn. AI sẽ phân tích nội dung và sinh ra quiz cho bạn.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tài liệu đã chọn
                  </label>
                  <div className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedDocs.length === 0 ? (
                      <span className="text-gray-500 italic block text-center">Vui lòng chọn ít nhất 1 tài liệu ở bên trái</span>
                    ) : (
                      <div className="flex items-center gap-2 text-purple-700 font-medium">
                        <FileText className="w-4 h-4" />
                        <span>{selectedDocs.length} tài liệu được chọn</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số lượng câu hỏi
                  </label>
                  <input
                    type="number"
                    min="1" max="50"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Độ khó
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ghi chú thêm (tùy chọn)
                  </label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Ví dụ: Tập trung vào chương 1 và 2..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all h-24 resize-none"
                  />
                </div>
              </div>

              {quizError && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-start gap-2">
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{quizError}</span>
                </div>
              )}

              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || selectedDocs.length === 0}
                className={`flex items-center justify-center gap-2 w-full px-5 py-3.5 text-sm font-bold text-white rounded-xl transition-all
                   ${isGenerating || selectedDocs.length === 0
                    ? 'bg-purple-300 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:-translate-y-0.5'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang phân tích & tạo Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Tạo Quiz Ngay
                  </>
                )}
              </button>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <Link
                  href={`/quizzes`}
                  className="text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-1"
                >
                  Xem danh sách Quiz đã tạo <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
