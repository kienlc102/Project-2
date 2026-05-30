'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface FlashcardItem {
  front: string;
  back: string;
}

interface FlashcardGenerateResponse {
  flashcards: FlashcardItem[];
}

export default function StudyFlashcard() {
  const params = useParams();
  const flashcardSetId = params.id as string;

  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!flashcardSetId) return;

    const fetchFlashcards = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://localhost:8000/api/v1/flashcard/get-flashcard-set-by-id/${flashcardSetId}`);
        if (!res.ok) {
          throw new Error(`Lỗi tải bộ flashcard (${res.status})`);
        }
        const data: FlashcardGenerateResponse = await res.json();
        setFlashcards(data.flashcards || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Không thể tải flashcard.');
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [flashcardSetId]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, flashcards.length - 1));
    }, 150); // Small delay to prevent seeing the back content change instantly
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }, 150);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-600 font-medium">Đang tải flashcard...</p>
      </div>
    );
  }

  if (error && !flashcards.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
        <div className="max-w-md w-full bg-white backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl border border-slate-200 relative z-10">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Không thể tải flashcard</h2>
          <p className="text-slate-600 mb-8">{error}</p>
          <Link
            href="/flashcards"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 rounded-xl transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Về danh sách
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 relative overflow-hidden flex flex-col">
      {/* Background Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-50 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-teal-50 blur-[120px] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto w-full space-y-8 relative z-10 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/flashcards"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>

          <div className="bg-white backdrop-blur-md px-5 py-2.5 rounded-xl border border-emerald-200 text-sm font-medium text-slate-700 shadow-md">
            Thẻ <span className="text-emerald-600 font-bold">{currentIndex + 1}</span> / {flashcards.length}
          </div>
        </div>

        {/* Flashcard Area */}
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          {/* Perspective Container */}
          <div 
            className="relative w-full max-w-2xl h-80 sm:h-96 cursor-pointer group perspective-[1000px]"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Flipping Inner Container */}
            <div 
              className={`w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d] shadow-2xl ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
            >
              {/* Front Face */}
              <div className="absolute inset-0 w-full h-full rounded-3xl border border-slate-200 bg-white backdrop-blur-xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden] hover:bg-slate-50 hover:border-emerald-300 transition-colors">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-4">Mặt trước - Thuật ngữ</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center leading-relaxed">
                  {currentCard?.front}
                </h3>
                <p className="absolute bottom-6 text-sm text-slate-500 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Nhấn để lật thẻ
                </p>
              </div>

              {/* Back Face */}
              <div className="absolute inset-0 w-full h-full rounded-3xl border border-emerald-300 bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-4">Mặt sau - Định nghĩa</p>
                <p className="text-lg sm:text-xl font-medium text-slate-700 text-center leading-relaxed">
                  {currentCard?.back}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-6 mt-auto">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="w-5 h-5" /> Trước
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-500 hover:to-teal-500 border border-emerald-200 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Tiếp theo <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
