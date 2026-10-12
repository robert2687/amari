import React, { useState, useRef } from 'react';
import { DailyReflection, CompanionProfile, UserProfile } from '../types/companion';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  BookOpen,
  Check,
  X,
  Mic,
  MicOff,
  Clock,
  Heart,
  Calendar,
  Smile,
  MessageCircle,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  reflection: DailyReflection | null;
  companion: CompanionProfile;
  user: UserProfile;
  isLoading: boolean;
  onAnswerReflection: (
    reflectionId: string,
    answer: string,
    sendToChat: boolean
  ) => Promise<void>;
  onSkipReflection: (reflectionId: string) => void;
  onRefreshReflection?: () => void;
  onOpenHistory?: () => void;
}

export const DailyReflectionCard: React.FC<Props> = ({
  reflection,
  companion,
  user,
  isLoading,
  onAnswerReflection,
  onSkipReflection,
  onRefreshReflection,
  onOpenHistory,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [answerText, setAnswerText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [showEdit, setShowEdit] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (isLoading && !reflection) {
    return (
      <div className="bg-[#161b22]/90 border border-white/[0.08] rounded-2xl p-4 shadow-md animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-400/20" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-white/10 rounded w-1/4" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!reflection) return null;

  // Don't show if skipped for today unless user manually expands or edits
  if (reflection.isSkipped && !showEdit) {
    return (
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-rose-300" />
          <span>Daily reflection skipped for today</span>
        </div>
        <button
          onClick={() => {
            setShowEdit(true);
            setIsExpanded(true);
          }}
          className="text-rose-300 hover:text-white transition-colors underline text-[11px]"
        >
          Reflect now
        </button>
      </div>
    );
  }

  const isAnswered = !!reflection.userAnswer && !showEdit;

  const handleVoiceToggle = async () => {
    if (isVoiceRecording) {
      triggerHaptic('stop');
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsVoiceRecording(false);
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length === 0) return;

        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64, mimeType: blob.type }),
            });
            const data = await res.json();
            if (data.text) {
              setAnswerText((prev) => (prev ? `${prev} ${data.text}` : data.text));
              triggerHaptic('success');
            }
          } catch (err) {
            console.error('Transcription error for reflection:', err);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      triggerHaptic('start');
      setIsVoiceRecording(true);
    } catch (err) {
      console.error('Voice toggle error:', err);
    }
  };

  const handleSubmit = async (sendToChat: boolean) => {
    if (!answerText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      triggerHaptic('start');
      await onAnswerReflection(reflection.id, answerText.trim(), sendToChat);
      setShowEdit(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-gradient-to-r from-[#161a24] via-[#1a1724] to-[#161a24] border border-rose-500/25 hover:border-rose-400/40 rounded-2xl p-4 shadow-xl transition-all duration-300 relative overflow-hidden group">
      {/* Subtle background ambient warmth */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide uppercase text-rose-300">
                Daily Reflection
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">· {formattedDate}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {reflection.theme || 'Deepening Our Connection'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-lg transition-colors text-xs flex items-center gap-1"
              title="View past reflections history"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Journal</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-lg transition-colors"
            title={isExpanded ? 'Collapse reflection' : 'Expand reflection'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3.5 space-y-3 pt-3 border-t border-white/[0.08]">
          {/* Question Prompt */}
          <div className="space-y-1">
            {reflection.contextHint && (
              <p className="text-[11px] text-rose-300/80 italic">
                {reflection.contextHint}
              </p>
            )}
            <blockquote className="font-serif-companion italic text-slate-100 text-[15px] sm:text-base leading-relaxed pl-3 border-l-2 border-rose-400/60">
              "{reflection.question}"
            </blockquote>
          </div>

          {/* If already answered */}
          {isAnswered ? (
            <div className="bg-[#0f131a]/80 border border-white/[0.08] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Answered today</span>
                </span>
                {reflection.answeredAt && (
                  <span>
                    {new Date(reflection.answeredAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {reflection.userAnswer}
              </p>
              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setAnswerText(reflection.userAnswer || '');
                    setShowEdit(true);
                  }}
                  className="text-xs text-rose-300 hover:text-white transition-colors underline"
                >
                  Edit your reflection
                </button>
              </div>
            </div>
          ) : (
            /* Input for Answering */
            <div className="space-y-2.5">
              <div className="relative bg-[#0d1117] border border-white/[0.1] focus-within:border-rose-400/50 rounded-xl p-2.5 transition-colors">
                <textarea
                  rows={2}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={`Share with ${companion.name}, or note this down for yourself...`}
                  className="w-full bg-transparent border-0 resize-none text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
                />

                <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                      isVoiceRecording
                        ? 'bg-rose-950/80 text-rose-300 animate-pulse'
                        : 'hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                    title="Dictate reflection using microphone"
                  >
                    {isVoiceRecording ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                        <span>Recording... tap to stop</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Voice input</span>
                      </>
                    )}
                  </button>

                  <span>{answerText.length} characters</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    onSkipReflection(reflection.id);
                    triggerHaptic('cancel');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-2 min-h-[40px] flex items-center"
                >
                  Maybe later
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!answerText.trim() || isSubmitting}
                    onClick={() => handleSubmit(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.1] rounded-xl transition-colors disabled:opacity-40 min-h-[40px] flex items-center"
                    title="Save to your private reflections journal"
                  >
                    Save Privately
                  </button>

                  <button
                    type="button"
                    disabled={!answerText.trim() || isSubmitting}
                    onClick={() => handleSubmit(true)}
                    className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 min-h-[40px] active:scale-95"
                    title={`Send reflection into chat for ${companion.name}'s warm response`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Share with {companion.name}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
