'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3, Loader2, AlertCircle } from 'lucide-react';
import ForumEditor from '@/components/ForumEditor';
import { fetchPost, updatePost, Attachment, ForumPost } from '@/lib/forum';
import { getToken } from '@/lib/auth';

export default function ForumEditPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);
  const [post, setPost] = useState<ForumPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    fetchPost(postId, token ?? undefined).then(res => {
      if (res.success) setPost(res.data.post);
      else setError(res.message || 'Không tải được bài viết');
      setLoadingPost(false);
    }).catch(() => {
      setError('Lỗi kết nối');
      setLoadingPost(false);
    });
  }, [postId]);

  const handleSubmit = async (data: {
    title: string;
    content: string;
    tags: string[];
    attachments: Attachment[];
  }) => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await updatePost(token, postId, data);
      if (res.success) {
        router.push(`/forum/${postId}`);
      } else {
        setError(res.message || 'Không thể cập nhật bài viết');
      }
    } catch {
      setError('Lỗi kết nối đến máy chủ');
    } finally {
      setSaving(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-slate-700 font-semibold">{error || 'Bài viết không tồn tại'}</p>
        <Link href="/forum" className="text-cyan-600 hover:underline text-sm">← Quay lại diễn đàn</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-teal-600/15 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-3xl relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Chỉnh sửa bài viết</h1>
          </div>
          <Link href={`/forum/${postId}`} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all self-start">
            <ArrowLeft className="w-4 h-4" /> Quay lại bài viết
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
          <ForumEditor
            initialTitle={post.title}
            initialContent={post.content}
            initialTags={post.tags}
            initialAttachments={Array.isArray(post.attachments) ? post.attachments : []}
            onSubmit={handleSubmit}
            loading={saving}
            submitLabel="Lưu thay đổi"
          />
        </div>
      </div>
    </div>
  );
}
