'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/auth';
import { getFlashcardSet, deleteFlashcardSet, FlashcardSet, FlashcardCard } from '@/lib/flashcards';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Volume2, Shuffle, Maximize2, Minimize2,
  Copy, Check, Edit3, Trash2, Lock, Globe, Star, RotateCcw, Layers,
  Keyboard, Eye, EyeOff, Share2, Link as LinkIcon, User
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function FlashcardStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<FlashcardCard[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [learningCards, setLearningCards] = useState<Set<number>>(new Set());

  const activeCards = showStarredOnly
    ? (isShuffled ? shuffledCards : cards).filter((c) => starred.has(c.id!))
    : isShuffled
      ? shuffledCards
      : cards;

  const currentCard = activeCards[currentIndex];

  // Fetch set data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        const res = await getFlashcardSet(parseInt(id), token);
        if (res.success) {
          setSet(res.data);
          setCards(res.data.cards || []);
        } else {
          setError(res.message || 'Không tìm thấy bộ flashcard');
        }
      } catch {
        setError('Lỗi kết nối máy chủ');
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          setIsFlipped((f) => !f);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 's':
          e.preventDefault();
          toggleShuffle();
          break;
        case '1':
          if (currentCard) markAsKnown(currentCard.id!);
          break;
        case '2':
          if (currentCard) markAsLearning(currentCard.id!);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeCards, currentCard]);

  const goToNext = useCallback(() => {
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, activeCards.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const toggleShuffle = () => {
    if (!isShuffled) {
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setShuffledCards(shuffled);
    }
    setIsShuffled(!isShuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const resetProgress = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setLearningCards(new Set());
    setShowStarredOnly(false);
  };

  const toggleStar = (cardId: number) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const markAsKnown = (cardId: number) => {
    setKnownCards((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
    setLearningCards((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  };

  const markAsLearning = (cardId: number) => {
    setLearningCards((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
    setKnownCards((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to detect language
      const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
      if (isVietnamese) {
        utterance.lang = 'vi-VN';
      } else {
        utterance.lang = 'en-US';
      }
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await deleteFlashcardSet(token, parseInt(id));
      if (res.success) {
        router.push('/flashcards');
      } else {
        setError(res.message || 'Lỗi xóa');
      }
    } catch {
      setError('Lỗi kết nối');
    }
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Không tìm thấy'}</p>
          <Link href="/flashcards" className="text-blue-600 hover:underline">
            ← Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const progress = activeCards.length > 0 ? ((currentIndex + 1) / activeCards.length) * 100 : 0;

  return (
    <div className={`min-h-screen bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      {/* Header */}
      <nav className={`shadow-sm border-b ${isFullscreen ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isFullscreen && (
              <Link href="/flashcards" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div>
              <h1 className={`text-lg font-bold ${isFullscreen ? 'text-white' : 'text-gray-800'}`}>
                {set.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {set.author_name}
                </span>
                <span>•</span>
                <span>{cards.length} thẻ</span>
                <span>•</span>
                {set.visibility === 'private' ? (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Lock className="w-3 h-3" /> Riêng tư
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600">
                    <Globe className="w-3 h-3" /> Công khai
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Link */}
            <button
              onClick={copyLink}
              className={`p-2 rounded-lg transition ${
                copied
                  ? 'bg-green-100 text-green-600'
                  : isFullscreen
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Sao chép liên kết"
            >
              {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
            </button>

            {/* Keyboard Shortcuts */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={`p-2 rounded-lg transition ${isFullscreen ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Phím tắt"
            >
              <Keyboard className="w-5 h-5" />
            </button>

            {/* Owner actions */}
            {set.isOwner && !isFullscreen && (
              <>
                <Link
                  href={`/flashcards/${id}/edit`}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                  title="Chỉnh sửa"
                >
                  <Edit3 className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                  title="Xóa"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Phím tắt</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Space / Enter', 'Lật thẻ'],
                ['← Mũi tên trái', 'Thẻ trước'],
                ['→ Mũi tên phải', 'Thẻ tiếp'],
                ['S', 'Trộn thẻ'],
                ['F', 'Toàn màn hình'],
                ['1', 'Đánh dấu "Đã biết"'],
                ['2', 'Đánh dấu "Đang học"'],
              ].map(([key, desc]) => (
                <div key={key} className="flex justify-between">
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{key}</kbd>
                  <span className="text-gray-600">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Xóa bộ flashcard?</h3>
            <p className="text-gray-600 text-sm mb-4">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Study Area */}
      <div className={`max-w-3xl mx-auto px-4 py-6 ${isFullscreen ? 'flex flex-col justify-center min-h-[calc(100vh-64px)]' : ''}`}>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className={`h-1.5 rounded-full overflow-hidden ${isFullscreen ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={`flex justify-between mt-1 text-xs ${isFullscreen ? 'text-gray-400' : 'text-gray-500'}`}>
            <span>{currentIndex + 1} / {activeCards.length}</span>
            <div className="flex gap-3">
              {knownCards.size > 0 && <span className="text-green-500">✓ Đã biết: {knownCards.size}</span>}
              {learningCards.size > 0 && <span className="text-orange-500">○ Đang học: {learningCards.size}</span>}
            </div>
          </div>
        </div>

        {/* Flashcard */}
        {activeCards.length > 0 && currentCard ? (
          <div className="mb-6">
            {/* Card Container with 3D Flip */}
            <div
              className="relative cursor-pointer select-none"
              style={{ perspective: '1000px', minHeight: '320px' }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  minHeight: '320px',
                }}
              >
                {/* Front (Term) */}
                <div
                  className={`absolute inset-0 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center ${
                    isFullscreen ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className={`text-xs font-medium mb-4 ${isFullscreen ? 'text-gray-500' : 'text-gray-400'}`}>
                    THUẬT NGỮ
                  </span>
                  {currentCard.term_image_url && (
                    <img
                      src={`${API_BASE}${currentCard.term_image_url}`}
                      alt="Term"
                      className="max-h-32 w-auto rounded-lg mb-4 object-contain"
                    />
                  )}
                  <p className={`text-2xl font-semibold text-center leading-relaxed ${isFullscreen ? 'text-white' : 'text-gray-800'}`}>
                    {currentCard.term}
                  </p>
                  <p className={`text-xs mt-6 ${isFullscreen ? 'text-gray-500' : 'text-gray-400'}`}>
                    Nhấn để lật thẻ
                  </p>
                </div>

                {/* Back (Definition) */}
                <div
                  className={`absolute inset-0 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center ${
                    isFullscreen ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className={`text-xs font-medium mb-4 ${isFullscreen ? 'text-gray-500' : 'text-gray-400'}`}>
                    ĐỊNH NGHĨA
                  </span>
                  {currentCard.definition_image_url && (
                    <img
                      src={`${API_BASE}${currentCard.definition_image_url}`}
                      alt="Definition"
                      className="max-h-32 w-auto rounded-lg mb-4 object-contain"
                    />
                  )}
                  <p className={`text-xl text-center leading-relaxed ${isFullscreen ? 'text-gray-200' : 'text-gray-700'}`}>
                    {currentCard.definition}
                  </p>
                  <p className={`text-xs mt-6 ${isFullscreen ? 'text-gray-500' : 'text-gray-400'}`}>
                    Nhấn để lật thẻ
                  </p>
                </div>
              </div>

              {/* Star button (floating) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentCard.id) toggleStar(currentCard.id);
                }}
                className={`absolute top-4 right-4 p-2 rounded-lg transition z-10 ${
                  currentCard.id && starred.has(currentCard.id)
                    ? 'text-yellow-500 bg-yellow-50'
                    : isFullscreen
                      ? 'text-gray-500 hover:text-yellow-400 hover:bg-gray-700'
                      : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'
                }`}
              >
                <Star className={`w-5 h-5 ${currentCard.id && starred.has(currentCard.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-4">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className={`p-3 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed ${
                    isFullscreen
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex >= activeCards.length - 1}
                  className={`p-3 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed ${
                    isFullscreen
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {/* TTS */}
                <button
                  onClick={() => speak(isFlipped ? currentCard.definition : currentCard.term)}
                  className={`p-2.5 rounded-xl transition ${
                    isFullscreen
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-blue-400'
                      : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  title="Phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>

                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  className={`p-2.5 rounded-xl transition ${
                    isShuffled
                      ? 'bg-blue-100 text-blue-600'
                      : isFullscreen
                        ? 'text-gray-400 hover:bg-gray-700'
                        : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Trộn thẻ"
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                {/* Show starred only */}
                {starred.size > 0 && (
                  <button
                    onClick={() => {
                      setShowStarredOnly(!showStarredOnly);
                      setCurrentIndex(0);
                      setIsFlipped(false);
                    }}
                    className={`p-2.5 rounded-xl transition ${
                      showStarredOnly
                        ? 'bg-yellow-100 text-yellow-600'
                        : isFullscreen
                          ? 'text-gray-400 hover:bg-gray-700'
                          : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    title="Chỉ thẻ đã đánh dấu"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                )}

                {/* Reset */}
                <button
                  onClick={resetProgress}
                  className={`p-2.5 rounded-xl transition ${
                    isFullscreen
                      ? 'text-gray-400 hover:bg-gray-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Đặt lại"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className={`p-2.5 rounded-xl transition ${
                    isFullscreen
                      ? 'text-gray-400 hover:bg-gray-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="Toàn màn hình"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Know / Learning buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (currentCard.id) markAsLearning(currentCard.id);
                    goToNext();
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isFullscreen
                      ? 'bg-orange-900/30 text-orange-400 border border-orange-800 hover:bg-orange-900/50'
                      : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  Đang học
                </button>
                <button
                  onClick={() => {
                    if (currentCard.id) markAsKnown(currentCard.id);
                    goToNext();
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isFullscreen
                      ? 'bg-green-900/30 text-green-400 border border-green-800 hover:bg-green-900/50'
                      : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  Đã biết
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className={isFullscreen ? 'text-gray-400' : 'text-gray-500'}>
              {showStarredOnly ? 'Chưa có thẻ nào được đánh dấu sao' : 'Không có thẻ nào'}
            </p>
          </div>
        )}

        {/* All Cards Overview (below study area) */}
        {!isFullscreen && (
          <div className="mt-8">
            <button
              onClick={() => setShowAllCards(!showAllCards)}
              className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-800 font-medium"
            >
              {showAllCards ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAllCards ? 'Ẩn danh sách thẻ' : `Xem tất cả ${cards.length} thẻ`}
            </button>

            {showAllCards && (
              <div className="space-y-2">
                {cards.map((card, i) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      const idx = activeCards.findIndex((c) => c.id === card.id);
                      if (idx >= 0) {
                        setCurrentIndex(idx);
                        setIsFlipped(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition hover:shadow-sm ${
                      currentCard?.id === card.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">THUẬT NGỮ</span>
                        <div className="flex items-start gap-2">
                          {card.term_image_url && (
                            <img
                              src={`${API_BASE}${card.term_image_url}`}
                              alt=""
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <p className="text-gray-800 text-sm">{card.term}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">ĐỊNH NGHĨA</span>
                        <div className="flex items-start gap-2">
                          {card.definition_image_url && (
                            <img
                              src={`${API_BASE}${card.definition_image_url}`}
                              alt=""
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <p className="text-gray-600 text-sm">{card.definition}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">#{i + 1}</span>
                      <div className="flex items-center gap-2">
                        {knownCards.has(card.id!) && (
                          <span className="text-xs text-green-500 font-medium">✓ Đã biết</span>
                        )}
                        {learningCards.has(card.id!) && (
                          <span className="text-xs text-orange-500 font-medium">○ Đang học</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(card.term);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-500 transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (card.id) toggleStar(card.id);
                          }}
                          className={`p-1 transition ${starred.has(card.id!) ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}
                        >
                          <Star className={`w-3.5 h-3.5 ${starred.has(card.id!) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {!isFullscreen && set.description && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-2">Mô tả</h3>
            <p className="text-gray-600 text-sm">{set.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
