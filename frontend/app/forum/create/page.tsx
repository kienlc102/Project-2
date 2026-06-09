'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquarePlus } from 'lucide-react';
import ForumEditor from '@/components/ForumEditor';
import { createPost, Attachment } from '@/lib/forum';
import { getToken } from '@/lib/auth';

export default function ForumCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: {
    title: string;
    content: string;
    tags: string[];
    attachments: Attachment[];
  }) => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await createPost(token, data);
      if (res.success) {
        router.push(`/forum/${res.data.post.id}`);
      } else {
        setError(res.message || 'Không thể tạo bài viết');
      }
    } catch {
      setError('Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-teal-600/15 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-3xl relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg">
              <MessageSquarePlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Đăng bài mới</h1>
              <p className="text-sm text-slate-900 mt-0.5">Chia sẻ câu hỏi hoặc kiến thức với cộng đồng</p>
            </div>
          </div>
          <Link href="/forum" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-900 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all self-start">
            <ArrowLeft className="w-4 h-4" /> Diễn đàn
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Editor */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
          <ForumEditor
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel="Đăng bài"
          />
        </div>
      </div>
    </div>
  );
}
