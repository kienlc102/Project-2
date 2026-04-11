'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/auth';
import { getQuiz, deleteQuiz, Quiz } from '@/lib/quizzes';
import {
  ArrowLeft, Edit, Trash2, Globe, Lock, User, ClipboardList,
  Loader2, Circle, Square, List, AlignLeft, Check, Link2, CheckCircle,
  Copy, Play, BarChart3,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_QUIZ_API_URL?.replace('/api', '') || 'http://localhost:5003';

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = parseInt(params.id as string);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isNaN(quizId)) {
      setError('ID không hợp lệ');
      setLoading(false);
      return;
    }
    const fetchQuiz = async () => {
      try {
        const token = getToken();
        const res = await getQuiz(quizId, token);
        if (res.success && res.data) {
          setQuiz(res.data);
        } else {
          setError(res.message || 'Không tìm thấy quiz');
        }
      } catch {
        setError('Lỗi kết nối máy chủ');
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [quizId]);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/quizzes/${quizId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa quiz này?')) return;
    const token = getToken();
    if (!token) return;
    setDeleting(true);
    try {
      const res = await deleteQuiz(token, quizId);
      if (res.success) {
        router.push('/quizzes');
      } else {
        setError(res.message || 'Lỗi xóa quiz');
      }
    } catch {
      setError('Lỗi kết nối máy chủ');
    }
    setDeleting(false);
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      multiple_choice: 'Trắc nghiệm',
      checkboxes: 'Hộp kiểm',
      short_answer: 'Trả lời ngắn',
      paragraph: 'Đoạn văn',
      dropdown: 'Danh sách thả xuống',
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/quizzes" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-800">Quiz</h1>
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{error || 'Không tìm thấy quiz'}</p>
          <Link href="/quizzes" className="inline-block mt-4 text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/quizzes" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-800 truncate max-w-xs">{quiz.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                copied
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Đã copy!
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Copy link
                </>
              )}
            </button>

            <Link
              href={`/quizzes/${quizId}/take`}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            >
              <Play className="w-4 h-4" />
              Làm bài
            </Link>

            {quiz.isOwner && (
              <>
                <Link
                  href={`/quizzes/${quizId}/analytics`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Link>
                <Link
                  href={`/quizzes/${quizId}/edit`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                >
                  <Edit className="w-4 h-4" />
                  Sửa
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Xóa
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {/* Title Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-[10px] bg-blue-600 rounded-t-lg" />
          <div className="p-6">
            <h2 className="text-2xl font-normal text-gray-900">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-sm text-gray-500 mt-2">{quiz.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {quiz.author_name}
              </span>
              <span className="flex items-center gap-1">
                {quiz.visibility === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {quiz.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
              </span>
              <span>
                {quiz.questions?.length || 0} câu hỏi
              </span>
              <span>
                Tổng: {quiz.questions?.reduce((sum, q) => sum + q.points, 0) || 0} điểm
              </span>
            </div>
          </div>
        </div>

        {/* Questions */}
        {quiz.questions?.map((question, qIndex) => (
          <div
            key={question.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              {/* Question header */}
              <div className="flex items-start justify-between gap-3">
                <p className="text-base text-gray-800 flex-1">
                  {question.question_text}
                  {question.is_required && <span className="text-red-500 ml-1">*</span>}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {typeLabel(question.question_type)}
                  </span>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium">
                    {question.points} điểm
                  </span>
                </div>
              </div>

              {/* Question image */}
              {question.image_url && (
                <div className="mt-3">
                  <img
                    src={`${API_BASE}${question.image_url}`}
                    alt="Question"
                    className="max-h-60 w-auto rounded-lg border border-gray-200 object-contain"
                  />
                </div>
              )}

              {/* Options */}
              <div className="mt-4">
                {['multiple_choice', 'checkboxes', 'dropdown'].includes(question.question_type) ? (
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className="flex items-center gap-3">
                        {question.question_type === 'dropdown' ? (
                          <span className="text-sm text-gray-500 w-5 text-right">{oIndex + 1}.</span>
                        ) : question.question_type === 'checkboxes' ? (
                          option.is_correct ? (
                            <div className="w-[18px] h-[18px] rounded-sm bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-[18px] h-[18px] rounded-sm border-2 border-gray-400 flex-shrink-0" />
                          )
                        ) : option.is_correct ? (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-blue-600 flex items-center justify-center flex-shrink-0">
                            <div className="w-[10px] h-[10px] rounded-full bg-blue-600" />
                          </div>
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${option.is_correct ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                          {option.option_text}
                        </span>
                        {option.is_correct && question.question_type === 'dropdown' && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : question.question_type === 'short_answer' ? (
                  <div className="border-b border-dotted border-gray-300 pb-1">
                    <span className="text-sm text-gray-400">Văn bản câu trả lời ngắn</span>
                  </div>
                ) : (
                  <div>
                    <div className="border-b border-dotted border-gray-300 pb-1">
                      <span className="text-sm text-gray-400">Văn bản câu trả lời dài</span>
                    </div>
                    <div className="border-b border-dotted border-gray-300 mt-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Action Buttons Bottom Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <Link
            href={`/quizzes/${quizId}/take`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition mb-4"
          >
            <Play className="w-5 h-5" />
            Bắt đầu làm bài
          </Link>
          <p className="text-sm text-gray-500 mb-3">Hoặc chia sẻ quiz này với người khác</p>
          <button
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              copied
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Đã copy link!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy link chia sẻ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
