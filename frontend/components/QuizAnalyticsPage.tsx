'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Users,
  Trophy,
  TrendingUp,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Clock,
} from 'lucide-react';
import {
  getQuizAnalytics,
  getQuizResponses,
  QuizAnalytics,
  QuizResponse,
} from '@/lib/quizzes';

type Tab = 'summary' | 'individual';

export default function QuizAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = parseInt(params.id as string);

  const [tab, setTab] = useState<Tab>('summary');
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [quizId]);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [analyticsRes, responsesRes] = await Promise.all([
        getQuizAnalytics(token, quizId),
        getQuizResponses(token, quizId),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      } else {
        setError(analyticsRes.message || 'Không thể tải analytics');
      }

      if (responsesRes.success && responsesRes.data) {
        setResponses(responsesRes.data.responses);
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">{error}</p>
          <Link href={`/quizzes/${quizId}`} className="text-blue-600 hover:underline">
            Quay lại quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/quizzes/${quizId}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{analytics?.quizTitle}</h1>
              <p className="text-sm text-gray-500">Analytics & Responses</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setTab('summary')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === 'summary'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              Tổng quan
            </button>
            <button
              onClick={() => setTab('individual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === 'individual'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              Từng người ({responses.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'summary' ? (
          <SummaryTab analytics={analytics!} totalResponses={responses.length} />
        ) : (
          <IndividualTab responses={responses} quizId={quizId} />
        )}
      </div>
    </div>
  );
}

// ============================================
// Summary Tab - Per-question stats
// ============================================
function SummaryTab({
  analytics,
  totalResponses,
}: {
  analytics: QuizAnalytics;
  totalResponses: number;
}) {
  const { summary } = analytics;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <Users className="w-5 h-5 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{summary.totalAttempts}</div>
          <div className="text-sm text-gray-500">Lượt làm bài</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{summary.averagePercentage}%</div>
          <div className="text-sm text-gray-500">Điểm trung bình</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <Trophy className="w-5 h-5 text-yellow-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{summary.highestScore}</div>
          <div className="text-sm text-gray-500">Điểm cao nhất</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <BarChart3 className="w-5 h-5 text-red-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{summary.lowestScore}</div>
          <div className="text-sm text-gray-500">Điểm thấp nhất</div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Chi tiết từng câu hỏi</h2>

        {analytics.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="font-medium text-gray-900">{q.questionText}</h3>
                  <span className="text-xs text-gray-500">
                    {q.questionType === 'multiple_choice'
                      ? 'Trắc nghiệm'
                      : q.questionType === 'checkboxes'
                      ? 'Nhiều đáp án'
                      : q.questionType === 'dropdown'
                      ? 'Dropdown'
                      : q.questionType === 'short_answer'
                      ? 'Trả lời ngắn'
                      : 'Đoạn văn'}{' '}
                    • {q.points} điểm
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${
                    q.correctPercentage >= 70
                      ? 'text-green-600'
                      : q.correctPercentage >= 40
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {q.correctPercentage}%
                </div>
                <div className="text-xs text-gray-500">đúng</div>
              </div>
            </div>

            {/* Correct / Incorrect bar */}
            {q.totalAnswers > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-4 text-sm mb-2">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {q.correctCount} đúng
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-4 h-4" />
                    {q.incorrectCount} sai
                  </span>
                  <span className="text-gray-500">{q.totalAnswers} trả lời</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${q.correctPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Option distribution */}
            {q.options.length > 0 && q.totalAnswers > 0 && (
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const pct =
                    q.totalAnswers > 0
                      ? Math.round((opt.selectionCount / q.totalAnswers) * 100)
                      : 0;
                  return (
                    <div key={opt.id} className="relative">
                      <div className="flex items-center gap-2 relative z-10 px-3 py-2">
                        {opt.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm flex-1 ${
                            opt.isCorrect ? 'font-medium text-green-700' : 'text-gray-700'
                          }`}
                        >
                          {opt.text}
                        </span>
                        <span className="text-sm text-gray-500">
                          {opt.selectionCount} ({pct}%)
                        </span>
                      </div>
                      <div
                        className={`absolute inset-0 rounded-lg ${
                          opt.isCorrect ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {q.totalAnswers === 0 && (
              <p className="text-sm text-gray-400 italic">Chưa có ai trả lời</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Individual Tab - Per-user responses
// ============================================
function IndividualTab({
  responses,
  quizId,
}: {
  responses: QuizResponse[];
  quizId: number;
}) {
  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có ai làm bài</h3>
        <p className="text-gray-500">Chia sẻ quiz để nhận được responses</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {responses.map((r) => (
        <Link
          key={r.id}
          href={`/quizzes/${quizId}/analytics/${r.id}`}
          className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
            {r.user_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">{r.user_name}</div>
            <div className="text-sm text-gray-500">{r.user_email}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div
              className={`text-lg font-bold ${
                r.percentage >= 70
                  ? 'text-green-600'
                  : r.percentage >= 40
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {r.percentage}%
            </div>
            <div className="text-xs text-gray-500">
              {r.score}/{r.total_points} điểm
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
            <Clock className="w-4 h-4" />
            <span className="text-xs">
              {new Date(r.completed_at).toLocaleDateString('vi-VN')}
            </span>
            <ChevronRight className="w-4 h-4 group-hover:text-blue-500 transition" />
          </div>
        </Link>
      ))}
    </div>
  );
}
