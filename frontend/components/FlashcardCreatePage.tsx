'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/auth';
import { createFlashcardSet, uploadFlashcardImage } from '@/lib/flashcards';
import {
  ArrowLeft, Plus, Trash2, Image as ImageIcon, X, Globe, Lock,
  GripVertical, FileText, Loader2
} from 'lucide-react';

interface CardDraft {
  id: string;
  term: string;
  definition: string;
  termImageUrl: string;
  definitionImageUrl: string;
  termImagePreview: string;
  definitionImagePreview: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

function emptyCard(): CardDraft {
  return {
    id: generateId(),
    term: '',
    definition: '',
    termImageUrl: '',
    definitionImageUrl: '',
    termImagePreview: '',
    definitionImagePreview: '',
  };
}

export default function CreateFlashcardPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [cards, setCards] = useState<CardDraft[]>([emptyCard(), emptyCard()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTermSep, setImportTermSep] = useState('\\t');
  const [importCardSep, setImportCardSep] = useState('\\n');
  const [uploadingCard, setUploadingCard] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateCard = (id: string, field: keyof CardDraft, value: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const addCard = () => {
    setCards((prev) => [...prev, emptyCard()]);
    // Scroll to bottom after adding
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeCard = (id: string) => {
    if (cards.length <= 2) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleImageUpload = async (cardId: string, side: 'term' | 'definition', file: File) => {
    const token = getToken();
    if (!token) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File ảnh quá lớn (tối đa 5MB)');
      return;
    }

    setUploadingCard(`${cardId}-${side}`);
    try {
      const res = await uploadFlashcardImage(token, file);
      if (res.success && res.data) {
        const previewUrl = URL.createObjectURL(file);
        if (side === 'term') {
          updateCard(cardId, 'termImageUrl', res.data.url);
          updateCard(cardId, 'termImagePreview', previewUrl);
        } else {
          updateCard(cardId, 'definitionImageUrl', res.data.url);
          updateCard(cardId, 'definitionImagePreview', previewUrl);
        }
      } else {
        setError(res.message || 'Lỗi tải ảnh');
      }
    } catch {
      setError('Lỗi tải ảnh');
    }
    setUploadingCard(null);
  };

  const removeImage = (cardId: string, side: 'term' | 'definition') => {
    if (side === 'term') {
      updateCard(cardId, 'termImageUrl', '');
      updateCard(cardId, 'termImagePreview', '');
    } else {
      updateCard(cardId, 'definitionImageUrl', '');
      updateCard(cardId, 'definitionImagePreview', '');
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;

    const termSep = importTermSep === '\\t' ? '\t' : importTermSep;
    const cardSep = importCardSep === '\\n' ? '\n' : importCardSep;

    const lines = importText.split(cardSep).filter((l) => l.trim());
    const newCards: CardDraft[] = lines.map((line) => {
      const parts = line.split(termSep);
      return {
        id: generateId(),
        term: (parts[0] || '').trim(),
        definition: (parts[1] || '').trim(),
        termImageUrl: '',
        definitionImageUrl: '',
        termImagePreview: '',
        definitionImagePreview: '',
      };
    });

    if (newCards.length > 0) {
      setCards((prev) => [...prev, ...newCards]);
      setShowImport(false);
      setImportText('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề');
      return;
    }

    const validCards = cards.filter((c) => c.term.trim() || c.definition.trim());
    if (validCards.length < 2) {
      setError('Cần ít nhất 2 thẻ có nội dung');
      return;
    }

    for (let i = 0; i < validCards.length; i++) {
      if (!validCards[i].term.trim() || !validCards[i].definition.trim()) {
        setError(`Thẻ ${i + 1}: Cần nhập cả thuật ngữ và định nghĩa`);
        return;
      }
    }

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setSaving(true);
    try {
      const res = await createFlashcardSet(token, {
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        cards: validCards.map((c) => ({
          term: c.term,
          definition: c.definition,
          termImageUrl: c.termImageUrl || undefined,
          definitionImageUrl: c.definitionImageUrl || undefined,
        })),
      });

      if (res.success) {
        router.push(`/flashcards/${res.data.id}`);
      } else {
        setError(res.message || 'Lỗi tạo bộ flashcard');
      }
    } catch {
      setError('Lỗi kết nối máy chủ');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/flashcards" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-800">Tạo bộ flashcard mới</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Đang tạo...' : 'Tạo'}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Title & Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Nhập tiêu đề, ví dụ "Sinh học - Chương 22: Tiến hóa"'
              className="w-full text-lg font-medium border-b-2 border-gray-200 focus:border-blue-500 pb-2 outline-none transition placeholder:text-gray-400"
              maxLength={255}
            />
            <label className="text-xs text-gray-400 mt-1 block">TIÊU ĐỀ</label>
          </div>
          <div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thêm mô tả..."
              className="w-full border-b-2 border-gray-200 focus:border-blue-500 pb-2 outline-none transition placeholder:text-gray-400"
            />
            <label className="text-xs text-gray-400 mt-1 block">MÔ TẢ (Tùy chọn)</label>
          </div>
        </div>

        {/* Visibility & Import */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
              visibility === 'public'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}
          >
            {visibility === 'public' ? (
              <>
                <Globe className="w-4 h-4" /> Công khai
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Riêng tư
              </>
            )}
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <FileText className="w-4 h-4" /> Nhập từ văn bản
          </button>
        </div>

        {/* Import Modal */}
        {showImport && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">Nhập từ văn bản</h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Từ 1\tĐịnh nghĩa 1\nTừ 2\tĐịnh nghĩa 2`}
              rows={6}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
            />
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <label className="text-gray-500 block mb-1">Ngăn cách thuật ngữ & định nghĩa</label>
                <select
                  value={importTermSep}
                  onChange={(e) => setImportTermSep(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="\\t">Tab</option>
                  <option value=",">Dấu phẩy</option>
                  <option value=";">Dấu chấm phẩy</option>
                  <option value=" - ">Dấu gạch ngang</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 block mb-1">Ngăn cách giữa các thẻ</label>
                <select
                  value={importCardSep}
                  onChange={(e) => setImportCardSep(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="\\n">Xuống dòng</option>
                  <option value=";">Dấu chấm phẩy</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Nhập
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Cards */}
        <div className="space-y-3">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-300" />
                  <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                </div>
                <button
                  onClick={() => removeCard(card.id)}
                  disabled={cards.length <= 2}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Term Side */}
                <div className="p-4 space-y-2">
                  <textarea
                    value={card.term}
                    onChange={(e) => updateCard(card.id, 'term', e.target.value)}
                    placeholder="Nhập thuật ngữ"
                    rows={2}
                    className="w-full border-b-2 border-gray-200 focus:border-blue-500 pb-2 outline-none transition resize-none placeholder:text-gray-400"
                  />
                  <label className="text-xs text-gray-400 block">THUẬT NGỮ</label>

                  {/* Term Image */}
                  {card.termImagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={card.termImagePreview}
                        alt="Term"
                        className="h-20 w-auto rounded-lg border border-gray-200 object-cover"
                      />
                      <button
                        onClick={() => removeImage(card.id, 'term')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        ref={(el) => { fileInputRefs.current[`${card.id}-term`] = el; }}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(card.id, 'term', file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        onClick={() => fileInputRefs.current[`${card.id}-term`]?.click()}
                        disabled={uploadingCard === `${card.id}-term`}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition"
                      >
                        {uploadingCard === `${card.id}-term` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5" />
                        )}
                        Thêm ảnh
                      </button>
                    </div>
                  )}
                </div>

                {/* Definition Side */}
                <div className="p-4 space-y-2">
                  <textarea
                    value={card.definition}
                    onChange={(e) => updateCard(card.id, 'definition', e.target.value)}
                    placeholder="Nhập định nghĩa"
                    rows={2}
                    className="w-full border-b-2 border-gray-200 focus:border-blue-500 pb-2 outline-none transition resize-none placeholder:text-gray-400"
                  />
                  <label className="text-xs text-gray-400 block">ĐỊNH NGHĨA</label>

                  {/* Definition Image */}
                  {card.definitionImagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={card.definitionImagePreview}
                        alt="Definition"
                        className="h-20 w-auto rounded-lg border border-gray-200 object-cover"
                      />
                      <button
                        onClick={() => removeImage(card.id, 'definition')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        ref={(el) => { fileInputRefs.current[`${card.id}-def`] = el; }}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(card.id, 'definition', file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        onClick={() => fileInputRefs.current[`${card.id}-def`]?.click()}
                        disabled={uploadingCard === `${card.id}-definition`}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition"
                      >
                        {uploadingCard === `${card.id}-definition` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5" />
                        )}
                        Thêm ảnh
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Card Button */}
        <button
          onClick={addCard}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" /> THÊM THẺ
        </button>

        {/* Bottom Create Button */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition disabled:opacity-50"
          >
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {saving ? 'Đang tạo...' : 'Tạo bộ flashcard'}
          </button>
        </div>
      </div>
    </div>
  );
}
