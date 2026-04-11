'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/auth';
import { getFlashcardSet, updateFlashcardSet, uploadFlashcardImage } from '@/lib/flashcards';
import {
  ArrowLeft, Plus, Trash2, Image as ImageIcon, X, Globe, Lock,
  GripVertical, Loader2, Save
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

export default function EditFlashcardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [cards, setCards] = useState<CardDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingCard, setUploadingCard] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const res = await getFlashcardSet(parseInt(id), token);
        if (res.success && res.data) {
          if (!res.data.isOwner) {
            setError('Bạn không có quyền chỉnh sửa bộ flashcard này');
            setLoading(false);
            return;
          }
          setTitle(res.data.title);
          setDescription(res.data.description || '');
          setVisibility(res.data.visibility);
          setCards(
            (res.data.cards || []).map((c: any) => ({
              id: generateId(),
              term: c.term,
              definition: c.definition,
              termImageUrl: c.term_image_url || '',
              definitionImageUrl: c.definition_image_url || '',
              termImagePreview: c.term_image_url ? `${API_BASE}${c.term_image_url}` : '',
              definitionImagePreview: c.definition_image_url ? `${API_BASE}${c.definition_image_url}` : '',
            }))
          );
        } else {
          setError(res.message || 'Không tìm thấy');
        }
      } catch {
        setError('Lỗi kết nối máy chủ');
      }
      setLoading(false);
    };
    fetchData();
  }, [id, router]);

  const updateCard = (cardId: string, field: keyof CardDraft, value: string) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, [field]: value } : c)));
  };

  const addCard = () => {
    setCards((prev) => [
      ...prev,
      {
        id: generateId(),
        term: '',
        definition: '',
        termImageUrl: '',
        definitionImageUrl: '',
        termImagePreview: '',
        definitionImagePreview: '',
      },
    ]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeCard = (cardId: string) => {
    if (cards.length <= 2) return;
    setCards((prev) => prev.filter((c) => c.id !== cardId));
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

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

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
      const res = await updateFlashcardSet(token, parseInt(id), {
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
        setSuccess('Đã lưu thành công!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.message || 'Lỗi cập nhật');
      }
    } catch {
      setError('Lỗi kết nối máy chủ');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/flashcards" className="text-blue-600 hover:underline">
            ← Quay lại
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/flashcards/${id}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-800">Chỉnh sửa flashcard</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            {success}
          </div>
        )}

        {/* Title & Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Nhập tiêu đề'
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

        {/* Visibility */}
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

        {/* Cards */}
        <div className="space-y-3">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
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

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Term */}
                <div className="p-4 space-y-2">
                  <textarea
                    value={card.term}
                    onChange={(e) => updateCard(card.id, 'term', e.target.value)}
                    placeholder="Nhập thuật ngữ"
                    rows={2}
                    className="w-full border-b-2 border-gray-200 focus:border-blue-500 pb-2 outline-none transition resize-none placeholder:text-gray-400"
                  />
                  <label className="text-xs text-gray-400 block">THUẬT NGỮ</label>
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

                {/* Definition */}
                <div className="p-4 space-y-2">
                  <textarea
                    value={card.definition}
                    onChange={(e) => updateCard(card.id, 'definition', e.target.value)}
                    placeholder="Nhập định nghĩa"
                    rows={2}
                    className="w-full border-b-2 border-gray-200 focus:border-blue-500 pb-2 outline-none transition resize-none placeholder:text-gray-400"
                  />
                  <label className="text-xs text-gray-400 block">ĐỊNH NGHĨA</label>
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

        {/* Add Card */}
        <button
          onClick={addCard}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" /> THÊM THẺ
        </button>

        {/* Bottom Save */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
