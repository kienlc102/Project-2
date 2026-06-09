'use client';

import { useState, useRef, useCallback } from 'react';
import { Eye, Edit3, X, Paperclip, Tag, Plus, Upload, Loader2 } from 'lucide-react';
import MathRenderer from './MathRenderer';
import { Attachment, uploadAttachment, getFileIcon, formatFileSize } from '@/lib/forum';
import { getToken } from '@/lib/auth';

interface ForumEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  initialAttachments?: Attachment[];
  onSubmit: (data: {
    title: string;
    content: string;
    tags: string[];
    attachments: Attachment[];
  }) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

const LATEX_SHORTCUTS = [
  { label: 'x²', insert: 'x^{2}' },
  { label: '√', insert: '\\sqrt{x}' },
  { label: '∑', insert: '\\sum_{i=1}^{n}' },
  { label: '∫', insert: '\\int_{a}^{b}' },
  { label: '→', insert: '\\rightarrow' },
  { label: '≤', insert: '\\leq' },
  { label: '≥', insert: '\\geq' },
  { label: '≠', insert: '\\neq' },
  { label: '∞', insert: '\\infty' },
  { label: 'α', insert: '\\alpha' },
  { label: 'β', insert: '\\beta' },
  { label: 'π', insert: '\\pi' },
  { label: '±', insert: '\\pm' },
  { label: 'frac', insert: '\\frac{a}{b}' },
  { label: 'matrix', insert: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
];

export default function ForumEditor({
  initialTitle = '',
  initialContent = '',
  initialTags = [],
  initialAttachments = [],
  onSubmit,
  submitLabel = 'Đăng bài',
  loading = false,
}: ForumEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertAt = useCallback((text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const newContent = before + text + after;
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }, [content]);

  const insertInlineMath = () => insertAt('$x$');
  const insertBlockMath = () => insertAt('\n$$\nx\n$$\n');

  const insertShortcut = (latex: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const wrapped = selected ? `$${selected}$` : `$${latex}$`;
    const before = content.slice(0, start);
    const after = content.slice(end);
    setContent(before + wrapped + after);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + wrapped.length, start + wrapped.length);
    }, 0);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const token = getToken();
    if (!token) { setUploadError('Bạn cần đăng nhập để tải file'); return; }

    setUploading(true);
    setUploadError('');
    try {
      for (const file of Array.from(files)) {
        const result = await uploadAttachment(token, file);
        if (result.success && result.data) {
          setAttachments(prev => [...prev, result.data!]);
        } else {
          setUploadError(result.message || 'Lỗi tải file');
        }
      }
    } catch {
      setUploadError('Lỗi kết nối khi tải file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, content, tags, attachments });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Tiêu đề <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề bài viết..."
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-base font-medium"
        />
      </div>

      {/* Editor / Preview Toggle */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Nội dung <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${!preview ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${preview ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Eye className="w-3.5 h-3.5" /> Xem trước
            </button>
          </div>
        </div>

        {/* LaTeX Toolbar */}
        {!preview && (
          <div className="mb-1.5 flex flex-wrap gap-1 p-2 bg-slate-50 border border-slate-200 rounded-t-xl border-b-0">
            <button
              type="button"
              onClick={insertInlineMath}
              className="px-2.5 py-1 text-xs font-mono bg-white border border-slate-200 rounded-lg text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300 transition shadow-sm"
              title="Chèn công thức inline $...$"
            >
              $…$
            </button>
            <button
              type="button"
              onClick={insertBlockMath}
              className="px-2.5 py-1 text-xs font-mono bg-white border border-slate-200 rounded-lg text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300 transition shadow-sm"
              title="Chèn công thức block $$...$$"
            >
              $$…$$
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
            {LATEX_SHORTCUTS.map(s => (
              <button
                key={s.label}
                type="button"
                onClick={() => insertShortcut(s.insert)}
                className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-cyan-50 hover:border-cyan-300 transition shadow-sm"
                title={s.insert}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {preview ? (
          <div className="min-h-[200px] p-4 border border-slate-200 rounded-xl bg-white text-black">
            {content ? (
              <MathRenderer content={content} />
            ) : (
              <p className="text-slate-500 italic">Chưa có nội dung...</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={10}
            required
            placeholder={`Viết nội dung bài viết...\n\nHỗ trợ LaTeX:\n• Inline: $x^2 + y^2 = z^2$\n• Block:\n$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$`}
            className="w-full px-4 py-3 border border-slate-200 rounded-b-xl bg-white text-black placeholder:text-slate-500 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm resize-y min-h-[200px]"
          />
        )}

        <p className="mt-1.5 text-xs text-slate-400">
          Hỗ trợ LaTeX: <code className="bg-slate-100 px-1 rounded">$...$</code> (inline) và <code className="bg-slate-100 px-1 rounded">$$...$$</code> (block)
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Tags <span className="text-slate-400 font-normal">(tối đa 10)</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="toán học, vật lý, lập trình..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-black placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 rounded-xl text-sm font-semibold transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-full text-xs font-semibold">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-500 transition">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Tệp đính kèm
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-slate-200 hover:border-cyan-400 rounded-xl p-6 text-center transition bg-slate-50 hover:bg-cyan-50/30 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.json,.xml,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.hpp,.cs,.go,.rs,.php,.rb,.swift,.kt,.scala,.r,.sql,.sh,.bat,.ps1,.yaml,.yml,.toml,.zip"
            onChange={e => handleFileUpload(e.target.files)}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-cyan-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Đang tải lên...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-slate-400" />
              <p className="text-sm text-slate-600 font-medium">Kéo thả hoặc nhấp để chọn file</p>
              <p className="text-xs text-slate-400">PDF, DOC, ảnh, mã nguồn, ... (tối đa 20MB/file)</p>
            </div>
          )}
        </div>

        {uploadError && (
          <p className="mt-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{uploadError}</p>
        )}

        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-xl">{getFileIcon(att.mimetype, att.filename)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{att.filename}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(att.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading || uploading}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
