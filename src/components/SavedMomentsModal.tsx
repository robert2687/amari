import React from 'react';
import { SavedMoment } from '../types/companion';
import { Bookmark, Trash2, Copy, Check, Heart, Sparkles } from 'lucide-react';

interface Props {
  moments: SavedMoment[];
  companionName: string;
  userName: string;
  onDeleteMoment: (id: string) => void;
  onNavigateToChat: () => void;
}

export const SavedMomentsModal: React.FC<Props> = ({
  moments,
  companionName,
  userName,
  onDeleteMoment,
  onNavigateToChat,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="border-b border-white/[0.08] pb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-rose-400" />
          <span>Saved Moments & Quotes</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
          Meaningful words, comfort, and thoughts from {companionName} that resonated with {userName}.
        </p>
      </div>

      {moments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.1] rounded-2xl p-6">
          <Heart className="w-10 h-10 text-rose-400/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">
            No saved moments yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            During conversations, click the bookmark icon on any message from {companionName} to save quotes, comforting words, or reminders here.
          </p>
          <button
            onClick={onNavigateToChat}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Return to Chat</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {moments.map((moment) => (
            <div
              key={moment.id}
              className="p-5 rounded-2xl bg-[#161b22] border border-white/[0.08] hover:border-rose-500/20 transition-all flex flex-col gap-3"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-serif-companion italic text-rose-300">
                    {companionName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {new Date(moment.timestamp).toLocaleDateString([], {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(moment.id, moment.text)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                    title="Copy quote"
                  >
                    {copiedId === moment.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteMoment(moment.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <blockquote className="font-serif-companion text-slate-100 text-[15px] sm:text-base leading-relaxed pl-3 border-l border-rose-400/50 italic">
                "{moment.text}"
              </blockquote>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
