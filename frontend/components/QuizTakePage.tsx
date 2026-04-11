'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
  Square,
  CheckSquare,
  Send,
  Loader2,
  AlertCircle,
  Trophy,
  ChevronDown,
} from 'lucide-react';
import { getQuiz, submitQuiz, Quiz } from '@/lib/quizzes';

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = parseInt(params.id as string);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    attemptId: number;
    score: number;
    totalPoints: number;
    percentage: number;
  } | null>(null);

  // answers: { [questionId]: selectedOptionIds[] | textAnswer }
  const [answers, setAnswers] = useState<
    Record<number, { selectedOptionIds?: number[]; textAnswer?: string }>
  >({});

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await getQuiz(quizId, token);
      if (res.success && res.data) {
        setQuiz(res.data);
      } else {
        setError(res.message || 'Không tìm thấy quiz');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionId: number, questionType: string) => {
    setAnswers((prev) => {
      const current = prev[questionId] || { selectedOptionIds: [] };
      let selectedOptionIds = current.selectedOptionIds || [];

      if (questionType === 'multiple_choice' || questionType === 'dropdown') {
        // Single select
        selectedOptionIds = [optionId];
      } else if (questionType === 'checkboxes') {
        // Toggle
        if (selectedOptionIds.includes(optionId)) {
          selectedOptionIds = selectedOptionIds.filter((id) => id !== optionId);
        } else {
          selectedOptionIds = [...selectedOptionIds, optionId];
        }
      }

      return { ...prev, [questionId]: { ...current, selectedOptionIds } };
    });
  };

  const handleTextAnswer = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], textAnswer: text },
    }));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token || !quiz?.questions) return;

    // Check required
    for (const q of quiz.questions) {
      if (q.is_required) {
        const answer = answers[q.id!];
        if (!answer) {
          setError(`Vui lòng trả lời tất cả câu hỏi bắt buộc`);
          return;
        }
        if (
          ['multiple_choice', 'checkboxes', 'dropdown'].includes(q.question_type) &&
          (!answer.selectedOptionIds || answer.selectedOptionIds.length === 0)
        ) {
          setError(`Vui lòng trả lời tất cả câu hỏi bắt buộc`);
          return;
        }
        if (
          ['short_answer', 'paragraph'].includes(q.question_type) &&
          (!answer.textAnswer || !answer.textAnswer.trim())
        ) {
          setError(`Vui lòng trả lời tất cả câu hỏi bắt buộc`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId: q.id!,
        selectedOptionIds: answers[q.id!]?.selectedOptionIds || [],
        textAnswer: answers[q.id!]?.textAnswer || '',
      }));

      const res = await submitQuiz(token, quizId, formattedAnswers);
      if (res.success && res.data) {
        setSubmitted(true);
        setResult(res.data);
      } else {
        setError(res.message || 'Lỗi nộp bài');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <Link href="/quizzes" className="text-blue-600 hover:underline mt-2 inline-block">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  // Result screen
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hoàn thành!</h1>
            <p className="text-gray-600 mb-6">{quiz?.title}</p>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
              <div className="text-5xl font-bold text-blue-600 mb-2">{result.percentage}%</div>
              <div className="text-gray-600">
                {result.score} / {result.totalPoints} điểm
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href={`/quizzes/${quizId}`}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Xem quiz
              </Link>
              <Link
                href="/quizzes"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Danh sách Quiz
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/quizzes/${quizId}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">{quiz?.title}</h1>
              <p className="text-xs text-gray-500">
                {quiz?.questions?.length || 0} câu hỏi
              </p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Nộp bài
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {quiz?.description && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600">{quiz.description}</p>
          </div>
        )}

        {quiz?.questions?.map((q, index) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {index + 1}
              </span>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {q.question_text}
                  {q.is_required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <span className="text-xs text-gray-500">{q.points} điểm</span>
              </div>
            </div>

            {q.image_url && (
              <div className="mb-4 ml-9">
                <img
                  src={q.image_url}
                  alt="Hình ảnh câu hỏi"
                  className="max-h-48 rounded-lg object-contain"
                />
              </div>
            )}

            <div className="ml-9">
              {/* Multiple choice */}
              {q.question_type === 'multiple_choice' && (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected =
                      answers[q.id!]?.selectedOptionIds?.includes(opt.id!) || false;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id!, opt.id!, 'multiple_choice')}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition flex items-center gap-3 ${
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {selected ? (
                          <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        {opt.option_text}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Checkboxes */}
              {q.question_type === 'checkboxes' && (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected =
                      answers[q.id!]?.selectedOptionIds?.includes(opt.id!) || false;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id!, opt.id!, 'checkboxes')}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition flex items-center gap-3 ${
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {selected ? (
                          <CheckSquare className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        {opt.option_text}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Dropdown */}
              {q.question_type === 'dropdown' && (
                <div className="relative">
                  <select
                    value={answers[q.id!]?.selectedOptionIds?.[0] || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSelectOption(q.id!, parseInt(e.target.value), 'dropdown');
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg appearance-none bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Chọn một lựa chọn...</option>
                    {q.options.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.option_text}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Short answer */}
              {q.question_type === 'short_answer' && (
                <input
                  type="text"
                  value={answers[q.id!]?.textAnswer || ''}
                  onChange={(e) => handleTextAnswer(q.id!, e.target.value)}
                  placeholder="Nhập câu trả lời ngắn..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}

              {/* Paragraph */}
              {q.question_type === 'paragraph' && (
                <textarea
                  value={answers[q.id!]?.textAnswer || ''}
                  onChange={(e) => handleTextAnswer(q.id!, e.target.value)}
                  placeholder="Nhập câu trả lời dài..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                />
              )}
            </div>
          </div>
        ))}

        {/* Submit button at bottom */}
        <div className="flex justify-center pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Nộp bài
          </button>
        </div>
      </div>
    </div>
  );
}
