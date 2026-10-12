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
    sendToChat: boolean,
    selectedOption?: string
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
  const [isExpanded, setIsExpanded] = useState<boolean>(() => !reflection?.userAnswer);
  const [answerText, setAnswerText] = useState<string>(() => reflection?.userAnswer || '');
  const [selectedOption, setSelectedOption] = useState<string>(() => reflection?.selectedOption || '');
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

  const getReflectionOptions = (ref: DailyReflection): string[] => {
    if (ref.options && ref.options.length > 0) return ref.options;
    const q = (ref.question || '').toLowerCase();
    const t = (ref.theme || '').toLowerCase();
    if (t.includes('weight') || q.includes('put down') || q.includes('tired')) {
      return [
        'Setting work and emails aside early',
        'Taking a long hot shower or bath',
        'Letting tomorrow worry about tomorrow',
        'Curling up without any expectations',
      ];
    }
    if (t.includes('spark') || q.includes('smile') || q.includes('happy')) {
      return [
        'A warm laugh shared with someone',
        'Feeling proud of what I finished',
        'A quiet moment of gratitude',
        'A delightful, unexpected surprise',
      ];
    }
    if (t.includes('anchor') || t.includes('comfort')) {
      return [
        'Setting aside dedicated quiet time',
        'Enjoying a comforting drink or meal',
        'Reconnecting with someone I love',
        'Stepping away into fresh air',
      ];
    }
    if (t.includes('morning')) {
      return [
        'Moving with gentle patience today',
        'Protecting my energy and peace',
        'Staying focused on what truly matters',
        'Being open to small moments of joy',
      ];
    }
    if (t.includes('midday') || t.includes('relief')) {
      return [
        'Stepping away from screens for a bit',
        'Taking a few deep, slow breaths',
        'A soothing warm or cool drink',
        'A kind word or calm message',
      ];
    }
    return [
      'Sitting with a warm cup in peace',
      'Stepping outside into fresh air',
      'Unwinding with music or a favorite show',
      'Letting go of today’s pressure and resting',
    ];
  };

  const reflectionOptions = getReflectionOptions(reflection);

  const handleSubmit = async (sendToChat: boolean) => {
    if (!answerText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      triggerHaptic('start');
      await onAnswerReflection(reflection.id, answerText.trim(), sendToChat, selectedOption || undefined);
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

      {/* Header bar (entire row clickable for quick thumb toggle) */}
      <div
        onClick={() => {
          setIsExpanded(!isExpanded);
          triggerHaptic('light');
        }}
        className="flex items-center justify-between gap-2 cursor-pointer select-none py-1 min-h-[44px]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-rose-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide uppercase text-rose-300">
                Daily Reflection
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">· {formattedDate}</span>
              {isAnswered && (
                <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
                  Answered
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {reflection.theme || 'Deepening Our Connection'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onOpenHistory && (
            <button
              onClick={() => {
                onOpenHistory();
                triggerHaptic('light');
              }}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-lg transition-colors text-xs flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
              title="View past reflections history"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline text-[11px]">Journal</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              triggerHaptic('light');
            }}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
        <div className="mt-3.5 space-y-3.5 pt-3 border-t border-white/[0.08]">
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
            <div className="bg-[#0f131a]/80 border border-white/[0.08] rounded-xl p-3.5 space-y-2.5">
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

              {/* Show selected option if any */}
              {reflection.selectedOption && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-400/30 text-rose-200 text-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300">Selected Option:</span>
                  <span className="text-white font-medium">{reflection.selectedOption}</span>
                </div>
              )}

              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {reflection.userAnswer}
              </p>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setAnswerText(reflection.userAnswer || '');
                    setSelectedOption(reflection.selectedOption || '');
                    setShowEdit(true);
                  }}
                  className="text-xs text-rose-300 hover:text-white transition-colors underline py-1"
                >
                  Edit your answer & options
                </button>
              </div>
            </div>
          ) : (
            /* Input & Options for Answering */
            <div className="space-y-3">
              {/* Interactive Answer Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Choose an Answer Option:</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Tap to answer or customize</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reflectionOptions.map((opt, idx) => {
                    const isSelected = selectedOption === opt || answerText.trim() === opt.trim();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedOption(opt);
                          setAnswerText(opt);
                          triggerHaptic('select');
                        }}
                        className={`w-full text-left p-3 rounded-xl min-h-[48px] flex items-center justify-between gap-2.5 transition-all border active:scale-[0.98] ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-400/60 text-white shadow-md ring-1 ring-rose-400/40 font-medium'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.1] border-white/[0.08] text-slate-200 hover:text-white'
                        }`}
                      >
                        <span className="text-xs sm:text-[13px] leading-snug flex-1">{opt}</span>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                            isSelected
                              ? 'border-rose-400 bg-rose-500 text-white'
                              : 'border-white/20 bg-white/5'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal notes or custom writing */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 block">
                  {selectedOption ? 'Customize or add personal notes:' : 'Or write your own reflection:'}
                </label>
                <div className="relative bg-[#0d1117] border border-white/[0.1] focus-within:border-rose-400/50 rounded-xl p-2.5 transition-colors">
                  <textarea
                    rows={2}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder={`Write your answer, or pick an option above...`}
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
              </div>

              {/* Action buttons (48px min touch target for thumb accessibility) */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSkipReflection(reflection.id);
                    triggerHaptic('cancel');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-2 min-h-[48px] flex items-center active:scale-95"
                >
                  Maybe later
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!answerText.trim() || isSubmitting}
                    onClick={() => handleSubmit(false)}
                    className="px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/[0.1] rounded-xl transition-colors disabled:opacity-40 min-h-[48px] flex items-center active:scale-95"
                    title="Save to your private reflections journal"
                  >
                    Save Privately
                  </button>

                  <button
                    type="button"
                    disabled={!answerText.trim() || isSubmitting}
                    onClick={() => handleSubmit(true)}
                    className="px-4 py-2.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 min-h-[48px] active:scale-95"
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
