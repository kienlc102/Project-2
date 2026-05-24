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
  question_index: number;
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-600 font-medium">Đang tải đề thi...</p>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
        <div className="max-w-md w-full bg-white backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl border border-slate-200 relative z-10">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Không thể tải đề thi</h2>
          <p className="text-slate-600 mb-8">{error}</p>
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 rounded-xl transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Về danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>

          {submitResult && (
            <div className="bg-white backdrop-blur-md px-6 py-3 rounded-xl border border-emerald-200 shadow-lg flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600">Kết quả:</span>
              <span className="text-xl font-bold text-emerald-600">{submitResult.score}/{submitResult.total}</span>
              <span className="text-sm font-bold bg-emerald-500/20 border border-emerald-300 text-emerald-700 px-3 py-1 rounded-lg">
                {submitResult.percentage}%
              </span>
            </div>
          )}
        </div>

        {/* Cảnh báo lỗi nộp bài nếu có */}
        {error && questions.length > 0 && (
          <div className="bg-rose-50 text-rose-600 p-5 rounded-2xl border border-rose-200 text-sm font-medium flex items-center gap-3">
            <XCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Danh sách câu hỏi */}
        <div className="space-y-8">
          {questions.map((q, idx) => {
            const isSubmitted = !!submitResult;
            const selectedAns = answers[idx];
            const resultForQ = submitResult?.results.find(r => r.question_index === idx);
            const isCorrect = resultForQ?.is_correct;

            return (
              <div
                key={idx}
                className={`bg-white backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl transition-all duration-300 ${isSubmitted
                  ? isCorrect
                    ? 'border border-emerald-300 bg-emerald-500/[0.02]'
                    : 'border border-rose-500/30 bg-rose-500/[0.02]'
                  : 'border border-slate-200 hover:border-white/20'
                  }`}
              >
                <div className="flex items-start gap-5 mb-8">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-md ${isSubmitted
                    ? isCorrect
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-300'
                      : 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
                    : 'bg-indigo-100 text-indigo-600 border border-indigo-500/30'
                    }`}>
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 leading-relaxed mt-1">
                    {q.question}
                  </h3>
                </div>

                <div className="space-y-4 pl-0 md:pl-14">
                  {q.options.map((opt) => {
                    const isSelected = selectedAns === opt.key;

                    let optionClass = 'border-slate-200 hover:border-indigo-500/50 hover:bg-white text-slate-700 bg-white';
                    let keyClass = 'bg-white border-slate-200 text-slate-600';

                    if (isSelected) {
                      optionClass = 'border-indigo-500 bg-indigo-50 text-slate-900 shadow-[0_0_15px_rgba(99,102,241,0.15)]';
                      keyClass = 'bg-indigo-500 text-white border-indigo-500';
                    }

                    // Nếu đã nộp bài, highlight đáp án đúng và sai
                    if (isSubmitted) {
                      if (opt.key === q.correct_answer) {
                        optionClass = 'border-emerald-500 bg-emerald-50 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
                        keyClass = 'bg-emerald-500 text-white border-emerald-500';
                      } else if (isSelected && opt.key !== q.correct_answer) {
                        optionClass = 'border-rose-500 bg-rose-50 text-slate-900 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
                        keyClass = 'bg-rose-500 text-white border-rose-500';
                      } else {
                        optionClass = 'border-slate-100 opacity-50 text-slate-500 bg-white';
                        keyClass = 'bg-white border-slate-100 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(idx, opt.key)}
                        className={`w-full text-left p-4 md:p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${optionClass}`}
                      >
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-bold transition-colors ${keyClass}`}>
                          {opt.key}
                        </span>
                        <span className="flex-1 font-medium">{opt.text}</span>

                        {isSubmitted && opt.key === q.correct_answer && (
                          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                        )}
                        {isSubmitted && isSelected && opt.key !== q.correct_answer && (
                          <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Hiển thị giải thích sau khi nộp */}
                {isSubmitted && (
                  <div className={`mt-8 pl-0 md:pl-14 pt-6 border-t ${isCorrect ? 'border-emerald-200' : 'border-rose-200'}`}>
                    <p className="text-sm font-bold mb-2 text-slate-900 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      Giải thích:
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-100 shadow-inner">
                      {q.explanation || 'Không có giải thích chi tiết cho câu hỏi này.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {!submitResult && questions.length > 0 && (
          <div className="flex justify-end pt-6 pb-10">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  Nộp bài trắc nghiệm
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
