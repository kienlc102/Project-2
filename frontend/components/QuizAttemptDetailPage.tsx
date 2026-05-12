'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  User,
  Clock,
  Trophy,
} from 'lucide-react';
import { getResponseDetail } from '@/lib/quizzes';
import { getToken } from '@/lib/auth';

export default function ResponseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = parseInt(params.id as string);
  const attemptId = parseInt(params.attemptId as string);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [quizId, attemptId]);

  const loadData = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await getResponseDetail(token, quizId, attemptId);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Không tìm thấy response');
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">{error}</p>
          <Link href={`/quizzes/${quizId}/analytics`} className="text-blue-600 hover:underline">
            Quay lại analytics
          </Link>
        </div>
      </div>
    );
  }

  const { attempt, answers } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/quizzes/${quizId}/analytics`}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại analytics
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
              {attempt.user_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{attempt.user_name}</h1>
              <p className="text-sm text-gray-500">{attempt.user_email}</p>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${
                  attempt.percentage >= 70
                    ? 'text-green-600'
                    : attempt.percentage >= 40
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {attempt.percentage}%
              </div>
              <div className="text-sm text-gray-500">
                {attempt.score}/{attempt.total_points} điểm
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(attempt.completed_at).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {answers.map((a: any, idx: number) => (
          <div
            key={idx}
            className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
              a.is_correct ? 'border-l-green-500' : 'border-l-red-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="font-medium text-gray-900">{a.question_text}</h3>
                  <span className="text-xs text-gray-500">
                    {a.question_type === 'multiple_choice'
                      ? 'Trắc nghiệm'
                      : a.question_type === 'checkboxes'
                      ? 'Nhiều đáp án'
                      : a.question_type === 'dropdown'
                      ? 'Dropdown'
                      : a.question_type === 'short_answer'
                      ? 'Trả lời ngắn'
                      : 'Đoạn văn'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {a.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-medium text-gray-600">
                  {a.points_earned}/{a.max_points}
                </span>
              </div>
            </div>

            {/* Show options */}
            {a.options && a.options.length > 0 && (
              <div className="ml-9 space-y-1.5">
                {a.options.map((opt: any) => {
                  const wasSelected = a.selected_option_ids?.includes(opt.id);
                  const isCorrectOpt = opt.is_correct;

                  let bgClass = 'bg-gray-50';
                  let textClass = 'text-gray-600';
                  let icon = null;

                  if (wasSelected && isCorrectOpt) {
                    bgClass = 'bg-green-50';
                    textClass = 'text-green-700';
                    icon = <CheckCircle2 className="w-4 h-4 text-green-500" />;
                  } else if (wasSelected && !isCorrectOpt) {
                    bgClass = 'bg-red-50';
                    textClass = 'text-red-700';
                    icon = <XCircle className="w-4 h-4 text-red-500" />;
                  } else if (!wasSelected && isCorrectOpt) {
                    bgClass = 'bg-green-50/50';
                    textClass = 'text-green-600';
                    icon = <CheckCircle2 className="w-4 h-4 text-green-400" />;
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`px-3 py-2 rounded-lg ${bgClass} flex items-center gap-2`}
                    >
                      {icon || <div className="w-4 h-4" />}
                      <span className={`text-sm ${textClass}`}>{opt.option_text}</span>
                      {wasSelected && (
                        <span className="text-xs text-gray-400 ml-auto">Đã chọn</span>
                      )}
                      {!wasSelected && isCorrectOpt && (
                        <span className="text-xs text-green-500 ml-auto">Đáp án đúng</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Text answer */}
            {a.text_answer && (
              <div className="ml-9 mt-2">
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700">
                  {a.text_answer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
