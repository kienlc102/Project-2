'use client';

import { useEffect, useRef } from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders text containing LaTeX math expressions.
 * Supports:
 *   - Block math: $$...$$ or \[...\]
 *   - Inline math: $...$ or \(...\)
 * Non-math text is rendered as plain text (preserving newlines).
 */
export default function MathRenderer({ content, className = '' }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const render = async () => {
      const katex = (await import('katex')).default;

      // Split content into segments: math (block/inline) and plain text
      const segments: { type: 'text' | 'block-math' | 'inline-math'; value: string }[] = [];

      // Match $$...$$, \[...\], $...$, \(...\)
      const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]+?\$|\\\([\s\S]*?\\\))/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = mathRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
        }
        const raw = match[0];
        const isBlock = raw.startsWith('$$') || raw.startsWith('\\[');
        let formula = raw;
        if (raw.startsWith('$$')) formula = raw.slice(2, -2);
        else if (raw.startsWith('\\[')) formula = raw.slice(2, -2);
        else if (raw.startsWith('$')) formula = raw.slice(1, -1);
        else if (raw.startsWith('\\(')) formula = raw.slice(2, -2);
        segments.push({ type: isBlock ? 'block-math' : 'inline-math', value: formula });
        lastIndex = match.index + raw.length;
      }

      if (lastIndex < content.length) {
        segments.push({ type: 'text', value: content.slice(lastIndex) });
      }

      // Build HTML
      let html = '';
      for (const seg of segments) {
        if (seg.type === 'text') {
          // Escape HTML and preserve newlines
          const escaped = seg.value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>');
          html += `<span>${escaped}</span>`;
        } else {
          try {
            const rendered = katex.renderToString(seg.value, {
              displayMode: seg.type === 'block-math',
              throwOnError: false,
              trust: false,
            });
            if (seg.type === 'block-math') {
              html += `<div class="katex-block my-3">${rendered}</div>`;
            } else {
              html += `<span class="katex-inline">${rendered}</span>`;
            }
          } catch {
            html += `<span class="text-rose-500">[LaTeX error: ${seg.value}]</span>`;
          }
        }
      }

      containerRef.current!.innerHTML = `<p>${html}</p>`;
    };

    render();
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`math-content prose prose-slate max-w-none ${className}`}
    />
  );
}
