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
  Sparkles,
  ChevronRight,
  Upload,
  Check,
  ClipboardList
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
    day: 'numeric'
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
    case 'lecture': return <BookOpen className="w-5 h-5 text-indigo-400" />;
    case 'exercise': return <FileCode className="w-5 h-5 text-emerald-400" />;
    case 'exam': return <FileText className="w-5 h-5 text-rose-400" />;
    default: return <File className="w-5 h-5 text-slate-400" />;
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

  // Available Quizzes State
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);

  // Tabs Filter
  const [activeTab, setActiveTab] = useState('all');

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
        const [subjectRes, docsRes, quizRes] = await Promise.all([
          fetch(`http://localhost:8000/api/v1/subject/${subjectId}`),
          fetch(`http://localhost:8000/api/v1/document/featured-subject/${subjectId}`),
          fetch(`http://localhost:8000/api/v1/quiz/get-quiz-by-subject/${subjectId}`)
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

        if (quizRes.ok) {
          const quizData = await quizRes.json();
          if (Array.isArray(quizData)) {
            setAvailableQuizzes(quizData);
          }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-400 font-medium">Đang tải thông tin môn học...</p>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
        <div className="text-center max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 relative z-10">
          <XCircle className="h-16 w-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Không tìm thấy môn học</h2>
          <p className="text-slate-400 mb-8">{error || 'Môn học không tồn tại hoặc đã bị xóa.'}</p>
          <Link
            href="/subject"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Về danh sách môn học
          </Link>
        </div>
      </div>
    );
  }

  const filteredDocs = activeTab === 'all' 
    ? featuredDocs 
    : featuredDocs.filter(doc => doc.doc_type === activeTab);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Breadcrumb & Header Hero (StuDocu Style) */}
        <div className="mb-10">
          <nav className="flex flex-wrap items-center text-sm text-slate-400 gap-2 mb-4 font-medium">
            <Link href="/" className="hover:text-indigo-400 transition-colors">EduLearn</Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <Link href="/subject" className="hover:text-indigo-400 transition-colors">Môn học</Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-300 truncate">{subject.university_name}</span>
          </nav>
          
          <div className="bg-gradient-to-br from-[#131A2B] to-[#1A2235] border border-white/10 rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold uppercase tracking-widest mb-4">
                  {subject.subject_code}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                  {subject.subject_name}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-400" />
                    <span className="font-semibold text-slate-300">{subject.university_name}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-fuchsia-400" />
                    <span className="font-semibold text-slate-300">{featuredDocs.length} Tài liệu</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-400" />
                    <span>Thêm ngày {formatDate(subject.created_at)}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex-shrink-0 w-full md:w-auto">
                <Link
                  href="/document/upload"
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-200 transition-all font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
                >
                  <Upload className="h-5 w-5" />
                  Tải lên tài liệu
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">

          {/* Left Column: Documents List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#131A2B] rounded-3xl border border-white/10 p-6 shadow-xl">
              
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 mb-6 pb-6 border-b border-white/10">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'lecture', label: 'Bài giảng' },
                  { id: 'exercise', label: 'Bài tập' },
                  { id: 'exam', label: 'Đề thi' },
                  { id: 'quiz', label: 'Trắc nghiệm' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)} 
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      activeTab === tab.id 
                        ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Documents & Quizzes Rows */}
              <div className="space-y-3">
                
                {/* Render Quizzes if activeTab is 'all' or 'quiz' */}
                {(activeTab === 'all' || activeTab === 'quiz') && availableQuizzes.map(quiz => (
                  <div key={`quiz-${quiz.quiz_id}`} className="group flex items-center gap-4 bg-[#0B0F19] rounded-2xl p-4 border border-white/5 hover:border-emerald-500/50 transition-all cursor-pointer relative overflow-hidden">
                    <div className="flex-shrink-0 ml-2 w-5 h-5"></div>
                    
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <ClipboardList className="w-5 h-5 text-emerald-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-bold text-white text-base truncate group-hover:text-emerald-400 transition-colors">
                        {quiz.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-400">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">Bài trắc nghiệm</span>
                        <span>•</span>
                        <span>{quiz.question_count} câu hỏi</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity md:block hidden">
                      <Link
                        href={`/quizzes/${quiz.quiz_id}`}
                        className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                      >
                        Làm bài <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Render Docs if activeTab is not 'quiz' */}
                {activeTab !== 'quiz' && filteredDocs.map(doc => (
                    <div
                      key={`doc-${doc.id}`}
                      onClick={() => toggleDocSelection(doc.id)}
                      className={`group flex items-center gap-4 bg-[#0B0F19] rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden ${
                        selectedDocs.includes(doc.id)
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                          : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex-shrink-0 ml-2">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          selectedDocs.includes(doc.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-500 bg-[#131A2B]'
                        }`}>
                          {selectedDocs.includes(doc.id) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:scale-110 transition-transform">
                        {getDocIcon(doc.doc_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-bold text-white text-base truncate group-hover:text-indigo-300 transition-colors">
                          {doc.file_name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-400">
                          <span className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5">{getTypeLabel(doc.doc_type)}</span>
                          <span>•</span>
                          <span>{formatBytes(doc.file_size)}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity md:block hidden">
                        <Link
                          href={`/search/${doc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 bg-white/10 text-white hover:bg-indigo-500 hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                ))}

                {/* Empty State */}
                {((activeTab === 'quiz' && availableQuizzes.length === 0) || 
                  (activeTab !== 'quiz' && filteredDocs.length === 0 && (activeTab !== 'all' || availableQuizzes.length === 0))) && (
                  <div className="py-16 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                      <FileText className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-medium text-lg">Chưa có tài liệu hay bài tập nào trong thư mục này.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar (AI Quiz Widget) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Thẻ Tạo Quiz AI */}
              <div className="bg-[#131A2B] rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none group-hover:bg-fuchsia-500/20 transition-colors"></div>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="p-3 bg-fuchsia-500/20 rounded-xl border border-fuchsia-500/30 shadow-inner">
                  <Sparkles className="w-6 h-6 text-fuchsia-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Tạo Quiz AI</h3>
              </div>

              <p className="text-slate-400 text-sm mb-8 leading-relaxed relative z-10">
                Tích chọn tài liệu ở danh sách bên trái. Trí tuệ nhân tạo (AI) sẽ tự động phân tích nội dung và sinh ra bộ câu hỏi trắc nghiệm ôn tập cho bạn.
              </p>

              <div className="space-y-5 mb-8 relative z-10">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Tài liệu đã chọn
                  </label>
                  <div className="text-sm bg-[#0B0F19] p-4 rounded-xl border border-white/5 shadow-inner">
                    {selectedDocs.length === 0 ? (
                      <span className="text-slate-500 font-medium block text-center">Chưa có tài liệu nào được chọn</span>
                    ) : (
                      <div className="flex items-center gap-3 text-fuchsia-400 font-bold justify-center">
                        <Check className="w-5 h-5" />
                        <span>Đã chọn {selectedDocs.length} tài liệu</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Số lượng câu hỏi
                  </label>
                  <input
                    type="number"
                    min="1" max="50"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Độ khó
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all shadow-inner appearance-none"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Ghi chú thêm (tùy chọn)
                  </label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Ví dụ: Tập trung vào chương 1 và 2..."
                    className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all h-24 resize-none shadow-inner placeholder-slate-600 custom-scrollbar"
                  />
                </div>
              </div>

              {quizError && (
                <div className="mb-6 text-sm text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 flex items-start gap-3 relative z-10">
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{quizError}</span>
                </div>
              )}

              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || selectedDocs.length === 0}
                className={`flex items-center justify-center gap-3 w-full px-6 py-4 text-sm font-bold text-white rounded-xl transition-all relative z-10
                   ${isGenerating || selectedDocs.length === 0
                    ? 'bg-white/10 opacity-50 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)]'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tạo Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Tạo Quiz Ngay
                  </>
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-white/10 text-center relative z-10">
                <Link
                  href={`/quizzes`}
                  className="text-sm font-bold text-slate-400 hover:text-fuchsia-400 transition-colors flex items-center justify-center gap-2"
                >
                  Danh sách Quiz của tôi <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
