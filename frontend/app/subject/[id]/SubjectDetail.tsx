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
  ClipboardList,
  Layers
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
    case 'lecture': return <BookOpen className="w-5 h-5 text-indigo-600" />;
    case 'exercise': return <FileCode className="w-5 h-5 text-emerald-600" />;
    case 'exam': return <FileText className="w-5 h-5 text-rose-600" />;
    default: return <File className="w-5 h-5 text-slate-600" />;
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
  
  // Available Flashcards State
  const [availableFlashcards, setAvailableFlashcards] = useState<any[]>([]);

  // Tabs Filter
  const [activeTab, setActiveTab] = useState('all');

  // Generator Tabs
  const [activeGeneratorTab, setActiveGeneratorTab] = useState<'quiz' | 'flashcard'>('quiz');

  // Quiz Form States
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  
  // Flashcard Form States
  const [numFlashcards, setNumFlashcards] = useState(10);
  
  // Common Form States
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState('');

  useEffect(() => {
    if (!subjectId) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [subjectRes, docsRes, quizRes, flashcardRes] = await Promise.all([
          fetch(`http://localhost:8000/api/v1/subject/${subjectId}`),
          fetch(`http://localhost:8000/api/v1/document/featured-subject/${subjectId}`),
          fetch(`http://localhost:8000/api/v1/quiz/get-quiz-by-subject/${subjectId}`),
          fetch(`http://localhost:8000/api/v1/flashcard/get-flashcard-set-by-subject/${subjectId}`)
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

        if (flashcardRes.ok) {
          const flashcardData = await flashcardRes.json();
          if (Array.isArray(flashcardData)) {
            setAvailableFlashcards(flashcardData);
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
    setGeneratorError('');

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
      setGeneratorError(err.message || 'Lỗi kết nối đến máy chủ.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFlashcard = async () => {
    if (selectedDocs.length === 0) return;

    setIsGenerating(true);
    setGeneratorError('');

    try {
      const response = await fetch('http://localhost:8000/api/v1/flashcard/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_ids: selectedDocs,
          num_flashcards: numFlashcards,
          additional_context: additionalContext || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Có lỗi xảy ra khi tạo flashcard.');
      }

      const data = await response.json();
      if (data.success && data.flashcard_set_id) {
        router.push(`/flashcards/${data.flashcard_set_id}`);
      } else {
        throw new Error('Đã tạo flashcard nhưng không nhận được ID hợp lệ.');
      }
    } catch (err: any) {
      setGeneratorError(err.message || 'Lỗi kết nối đến máy chủ.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 font-medium">Đang tải thông tin môn học...</p>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
        <div className="text-center max-w-md w-full bg-white backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200 relative z-10">
          <XCircle className="h-16 w-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Không tìm thấy môn học</h2>
          <p className="text-slate-600 mb-8">{error || 'Môn học không tồn tại hoặc đã bị xóa.'}</p>
          <Link
            href="/subject"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 rounded-xl transition-colors font-medium"
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
          <nav className="flex flex-wrap items-center text-sm text-slate-600 gap-2 mb-4 font-medium">
            <Link href="/" className="hover:text-indigo-600 transition-colors">EduLearn</Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <Link href="/subject" className="hover:text-indigo-600 transition-colors">Môn học</Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-700 truncate">{subject.university_name}</span>
          </nav>
          
          <div className="bg-gradient-to-br from-white to-indigo-50/50 border border-slate-200 rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold uppercase tracking-widest mb-4">
                  {subject.subject_code}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                  {subject.subject_name}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-slate-700">{subject.university_name}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-fuchsia-600" />
                    <span className="font-semibold text-slate-700">{featuredDocs.length} Tài liệu</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
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
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl">
              
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 mb-6 pb-6 border-b border-slate-200">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'lecture', label: 'Bài giảng' },
                  { id: 'exercise', label: 'Bài tập' },
                  { id: 'exam', label: 'Đề thi' },
                  { id: 'quiz', label: 'Trắc nghiệm' },
                  { id: 'flashcard', label: 'Flashcard' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)} 
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      activeTab === tab.id 
                        ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                  <div key={`quiz-${quiz.quiz_id}`} className="group flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-emerald-500/50 transition-all cursor-pointer relative overflow-hidden">
                    <div className="flex-shrink-0 ml-2 w-5 h-5"></div>
                    
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 group-hover:scale-110 transition-transform">
                      <ClipboardList className="w-5 h-5 text-emerald-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-emerald-600 transition-colors">
                        {quiz.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-600">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-200">Bài trắc nghiệm</span>
                        <span>•</span>
                        <span>{quiz.question_count} câu hỏi</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity md:block hidden">
                      <Link
                        href={`/quizzes/${quiz.quiz_id}`}
                        className="px-4 py-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg text-sm font-bold transition-all shadow-md flex items-center gap-2"
                      >
                        Làm bài <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Render Flashcards if activeTab is 'all' or 'flashcard' */}
                {(activeTab === 'all' || activeTab === 'flashcard') && availableFlashcards.map(fset => (
                  <div key={`flashcard-${fset.flashcard_set_id}`} className="group flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-fuchsia-500/50 transition-all cursor-pointer relative overflow-hidden">
                    <div className="flex-shrink-0 ml-2 w-5 h-5"></div>
                    
                    <div className="p-3 bg-fuchsia-50 rounded-xl border border-fuchsia-200 group-hover:scale-110 transition-transform">
                      <Layers className="w-5 h-5 text-fuchsia-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-fuchsia-600 transition-colors">
                        {fset.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-600">
                        <span className="px-2 py-0.5 bg-fuchsia-50 text-fuchsia-600 rounded-md border border-fuchsia-200">Bộ Flashcard</span>
                        <span>•</span>
                        <span>{fset.flashcard_count} thẻ</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity md:block hidden">
                      <Link
                        href={`/flashcards/${fset.flashcard_set_id}`}
                        className="px-4 py-2 bg-fuchsia-600/20 text-fuchsia-600 hover:bg-fuchsia-500 hover:text-white rounded-lg text-sm font-bold transition-all shadow-md flex items-center gap-2"
                      >
                        Học thẻ <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Render Docs if activeTab is not 'quiz' and not 'flashcard' */}
                {activeTab !== 'quiz' && activeTab !== 'flashcard' && filteredDocs.map(doc => (
                    <div
                      key={`doc-${doc.id}`}
                      onClick={() => toggleDocSelection(doc.id)}
                      className={`group flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden ${
                        selectedDocs.includes(doc.id)
                          ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                          : 'border-slate-100 hover:border-white/20 hover:bg-white'
                      }`}
                    >
                      <div className="flex-shrink-0 ml-2">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          selectedDocs.includes(doc.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-500 bg-white'
                        }`}>
                          {selectedDocs.includes(doc.id) && <Check className="w-3.5 h-3.5 text-slate-900" />}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-white rounded-xl border border-slate-100 group-hover:scale-110 transition-transform">
                        {getDocIcon(doc.doc_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-700 transition-colors">
                          {doc.file_name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-600">
                          <span className="px-2 py-0.5 bg-white rounded-md border border-slate-100">{getTypeLabel(doc.doc_type)}</span>
                          <span>•</span>
                          <span>{formatBytes(doc.file_size)}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity md:block hidden">
                        <Link
                          href={`/search/${doc.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 bg-slate-100 text-slate-900 hover:bg-indigo-500 hover:text-white rounded-lg text-sm font-bold transition-all shadow-md"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                ))}

                {/* Empty State */}
                {((activeTab === 'quiz' && availableQuizzes.length === 0) || 
                  (activeTab === 'flashcard' && availableFlashcards.length === 0) ||
                  (activeTab !== 'quiz' && activeTab !== 'flashcard' && filteredDocs.length === 0 && (activeTab !== 'all' || (availableQuizzes.length === 0 && availableFlashcards.length === 0)))) && (
                  <div className="py-16 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <FileText className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-600 font-medium text-lg">Chưa có tài liệu hay bài tập nào trong thư mục này.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar (AI Quiz Widget) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* AI Generator Widget */}
              <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-colors ${
                  activeGeneratorTab === 'quiz' ? 'bg-fuchsia-50 group-hover:bg-fuchsia-100' : 'bg-emerald-50 group-hover:bg-emerald-500/20'
                }`}></div>
              
              {/* Generator Tabs */}
              <div className="flex bg-slate-50 rounded-xl p-1 mb-8 relative z-10 border border-slate-100">
                <button
                  onClick={() => setActiveGeneratorTab('quiz')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                    activeGeneratorTab === 'quiz' 
                      ? 'bg-fuchsia-100 text-fuchsia-600 shadow-md' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tạo Quiz
                </button>
                <button
                  onClick={() => setActiveGeneratorTab('flashcard')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                    activeGeneratorTab === 'flashcard' 
                      ? 'bg-emerald-500/20 text-emerald-600 shadow-md' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tạo Flashcard
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className={`p-3 rounded-xl border shadow-inner ${
                  activeGeneratorTab === 'quiz' 
                    ? 'bg-fuchsia-100 border-fuchsia-300' 
                    : 'bg-emerald-500/20 border-emerald-300'
                }`}>
                  <Sparkles className={`w-6 h-6 ${
                    activeGeneratorTab === 'quiz' ? 'text-fuchsia-600' : 'text-emerald-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Tạo {activeGeneratorTab === 'quiz' ? 'Quiz' : 'Flashcard'} AI
                </h3>
              </div>

              <p className="text-slate-600 text-sm mb-8 leading-relaxed relative z-10">
                Tích chọn tài liệu ở danh sách bên trái. Trí tuệ nhân tạo (AI) sẽ tự động phân tích nội dung và sinh ra {activeGeneratorTab === 'quiz' ? 'bộ câu hỏi trắc nghiệm' : 'bộ thẻ flashcard'} ôn tập cho bạn.
              </p>

              <div className="space-y-5 mb-8 relative z-10">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tài liệu đã chọn
                  </label>
                  <div className="text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                    {selectedDocs.length === 0 ? (
                      <span className="text-slate-500 font-medium block text-center">Chưa có tài liệu nào được chọn</span>
                    ) : (
                      <div className={`flex items-center gap-3 font-bold justify-center ${
                        activeGeneratorTab === 'quiz' ? 'text-fuchsia-600' : 'text-emerald-600'
                      }`}>
                        <Check className="w-5 h-5" />
                        <span>Đã chọn {selectedDocs.length} tài liệu</span>
                      </div>
                    )}
                  </div>
                </div>

                {activeGeneratorTab === 'quiz' ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Số lượng câu hỏi
                      </label>
                      <input
                        type="number"
                        min="1" max="50"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:border-transparent outline-none transition-all shadow-inner focus:ring-fuchsia-500`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Độ khó
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all shadow-inner appearance-none"
                      >
                        <option value="easy">Dễ</option>
                        <option value="medium">Trung bình</option>
                        <option value="hard">Khó</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Số lượng thẻ flashcard
                    </label>
                    <input
                      type="number"
                      min="1" max="50"
                      value={numFlashcards}
                      onChange={(e) => setNumFlashcards(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-inner"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Ghi chú thêm (tùy chọn)
                  </label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Ví dụ: Tập trung vào chương 1 và 2..."
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:border-transparent outline-none transition-all h-24 resize-none shadow-inner placeholder-slate-600 custom-scrollbar ${
                      activeGeneratorTab === 'quiz' ? 'focus:ring-fuchsia-500' : 'focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {generatorError && (
                <div className="mb-6 text-sm text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-200 flex items-start gap-3 relative z-10">
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{generatorError}</span>
                </div>
              )}

              <button
                onClick={activeGeneratorTab === 'quiz' ? handleGenerateQuiz : handleGenerateFlashcard}
                disabled={isGenerating || selectedDocs.length === 0}
                className={`flex items-center justify-center gap-3 w-full px-6 py-4 text-sm font-bold text-slate-900 rounded-xl transition-all relative z-10
                   ${isGenerating || selectedDocs.length === 0
                    ? 'bg-slate-100 opacity-50 cursor-not-allowed border border-slate-100'
                    : activeGeneratorTab === 'quiz'
                      ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)]'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tạo {activeGeneratorTab === 'quiz' ? 'Quiz' : 'Flashcard'}...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Tạo {activeGeneratorTab === 'quiz' ? 'Quiz' : 'Flashcard'} Ngay
                  </>
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col gap-3 text-center relative z-10">
                <Link
                  href={`/quizzes`}
                  className="text-sm font-bold text-slate-600 hover:text-fuchsia-600 transition-colors flex items-center justify-center gap-2"
                >
                  Danh sách Quiz của tôi <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/flashcards`}
                  className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  Danh sách Flashcard của tôi <ArrowRight className="w-4 h-4" />
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
