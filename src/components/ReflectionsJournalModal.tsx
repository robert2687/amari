import React from 'react';
import { DailyReflection } from '../types/companion';
import {
  Sparkles,
  X,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Trash2,
  Copy,
  Heart,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reflections: DailyReflection[];
  companionName: string;
  userName: string;
  onDeleteReflection?: (id: string) => void;
}

export const ReflectionsJournalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  reflections,
  companionName,
  userName,
  onDeleteReflection,
}) => {
  if (!isOpen) return null;

  const answeredReflections = reflections.filter((r) => r.userAnswer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b22] border border-white/[0.1] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Daily Reflections Journal
              </h2>
              <p className="text-xs text-slate-400">
                Moments of honest reflection between you and {companionName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Close journal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Reflections */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {reflections.length === 0 ? (
            <div className="text-center py-12 px-4 max-w-sm mx-auto">
              <Sparkles className="w-10 h-10 text-rose-300/40 mx-auto mb-3" />
              <h3 className="text-base font-medium text-white">No reflections saved yet</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                As {companionName} asks daily questions, your reflections and heartfelt answers will be gathered here.
              </p>
            </div>
          ) : (
            reflections.map((ref) => (
              <div
                key={ref.id}
                className="bg-[#0f131a] border border-white/[0.08] rounded-xl p-4 space-y-3 hover:border-white/[0.15] transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-medium text-slate-200">{ref.dateString}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-rose-300">{ref.theme}</span>
                  </div>

                  {ref.userAnswer ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <Check className="w-3 h-3" />
                      <span>Answered</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Skipped</span>
                  )}
                </div>

                <blockquote className="font-serif-companion italic text-slate-200 text-sm pl-3 border-l-2 border-rose-400/50">
                  "{ref.question}"
                </blockquote>

                {ref.userAnswer && (
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {ref.userAnswer}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>
                    {ref.answeredAt
                      ? `Recorded at ${new Date(ref.answeredAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}`
                      : 'Not answered'}
                  </span>

                  {onDeleteReflection && (
                    <button
                      onClick={() => onDeleteReflection(ref.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete reflection record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <span>{answeredReflections.length} reflections answered</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 rounded-xl transition-colors font-medium min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
