'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';

interface VoteButtonsProps {
  score: number;
  userVote: 'up' | 'down' | null;
  onVote: (type: 'up' | 'down' | null) => void;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

export default function VoteButtons({
  score,
  userVote,
  onVote,
  disabled = false,
  orientation = 'vertical',
}: VoteButtonsProps) {
  const handleVote = (type: 'up' | 'down') => {
    if (disabled) return;
    // Toggle off if same vote
    onVote(userVote === type ? null : type);
  };

  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleVote('up')}
          disabled={disabled}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-semibold transition border ${
            userVote === 'up'
              ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
              : 'bg-white border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <ChevronUp className="w-4 h-4" />
          <span>{score}</span>
        </button>
        <button
          type="button"
          onClick={() => handleVote('down')}
          disabled={disabled}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-semibold transition border ${
            userVote === 'down'
              ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-white border-slate-200 text-slate-600 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => handleVote('up')}
        disabled={disabled}
        className={`p-1.5 rounded-lg transition border ${
          userVote === 'up'
            ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
            : 'bg-white border-slate-200 text-slate-500 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title="Upvote"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <span
        className={`text-sm font-bold tabular-nums ${
          score > 0 ? 'text-cyan-600' : score < 0 ? 'text-rose-600' : 'text-slate-500'
        }`}
      >
        {score}
      </span>
      <button
        type="button"
        onClick={() => handleVote('down')}
        disabled={disabled}
        className={`p-1.5 rounded-lg transition border ${
          userVote === 'down'
            ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20'
            : 'bg-white border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title="Downvote"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
