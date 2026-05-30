const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Attachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface ForumPost {
  id: number;
  user_id: number;
  title: string;
  content: string;
  tags: string[];
  attachments: Attachment[];
  upvotes: number;
  downvotes: number;
  comment_count: number;
  score: number;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
  userVote: 'up' | 'down' | null;
}

export interface ForumComment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
  userVote: 'up' | 'down' | null;
  children: ForumComment[];
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ────────── Posts ──────────

export const fetchPosts = async (
  page = 1,
  limit = 20,
  search = '',
  tag = '',
  token?: string
) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/forum/posts?${params}`, { headers });
  return res.json();
};

export const fetchPost = async (id: number, token?: string) => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/forum/posts/${id}`, { headers });
  return res.json();
};

export const createPost = async (
  token: string,
  data: { title: string; content: string; tags: string[]; attachments: Attachment[] }
) => {
  const res = await fetch(`${API_URL}/forum/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updatePost = async (
  token: string,
  id: number,
  data: { title: string; content: string; tags: string[]; attachments: Attachment[] }
) => {
  const res = await fetch(`${API_URL}/forum/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deletePost = async (token: string, id: number) => {
  const res = await fetch(`${API_URL}/forum/posts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const votePost = async (token: string, id: number, voteType: 'up' | 'down' | null) => {
  const res = await fetch(`${API_URL}/forum/posts/${id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ voteType }),
  });
  return res.json();
};

// ────────── Attachments ──────────

export const uploadAttachment = async (token: string, file: File): Promise<{ success: boolean; data?: Attachment; message?: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/forum/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

// ────────── Comments ──────────

export const fetchComments = async (postId: number, token?: string) => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/forum/posts/${postId}/comments`, { headers });
  return res.json();
};

export const createComment = async (
  token: string,
  postId: number,
  content: string,
  parentId?: number | null
) => {
  const res = await fetch(`${API_URL}/forum/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content, parentId: parentId ?? null }),
  });
  return res.json();
};

export const editComment = async (token: string, commentId: number, content: string) => {
  const res = await fetch(`${API_URL}/forum/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  return res.json();
};

export const deleteComment = async (token: string, commentId: number) => {
  const res = await fetch(`${API_URL}/forum/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const voteComment = async (token: string, commentId: number, voteType: 'up' | 'down' | null) => {
  const res = await fetch(`${API_URL}/forum/comments/${commentId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ voteType }),
  });
  return res.json();
};

// ────────── Reputation ──────────

export interface TopUser {
  id: number;
  full_name: string;
  email: string;
  reputation_score: number;
  post_count: number;
}

export const fetchTopUsers = async () => {
  const res = await fetch(`${API_URL}/forum/top-users`);
  return res.json();
};

export const fetchUserPosts = async (userId: number) => {
  const res = await fetch(`${API_URL}/forum/users/${userId}/posts`);
  return res.json();
};

// ────────── Utils ──────────

export const getFileIcon = (mimetype: string, filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype === 'application/pdf' || ext === 'pdf') return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '📑';
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
  if (['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt'].includes(ext)) return '💻';
  if (['json', 'xml', 'yaml', 'yml', 'toml'].includes(ext)) return '⚙️';
  if (['sh', 'bat', 'ps1'].includes(ext)) return '🖥️';
  return '📎';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const timeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};
