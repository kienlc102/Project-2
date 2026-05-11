'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle, XCircle, ArrowRight, Save } from 'lucide-react';

interface QuizOption {
  key: string;
  text: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  correct_answer: string;
  explanation: string;
}

interface QuizGenerateResponse {
  questions: QuizQuestion[];
}

interface QuizSubmitResult {
  question_index: int;
  is_correct: boolean;
  selected_key?: string;
  correct_key: string;
  explanation: string;
}

interface QuizSubmitResponse {
  score: number;
  total: number;
  percentage: number;
  results: QuizSubmitResult[];
}

export default function TakeQuiz() {
  const params = useParams();
  const quizId = params.id as string;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<QuizSubmitResponse | null>(null);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:8000/api/v1/quiz/get-quiz-by-id/${quizId}`);
        if (!res.ok) {
          throw new Error(`Lỗi tải đề thi (${res.status})`);
        }
        const data: QuizGenerateResponse = await res.json();
        setQuestions(data.questions || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Không thể tải đề thi.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleSelectOption = (qIndex: number, optionKey: string) => {
    if (submitResult) return; // Ngăn chặn thay đổi khi đã nộp bài
    setAnswers(prev => ({
      ...prev,
      [qIndex]: optionKey
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm("Bạn chưa hoàn thành tất cả các câu hỏi. Bạn có chắc chắn muốn nộp bài?")) {
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const submitPayload = {
        questions: questions,
        answers: Object.entries(answers).map(([idx, key]) => ({
          questionIndex: parseInt(idx),
          selectedKey: key
        }))
      };

      const res = await fetch(`http://localhost:8000/api/v1/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitPayload)
      });

      if (!res.ok) {
        throw new Error('Đã xảy ra lỗi khi nộp bài');
      }

      const data: QuizSubmitResponse = await res.json();
      setSubmitResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Đang tải đề thi...</p>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải đề thi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Về danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-full border border-transparent hover:border-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>

          {submitResult && (
            <div className="bg-white px-5 py-2 rounded-full border border-green-200 shadow-sm flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">Kết quả:</span>
              <span className="text-lg font-bold text-green-600">{submitResult.score}/{submitResult.total}</span>
              <span className="text-sm font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                {submitResult.percentage}%
              </span>
            </div>
          )}
        </div>

        {/* Cảnh báo lỗi nộp bài nếu có */}
        {error && questions.length > 0 && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
            {error}
          </div>
        )}

        {/* Danh sách câu hỏi */}
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const isSubmitted = !!submitResult;
            const selectedAns = answers[idx];
            const resultForQ = submitResult?.results.find(r => r.question_index === idx);
            const isCorrect = resultForQ?.is_correct;

            return (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-6 md:p-8 shadow-sm border transition ${isSubmitted
                  ? isCorrect
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-red-200 bg-red-50/30'
                  : 'border-slate-200'
                  }`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSubmitted
                    ? isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                    }`}>
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 leading-relaxed mt-0.5">
                    {q.question}
                  </h3>
                </div>

                <div className="space-y-3 pl-12">
                  {q.options.map((opt) => {
                    const isSelected = selectedAns === opt.key;

                    let optionClass = 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700';
                    if (isSelected) {
                      optionClass = 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500';
                    }

                    // Nếu đã nộp bài, highlight đáp án đúng và sai
                    if (isSubmitted) {
                      if (opt.key === q.correct_answer) {
                        optionClass = 'border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500';
                      } else if (isSelected && opt.key !== q.correct_answer) {
                        optionClass = 'border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500';
                      } else {
                        optionClass = 'border-slate-200 opacity-50 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(idx, opt.key)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${optionClass}`}
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-white border border-current text-xs font-bold">
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>

                        {isSubmitted && opt.key === q.correct_answer && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {isSubmitted && isSelected && opt.key !== q.correct_answer && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Hiển thị giải thích sau khi nộp */}
                {isSubmitted && (
                  <div className={`mt-6 pl-12 pt-4 border-t ${isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                    <p className="text-sm font-medium mb-1 text-slate-900">Giải thích:</p>
                    <p className="text-sm text-slate-600">{q.explanation || 'Không có giải thích chi tiết cho câu hỏi này.'}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {!submitResult && questions.length > 0 && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-70 disabled:hover:shadow-none"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Nộp bài
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
