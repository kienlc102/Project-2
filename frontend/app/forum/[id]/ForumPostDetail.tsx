'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MessageSquare, Edit3, Trash2, Reply, ChevronDown,
  ChevronUp as ChevronUpIcon, Paperclip, Clock, User, Loader2, AlertCircle, Send,
  Download, ExternalLink
} from 'lucide-react';
import {
  fetchPost, fetchComments, createComment, editComment, deleteComment,
  votePost, voteComment, deletePost,
  ForumPost, ForumComment, Attachment, timeAgo, getFileIcon, formatFileSize
} from '@/lib/forum';
import { getToken } from '@/lib/auth';
import MathRenderer from '@/components/MathRenderer';
import VoteButtons from '@/components/VoteButtons';

// ────────────────────────────────────
// Comment Node (recursive)
// ────────────────────────────────────
function CommentNode({
  comment,
  postId,
  currentUserId,
  token,
  depth = 0,
  onUpdate,
}: {
  comment: ForumComment;
  postId: number;
  currentUserId: number | null;
  token: string | null;
  depth?: number;
  onUpdate: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localComment, setLocalComment] = useState(comment);

  const isOwner = currentUserId === comment.user_id;
  const canReply = depth < 5; // limit nesting depth

  const handleReply = async () => {
    if (!token || !replyContent.trim()) return;
    setLoading(true);
    await createComment(token, postId, replyContent.trim(), comment.id);
    setReplyContent('');
    setReplying(false);
    setLoading(false);
    onUpdate();
  };

  const handleEdit = async () => {
    if (!token || !editContent.trim()) return;
    setLoading(true);
    await editComment(token, comment.id, editContent.trim());
    setEditing(false);
    setLoading(false);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!token || !confirm('Xóa bình luận này?')) return;
    await deleteComment(token, comment.id);
    onUpdate();
  };

  const handleVote = async (type: 'up' | 'down' | null) => {
    if (!token) return;
    const res = await voteComment(token, comment.id, type);
    if (res.success) {
      setLocalComment(prev => ({
        ...prev,
        upvotes: res.data.upvotes,
        downvotes: res.data.downvotes,
        score: res.data.score,
        userVote: res.data.userVote,
      }));
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-slate-100' : ''}`}>
      <div className="group py-3">
        <div className="flex items-start gap-3">
          {/* Vote */}
          <VoteButtons
            score={localComment.score}
            userVote={localComment.userVote}
            onVote={handleVote}
            disabled={!token}
            orientation="vertical"
          />

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-950">
                  {comment.full_name || comment.email?.split('@')[0] || 'Ẩn danh'}
                </span>
              </div>
              <span className="text-xs text-slate-900 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(comment.created_at)}
                {comment.updated_at !== comment.created_at && ' (đã chỉnh sửa)'}
              </span>
            </div>

            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
                />
                <div className="flex gap-2">
                  <button onClick={handleEdit} disabled={loading} className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-semibold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 flex items-center gap-1">
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />} Lưu
                  </button>
                  <button onClick={() => { setEditing(false); setEditContent(comment.content); }} className="px-3 py-1.5 bg-slate-100 text-slate-950 text-xs font-semibold rounded-lg hover:bg-slate-200 transition">
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-900 leading-relaxed">
                <MathRenderer content={comment.content} />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {canReply && token && (
                <button onClick={() => setReplying(!replying)} className="flex items-center gap-1 text-xs text-slate-900 hover:text-cyan-800 transition font-medium">
                  <Reply className="w-3.5 h-3.5" /> Trả lời
                </button>
              )}
              {isOwner && !editing && (
                <>
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-slate-900 hover:text-cyan-800 transition font-medium">
                    <Edit3 className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button onClick={handleDelete} className="flex items-center gap-1 text-xs text-slate-900 hover:text-rose-700 transition font-medium">
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </>
              )}
              {localComment.children.length > 0 && (
                <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-1 text-xs text-slate-900 hover:text-slate-950 transition font-medium ml-auto">
                  {collapsed ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {collapsed ? 'Hiện' : 'Ẩn'} {localComment.children.length} trả lời
                </button>
              )}
            </div>

            {/* Reply box */}
            {replying && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Viết trả lời... (hỗ trợ LaTeX: $...$)"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
                />
                <div className="flex gap-2">
                  <button onClick={handleReply} disabled={loading || !replyContent.trim()} className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-semibold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 flex items-center gap-1">
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Send className="w-3 h-3" /> Gửi
                  </button>
                  <button onClick={() => { setReplying(false); setReplyContent(''); }} className="px-3 py-1.5 bg-slate-100 text-slate-950 text-xs font-semibold rounded-lg hover:bg-slate-200 transition">
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {!collapsed && localComment.children.length > 0 && (
        <div>
          {localComment.children.map(child => (
            <CommentNode
              key={child.id}
              comment={child}
              postId={postId}
              currentUserId={currentUserId}
              token={token}
              depth={depth + 1}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────
// Main Post Detail
// ────────────────────────────────────
export default function ForumPostDetail() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const token = typeof window !== 'undefined' ? getToken() : null;

  // Get current user ID from token
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch {}
    }
  }, [token]);

  const loadPost = useCallback(async () => {
    setLoadingPost(true);
    try {
      const res = await fetchPost(postId, token ?? undefined);
      if (res.success) setPost(res.data.post);
      else setError(res.message || 'Không tải được bài viết');
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoadingPost(false);
    }
  }, [postId, token]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetchComments(postId, token ?? undefined);
      if (res.success) setComments(res.data.comments);
    } catch {}
    finally { setLoadingComments(false); }
  }, [postId, token]);

  useEffect(() => { loadPost(); }, [loadPost]);
  useEffect(() => { loadComments(); }, [loadComments]);

  const handleVotePost = async (type: 'up' | 'down' | null) => {
    if (!token || !post) return;
    const res = await votePost(token, post.id, type);
    if (res.success) {
      setPost(prev => prev ? {
        ...prev,
        upvotes: res.data.upvotes,
        downvotes: res.data.downvotes,
        score: res.data.score,
        userVote: res.data.userVote,
      } : null);
    }
  };

  const handleDownload = async (att: Attachment) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const res = await fetch(`${apiBase}${att.url}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = att.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert('Không thể tải file. Vui lòng thử lại.');
    }
  };

  const handleDeletePost = async () => {
    if (!token || !post || !confirm('Xóa bài viết này? Hành động không thể hoàn tác.')) return;
    const res = await deletePost(token, post.id);
    if (res.success) router.push('/forum');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newComment.trim()) return;
    setSubmitting(true);
    const res = await createComment(token, postId, newComment.trim(), null);
    if (res.success) {
      setNewComment('');
      loadComments();
    }
    setSubmitting(false);
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-700" />
        <p className="text-slate-900 font-semibold">{error || 'Bài viết không tồn tại'}</p>
        <Link href="/forum" className="text-cyan-800 hover:underline text-sm">← Quay lại diễn đàn</Link>
      </div>
    );
  }

  const isOwner = currentUserId === post.user_id;
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-3xl space-y-5 relative z-10">

        {/* Back */}
        <Link href="/forum" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-900 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all">
          <ArrowLeft className="w-4 h-4" /> Diễn đàn
        </Link>

        {/* Post */}
        <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex gap-4">
              {/* Vote */}
              <div className="shrink-0">
                <VoteButtons
                  score={post.score}
                  userVote={post.userVote}
                  onVote={handleVotePost}
                  disabled={!token}
                  orientation="vertical"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight mb-3">
                  {post.title}
                </h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 mb-5 text-xs text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold text-slate-900">
                      {post.full_name || post.email?.split('@')[0]}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(post.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {post.comment_count} bình luận
                  </span>
                </div>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {post.tags.map(tag => (
                      <Link key={tag} href={`/forum?tag=${encodeURIComponent(tag)}`}
                        className="text-xs px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 font-medium hover:bg-cyan-100 transition">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Body with LaTeX */}
                <div className="prose prose-slate max-w-none text-slate-950 leading-relaxed">
                  <MathRenderer content={post.content} />
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-cyan-500" /> Tệp đính kèm ({attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.map((att, idx) => {
                        const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-cyan-50 hover:border-cyan-300 transition group"
                          >
                            <span className="text-xl shrink-0">{getFileIcon(att.mimetype, att.filename)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate group-hover:text-cyan-800">{att.filename}</p>
                              <p className="text-xs text-slate-900">{formatFileSize(att.size)}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={`${apiBase}${att.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Mở trong tab mới"
                                className="p-1.5 rounded-lg text-slate-900 hover:text-cyan-800 hover:bg-cyan-100 transition"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDownload(att)}
                                title="Tải về"
                                className="p-1.5 rounded-lg text-slate-900 hover:text-teal-600 hover:bg-teal-100 transition"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Owner actions */}
                {isOwner && (
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
                    <Link
                      href={`/forum/${post.id}/edit`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-950 rounded-xl text-sm font-semibold hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-800 transition"
                    >
                      <Edit3 className="w-4 h-4" /> Chỉnh sửa
                    </Link>
                    <button
                      onClick={handleDeletePost}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-950 rounded-xl text-sm font-semibold hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa bài
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-500" />
            <h2 className="font-bold text-slate-950">{post.comment_count} Bình luận</h2>
          </div>

          <div className="p-6 space-y-4">
            {/* New comment form */}
            {token ? (
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Viết bình luận... (hỗ trợ LaTeX: $x^2 + y^2 = z^2$)"
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y bg-slate-50 text-black placeholder-slate-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Send className="w-4 h-4" /> Bình luận
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900">
                <Link href="/login" className="text-cyan-800 font-semibold hover:underline">Đăng nhập</Link> để bình luận
              </div>
            )}

            {/* Comments tree */}
            {loadingComments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-slate-900 text-sm">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                Chưa có bình luận. Hãy là người đầu tiên!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {comments.map(comment => (
                  <CommentNode
                    key={comment.id}
                    comment={comment}
                    postId={postId}
                    currentUserId={currentUserId}
                    token={token}
                    depth={0}
                    onUpdate={loadComments}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
