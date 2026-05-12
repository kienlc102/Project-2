'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/auth';
import { createQuiz, uploadQuizImage } from '@/lib/quizzes';
import {
  ArrowLeft, Plus, Trash2, Image as ImageIcon, X, Globe, Lock,
  Copy, GripVertical, Loader2, ChevronDown, Check, Circle,
  Square, AlignLeft, List, ChevronUp, ToggleLeft, ToggleRight,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface QuizOptionDraft {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestionDraft {
  id: string;
  text: string;
  type: 'multiple_choice' | 'checkboxes' | 'short_answer' | 'paragraph' | 'dropdown';
  imageUrl: string;
  imagePreview: string;
  isRequired: boolean;
  points: number;
  options: QuizOptionDraft[];
}

// ============================================
// HELPERS
// ============================================
const genId = () => Math.random().toString(36).substring(2, 11);
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const QUESTION_TYPES: { value: QuizQuestionDraft['type']; label: string; icon: LucideIcon }[] = [
  { value: 'multiple_choice', label: 'Trắc nghiệm', icon: Circle },
  { value: 'checkboxes', label: 'Hộp kiểm', icon: Square },
  { value: 'dropdown', label: 'Danh sách thả xuống', icon: List },
  { value: 'short_answer', label: 'Trả lời ngắn', icon: AlignLeft },
  { value: 'paragraph', label: 'Đoạn văn', icon: AlignLeft },
];

function defaultOption(index: number): QuizOptionDraft {
  return { id: genId(), text: `Lựa chọn ${index + 1}`, isCorrect: false };
}

function defaultQuestion(): QuizQuestionDraft {
  return {
    id: genId(),
    text: '',
    type: 'multiple_choice',
    imageUrl: '',
    imagePreview: '',
    isRequired: false,
    points: 1,
    options: [defaultOption(0), defaultOption(1)],
  };
}

// ============================================
// COMPONENT
// ============================================
export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([defaultQuestion()]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close type dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (typeDropdownOpen) setTypeDropdownOpen(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [typeDropdownOpen]);

  // ---- Question Operations ----
  const addQuestion = (afterIndex?: number) => {
    const newQ = defaultQuestion();
    setQuestions((prev) => {
      const idx = afterIndex !== undefined ? afterIndex + 1 : prev.length;
      const next = [...prev];
      next.splice(idx, 0, newQ);
      return next;
    });
    setActiveId(newQ.id);
    setTimeout(() => {
      questionRefs.current[newQ.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const duplicateQuestion = (id: string) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      const dup: QuizQuestionDraft = {
        ...original,
        id: genId(),
        options: original.options.map((o) => ({ ...o, id: genId() })),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next;
    });
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestionDraft>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
      return next;
    });
  };

  // ---- Type change ----
  const changeQuestionType = (questionId: string, newType: QuizQuestionDraft['type']) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const needsOptions = ['multiple_choice', 'checkboxes', 'dropdown'].includes(newType);
        const hadOptions = ['multiple_choice', 'checkboxes', 'dropdown'].includes(q.type);
        return {
          ...q,
          type: newType,
          options: needsOptions
            ? hadOptions && q.options.length >= 2
              ? q.options
              : [defaultOption(0), defaultOption(1)]
            : q.options,
        };
      })
    );
    setTypeDropdownOpen(null);
  };

  // ---- Option Operations ----
  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return { ...q, options: [...q.options, defaultOption(q.options.length)] };
      })
    );
  };

  const updateOption = (questionId: string, optionId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
        };
      })
    );
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if (q.options.length <= 2) return q;
        return { ...q, options: q.options.filter((o) => o.id !== optionId) };
      })
    );
  };

  const toggleCorrect = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if (q.type === 'multiple_choice' || q.type === 'dropdown') {
          // Only one correct answer
          return {
            ...q,
            options: q.options.map((o) => ({
              ...o,
              isCorrect: o.id === optionId ? !o.isCorrect : false,
            })),
          };
        } else {
          // Checkboxes - multiple correct
          return {
            ...q,
            options: q.options.map((o) =>
              o.id === optionId ? { ...o, isCorrect: !o.isCorrect } : o
            ),
          };
        }
      })
    );
  };

  // ---- Image Upload ----
  const handleImageUpload = async (questionId: string, file: File) => {
    const token = getToken();
    if (!token) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File ảnh quá lớn (tối đa 5MB)');
      return;
    }
    setUploadingId(questionId);
    try {
      const res = await uploadQuizImage(token, file);
      if (res.success && res.data) {
        const previewUrl = URL.createObjectURL(file);
        updateQuestion(questionId, {
          imageUrl: res.data.url,
          imagePreview: previewUrl,
        });
      } else {
        setError(res.message || 'Lỗi tải ảnh');
      }
    } catch {
      setError('Lỗi tải ảnh');
    }
    setUploadingId(null);
  };

  const removeImage = (questionId: string) => {
    updateQuestion(questionId, { imageUrl: '', imagePreview: '' });
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề quiz');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Câu hỏi ${i + 1}: Vui lòng nhập nội dung câu hỏi`);
        setActiveId(q.id);
        return;
      }
      if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.type)) {
        if (q.options.length < 2) {
          setError(`Câu hỏi ${i + 1}: Cần ít nhất 2 lựa chọn`);
          setActiveId(q.id);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text.trim()) {
            setError(`Câu hỏi ${i + 1}, Lựa chọn ${j + 1}: Nội dung không được để trống`);
            setActiveId(q.id);
            return;
          }
        }
        const correctCount = q.options.filter((o) => o.isCorrect).length;
        if (['multiple_choice', 'dropdown'].includes(q.type) && correctCount !== 1) {
          setError(`Câu hỏi ${i + 1}: Vui lòng chọn đúng 1 đáp án đúng`);
          setActiveId(q.id);
          return;
        }
        if (q.type === 'checkboxes' && correctCount < 1) {
          setError(`Câu hỏi ${i + 1}: Vui lòng chọn ít nhất 1 đáp án đúng`);
          setActiveId(q.id);
          return;
        }
      }
    }

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setSaving(true);
    try {
      const res = await createQuiz(token, {
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        questions: questions.map((q) => ({
          questionText: q.text,
          questionType: q.type,
          imageUrl: q.imageUrl || undefined,
          isRequired: q.isRequired,
          points: q.points,
          options: ['multiple_choice', 'checkboxes', 'dropdown'].includes(q.type)
            ? q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
            : undefined,
        })),
      });

      if (res.success) {
        router.push(`/quizzes/${res.data.id}`);
      } else {
        setError(res.message || 'Lỗi tạo quiz');
      }
    } catch {
      setError('Lỗi kết nối máy chủ');
    }
    setSaving(false);
  };

  // ---- Render helpers ----
  const currentTypeInfo = (type: QuizQuestionDraft['type']) =>
    QUESTION_TYPES.find((t) => t.value === type)!;

  const hasOptions = (type: QuizQuestionDraft['type']) =>
    ['multiple_choice', 'checkboxes', 'dropdown'].includes(type);

  const OptionIcon = ({ type, isCorrect }: { type: QuizQuestionDraft['type']; isCorrect: boolean }) => {
    if (type === 'checkboxes') {
      return isCorrect ? (
        <div className="w-[18px] h-[18px] rounded-sm bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
      ) : (
        <div className="w-[18px] h-[18px] rounded-sm border-2 border-gray-400 flex-shrink-0" />
      );
    }
    if (type === 'dropdown') {
      return null;
    }
    // Multiple choice
    return isCorrect ? (
      <div className="w-[18px] h-[18px] rounded-full border-2 border-blue-600 flex items-center justify-center flex-shrink-0">
        <div className="w-[10px] h-[10px] rounded-full bg-blue-600" />
      </div>
    ) : (
      <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-400 flex-shrink-0" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/quizzes" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-800">Tạo Quiz mới</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                visibility === 'public'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
              }`}
            >
              {visibility === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {visibility === 'public' ? 'Công khai' : 'Riêng tư'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ====== TITLE CARD (Google Forms style - top colored border) ====== */}
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
          onClick={() => setActiveId('title')}
        >
          <div className="h-[10px] bg-blue-600 rounded-t-lg" />
          <div className={`p-6 ${activeId === 'title' ? 'border-l-[6px] border-l-blue-600' : 'border-l-[6px] border-l-transparent'}`}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz không có tiêu đề"
              className="w-full text-2xl font-normal border-b border-gray-300 focus:border-b-2 focus:border-blue-600 pb-2 outline-none transition placeholder:text-gray-400"
              onFocus={() => setActiveId('title')}
              maxLength={255}
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả quiz"
              className="w-full mt-3 text-sm border-b border-gray-300 focus:border-b-2 focus:border-blue-600 pb-2 outline-none transition placeholder:text-gray-400"
              onFocus={() => setActiveId('title')}
            />
          </div>
        </div>

        {/* ====== QUESTION CARDS ====== */}
        {questions.map((question, qIndex) => {
          const isActive = activeId === question.id;
          const typeInfo = currentTypeInfo(question.type);

          return (
            <div key={question.id} className="relative flex gap-2">
              {/* Main Question Card */}
              <div
                ref={(el) => { questionRefs.current[question.id] = el; }}
                className={`flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-shadow ${
                  isActive ? 'shadow-md' : ''
                }`}
                onClick={() => setActiveId(question.id)}
              >
                <div className={`${isActive ? 'border-l-[6px] border-l-blue-600' : 'border-l-[6px] border-l-transparent'}`}>
                  <div className="p-6 pb-0">
                    {/* Question Header: Text + Type Selector */}
                    <div className="flex gap-3 items-start">
                      {/* Question Input */}
                      <div className="flex-1">
                        {isActive ? (
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                            placeholder="Câu hỏi"
                            className="w-full text-base bg-gray-50 border-b border-gray-300 focus:border-b-2 focus:border-blue-600 px-3 py-3 outline-none transition placeholder:text-gray-400 rounded-t-md"
                            autoFocus
                          />
                        ) : (
                          <p className="text-base text-gray-800 py-2">
                            {question.text || <span className="text-gray-400">Câu hỏi</span>}
                            {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                          </p>
                        )}
                      </div>

                      {/* Type Selector (dropdown) */}
                      {isActive && (
                        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm transition min-w-[180px] justify-between"
                            onClick={() => setTypeDropdownOpen(typeDropdownOpen === question.id ? null : question.id)}
                          >
                            <div className="flex items-center gap-2">
                              <typeInfo.icon className="w-4 h-4 text-gray-600" />
                              <span>{typeInfo.label}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </button>
                          {typeDropdownOpen === question.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] py-1">
                              {QUESTION_TYPES.map((t) => (
                                <button
                                  key={t.value}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition ${
                                    question.type === t.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                  }`}
                                  onClick={() => changeQuestionType(question.id, t.value)}
                                >
                                  <t.icon className="w-4 h-4" />
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Image Upload Button & Preview */}
                    {isActive && !question.imagePreview && !question.imageUrl && (
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          ref={(el) => { fileInputRefs.current[question.id] = el; }}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(question.id, file);
                            e.target.value = '';
                          }}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); fileInputRefs.current[question.id]?.click(); }}
                          disabled={uploadingId === question.id}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition py-1"
                        >
                          {uploadingId === question.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                          Thêm hình ảnh
                        </button>
                      </div>
                    )}

                    {/* Image Preview */}
                    {(question.imagePreview || question.imageUrl) && (
                      <div className="mt-3 relative inline-block">
                        <img
                          src={question.imagePreview || `${API_BASE}${question.imageUrl}`}
                          alt="Question"
                          className="max-h-48 w-auto rounded-lg border border-gray-200 object-contain"
                        />
                        {isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeImage(question.id); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* ---- OPTIONS AREA ---- */}
                    <div className="mt-4">
                      {hasOptions(question.type) ? (
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <div key={option.id} className="flex items-center gap-3 group">
                              {/* Option Icon (radio/checkbox) or dropdown number */}
                              {question.type === 'dropdown' ? (
                                <span className="text-sm text-gray-500 w-5 text-right flex-shrink-0">
                                  {oIndex + 1}.
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleCorrect(question.id, option.id); }}
                                  className="flex-shrink-0 hover:opacity-80 transition"
                                  title={option.isCorrect ? 'Đáp án đúng' : 'Đánh dấu đáp án đúng'}
                                >
                                  <OptionIcon type={question.type} isCorrect={option.isCorrect} />
                                </button>
                              )}

                              {/* Option Text */}
                              {isActive ? (
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                                  className="flex-1 border-b border-gray-200 focus:border-blue-600 py-1.5 outline-none text-sm transition"
                                  placeholder={`Lựa chọn ${oIndex + 1}`}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="flex-1 text-sm text-gray-700 py-1.5">{option.text}</span>
                              )}

                              {/* Correct checkmark for dropdown type */}
                              {question.type === 'dropdown' && isActive && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleCorrect(question.id, option.id); }}
                                  className={`p-1 rounded transition ${option.isCorrect ? 'text-green-600' : 'text-gray-300 hover:text-green-500'}`}
                                  title={option.isCorrect ? 'Đáp án đúng' : 'Đánh dấu đáp án đúng'}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}

                              {/* Remove Option */}
                              {isActive && question.options.length > 2 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeOption(question.id, option.id); }}
                                  className="p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Add Option */}
                          {isActive && (
                            <button
                              onClick={(e) => { e.stopPropagation(); addOption(question.id); }}
                              className="flex items-center gap-3 text-sm text-gray-400 hover:text-blue-600 py-1.5 transition mt-1"
                            >
                              {question.type === 'dropdown' ? (
                                <span className="w-5 text-right text-gray-400 flex-shrink-0">
                                  {question.options.length + 1}.
                                </span>
                              ) : question.type === 'checkboxes' ? (
                                <div className="w-[18px] h-[18px] rounded-sm border-2 border-gray-300 flex-shrink-0" />
                              ) : (
                                <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 flex-shrink-0" />
                              )}
                              <span>Thêm lựa chọn</span>
                            </button>
                          )}
                        </div>
                      ) : question.type === 'short_answer' ? (
                        <div className="border-b border-dotted border-gray-300 pb-1">
                          <span className="text-sm text-gray-400">Văn bản câu trả lời ngắn</span>
                        </div>
                      ) : (
                        <div className="border-b border-dotted border-gray-300 pb-1 mb-2">
                          <span className="text-sm text-gray-400">Văn bản câu trả lời dài</span>
                          <div className="border-b border-dotted border-gray-300 mt-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ---- BOTTOM TOOLBAR (Google Forms style) ---- */}
                  {isActive && (
                    <div className="px-6 py-3 mt-4 border-t border-gray-200">
                      <div className="flex items-center justify-end gap-1">
                        {/* Duplicate */}
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateQuestion(question.id); }}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                          title="Sao chép"
                        >
                          <Copy className="w-5 h-5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}
                          disabled={questions.length <= 1}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Xóa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        {/* Divider */}
                        <div className="w-px h-8 bg-gray-200 mx-2" />

                        {/* Required Toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Bắt buộc</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuestion(question.id, { isRequired: !question.isRequired });
                            }}
                            className={`relative w-10 h-6 rounded-full transition-colors ${
                              question.isRequired ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                question.isRequired ? 'translate-x-[18px]' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-8 bg-gray-200 mx-2" />

                        {/* Points */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-600">Điểm:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(question.id, {
                                points: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-14 text-center border border-gray-300 rounded-md py-1 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ---- FLOATING SIDEBAR TOOLBAR (right side) ---- */}
              {isActive && (
                <div className="flex-shrink-0 hidden md:flex flex-col gap-1 pt-2">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col items-center py-1">
                    <button
                      onClick={() => addQuestion(qIndex)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                      title="Thêm câu hỏi"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => fileInputRefs.current[question.id]?.click()}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                      title="Thêm hình ảnh"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    {qIndex > 0 && (
                      <button
                        onClick={() => moveQuestion(qIndex, 'up')}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                        title="Di chuyển lên"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                    )}
                    {qIndex < questions.length - 1 && (
                      <button
                        onClick={() => moveQuestion(qIndex, 'down')}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                        title="Di chuyển xuống"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ====== ADD QUESTION BUTTON (bottom) ====== */}
        <button
          onClick={() => addQuestion()}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" /> Thêm câu hỏi
        </button>

        {/* ====== BOTTOM SAVE BUTTON ====== */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition disabled:opacity-50"
          >
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {saving ? 'Đang lưu...' : 'Tạo Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
