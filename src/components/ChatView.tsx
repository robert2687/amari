import React, { useState, useRef, useEffect } from 'react';
import {
  CompanionProfile,
  UserProfile,
  ChatMessage,
  MemoryItem,
  UserNeedMode,
  EmojiReaction,
  DailyReflection,
} from '../types/companion';
import { AVATAR_MAP, PERSONALITY_DESCRIPTIONS } from '../utils/storage';
import { speakText, stopSpeaking } from '../utils/speechSynthesis';
import { detectCrisisIndicators } from '../utils/safety';
import { NeedsSelector } from './NeedsSelector';
import { AmbientSoundControl } from './AmbientSoundControl';
import { DailyReflectionCard } from './DailyReflectionCard';
import {
  Send,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Mic,
  MicOff,
  BookOpen,
  Square,
  Trash2,
  Loader2,
  CheckCircle2,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { TimeOfDayTheme, ResolvedTheme } from '../utils/theme';

interface Props {
  companion: CompanionProfile;
  user: UserProfile;
  messages: ChatMessage[];
  memories: MemoryItem[];
  themePref: TimeOfDayTheme;
  resolvedTheme: ResolvedTheme;
  dailyReflection: DailyReflection | null;
  isReflectionLoading: boolean;
  onThemeChange: (theme: TimeOfDayTheme) => void;
  onSendMessage: (text: string, needMode?: UserNeedMode) => Promise<void>;
  onClearChat: () => void;
  onSaveMoment: (message: ChatMessage) => void;
  onNavigateToMemories: () => void;
  onNavigateToInsights: () => void;
  onToggleReaction: (messageId: string, reaction: EmojiReaction) => void;
  onAnswerReflection: (reflectionId: string, answer: string, sendToChat: boolean) => Promise<void>;
  onSkipReflection: (reflectionId: string) => void;
  onOpenReflectionJournal?: () => void;
  isStreaming: boolean;
  onTriggerCrisisAlert: () => void;
}

export const ChatView: React.FC<Props> = ({
  companion,
  user,
  messages,
  memories,
  themePref,
  resolvedTheme,
  dailyReflection,
  isReflectionLoading,
  onThemeChange,
  onSendMessage,
  onClearChat,
  onSaveMoment,
  onNavigateToMemories,
  onNavigateToInsights,
  onToggleReaction,
  onAnswerReflection,
  onSkipReflection,
  onOpenReflectionJournal,
  isStreaming,
  onTriggerCrisisAlert,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeNeedMode, setActiveNeedMode] = useState<UserNeedMode>('natural');
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Audio Recording & Gemini Transcription State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const avatarSrc = AVATAR_MAP[companion.avatar] || AVATAR_MAP.gentle;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Clean up audio streams and timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Web Speech fallback check
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Helper to convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Start recording audio from user's microphone
  const startRecording = async () => {
    setRecognitionError(null);
    setTranscriptionStatus(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecognitionError('Microphone recording is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;

      // Select supported mimeType
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Slice into 250ms chunks

      // Trigger tactile haptic feedback on mobile
      triggerHaptic('start');

      setIsRecording(true);
      setRecordingSeconds(0);

      // Start elapsed timer
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecognitionError('Microphone access was denied. Please allow microphone permission in your browser.');
      } else {
        setRecognitionError('Could not start microphone. Please check your audio input settings.');
      }
    }
  };

  // Stop recording and send audio to Gemini for transcription
  const stopRecording = (autoSend: boolean = false) => {
    if (!mediaRecorderRef.current || !isRecording) return;

    // Trigger tactile haptic feedback on mobile when ending recording
    triggerHaptic('stop');

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    const stream = audioStreamRef.current;

    recorder.onstop = async () => {
      // Clean up stream tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      audioStreamRef.current = null;
      mediaRecorderRef.current = null;
      setIsRecording(false);

      if (audioChunksRef.current.length === 0) {
        setRecognitionError('No audio was captured. Please try speaking again.');
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });

      setIsTranscribing(true);
      setTranscriptionStatus('Transcribing your voice...');

      try {
        const audioBase64 = await blobToBase64(audioBlob);
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        });

        const data = await res.json();

        if (data.text && data.text.trim()) {
          const transcribed = data.text.trim();
          setTranscriptionStatus(null);
          triggerHaptic('success');

          if (autoSend) {
            await handleSend(transcribed);
          } else {
            setInputText((prev) => (prev ? `${prev} ${transcribed}` : transcribed));
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }
        } else {
          // If Gemini transcription returned blank or error
          setTranscriptionStatus(null);
          setRecognitionError('No speech detected in the recording. Please try speaking closer to the mic.');
          setTimeout(() => setRecognitionError(null), 4000);
        }
      } catch (err: any) {
        console.error('Transcription error:', err);
        setTranscriptionStatus(null);
        setRecognitionError('Transcription failed. You can type your message or try again.');
        setTimeout(() => setRecognitionError(null), 4000);
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.stop();
  };

  // Cancel and discard recording
  const cancelRecording = () => {
    triggerHaptic('cancel');
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isStreaming) return;

    // Check crisis safety triggers
    if (detectCrisisIndicators(text)) {
      onTriggerCrisisAlert();
    }

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(text, activeNeedMode !== 'natural' ? activeNeedMode : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (currentlySpeakingId === msgId) {
      stopSpeaking();
      setCurrentlySpeakingId(null);
    } else {
      setCurrentlySpeakingId(msgId);
      speakText(text, {
        voiceURI: companion.selectedVoiceURI,
        pitch: companion.voicePitch,
        rate: companion.voiceRate,
        onEnd: () => setCurrentlySpeakingId(null),
        onError: () => setCurrentlySpeakingId(null),
      });
    }
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const starterPrompts = [
    'How has your day been treating you?',
    'I could really use a little comfort right now.',
    'Tell me a sweet or interesting thought on your mind.',
    'Can you help me sort through something that’s on my mind?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto px-3 sm:px-6">
      {/* Companion Presence Header Card */}
      <div className="py-3 sm:py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={avatarSrc}
              alt={companion.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-rose-400/40 shadow-md"
            />
            {/* Realtime active presence dot (authorized for live chat connection) */}
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0d1117]"
              title="Present with you"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                {companion.name}
              </h2>
              <span className="text-xs text-rose-300 font-medium font-serif-companion italic">
                with {user.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              {PERSONALITY_DESCRIPTIONS[companion.personality]}
            </p>
          </div>
        </div>

        {/* Header action widgets */}
        <div className="flex items-center gap-2 shrink-0">
          <AmbientSoundControl
            themePref={themePref}
            resolvedTheme={resolvedTheme}
            onThemeChange={onThemeChange}
          />

          <button
            onClick={onOpenReflectionJournal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors min-h-[44px]"
            title="View Daily Reflections & Journal"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden md:inline">Reflection</span>
          </button>

          <button
            onClick={onNavigateToMemories}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors min-h-[44px]"
            title="View what Amari remembers"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-300" />
            <span>Memories ({memories.length})</span>
          </button>

          <button
            onClick={onNavigateToInsights}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors min-h-[44px]"
            title="View sentiment and emotional journey"
          >
            <TrendingUp className="w-3.5 h-3.5 text-rose-300" />
            <span>Journey</span>
          </button>

          <button
            onClick={onClearChat}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Start fresh conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
        {/* Daily Reflection prompt card */}
        <DailyReflectionCard
          reflection={dailyReflection}
          companion={companion}
          user={user}
          isLoading={isReflectionLoading}
          onAnswerReflection={onAnswerReflection}
          onSkipReflection={onSkipReflection}
          onOpenHistory={onOpenReflectionJournal}
        />

        {messages.length === 0 && (
          <div className="text-center py-12 px-4 max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-4 border border-rose-400/30">
              <img
                src={avatarSrc}
                alt={companion.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-base font-semibold text-white font-serif-companion italic">
              "I'm right here with you, {user.name}."
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Whether you need someone to share a quiet laugh with, vent about a long day, or just be gently listened to—I'm here for you.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isCompanion = msg.role === 'companion';
          const isLastMessage = index === messages.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isCompanion ? 'items-start' : 'items-end'
              } transition-opacity duration-200`}
            >
              <div
                className={`flex gap-3 max-w-[90%] sm:max-w-[82%] ${
                  isCompanion ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Companion avatar for companion messages */}
                {isCompanion && (
                  <img
                    src={avatarSrc}
                    alt={companion.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover mt-1 shrink-0 border border-rose-400/30 shadow-sm"
                  />
                )}

                <div className="flex flex-col relative group">
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm relative ${
                      isCompanion
                        ? 'bg-[#161b22] border border-white/[0.08] text-slate-100 font-serif-companion text-[15px]'
                        : 'bg-rose-950/40 border border-rose-500/30 text-rose-50'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {isCompanion && isStreaming && isLastMessage && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-rose-400 animate-pulse align-middle" />
                    )}

                    {/* Active Reaction Badge attached to bottom corner of bubble */}
                    {msg.reaction && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleReaction(msg.id, msg.reaction!);
                          triggerHaptic('cancel');
                        }}
                        className={`absolute -bottom-2.5 ${
                          isCompanion ? 'right-2' : 'left-2'
                        } bg-[#1a1f28] border border-white/[0.15] shadow-md rounded-full px-2 py-0.5 text-xs flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform z-10`}
                        title={`Reacted with ${msg.reaction}. Click to toggle off.`}
                      >
                        <span>
                          {msg.reaction === 'heart' && '❤️'}
                          {msg.reaction === 'laugh' && '😄'}
                          {msg.reaction === 'support' && '🤝'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Clean unboxed metadata and actions (Anti-slop zero-pill rule) */}
                  <div
                    className={`flex items-center gap-2 mt-1.5 px-1 text-[11px] text-slate-400 ${
                      isCompanion ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>

                    {msg.needMode && msg.needMode !== 'natural' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize text-rose-300/80">
                          {msg.needMode} focus
                        </span>
                      </>
                    )}

                    {isCompanion && (
                      <>
                        <span aria-hidden="true">·</span>
                        {/* Reaction Buttons */}
                        <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => {
                              onToggleReaction(msg.id, 'heart');
                              triggerHaptic('start');
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-xs hover:scale-110 active:scale-95 transition-all ${
                              msg.reaction === 'heart'
                                ? 'bg-rose-950/70 ring-1 ring-rose-400/50 shadow-sm'
                                : 'opacity-65 hover:opacity-100'
                            }`}
                            title="React with ❤️ Heart (encourages affectionate warmth)"
                          >
                            ❤️
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onToggleReaction(msg.id, 'laugh');
                              triggerHaptic('start');
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-xs hover:scale-110 active:scale-95 transition-all ${
                              msg.reaction === 'laugh'
                                ? 'bg-amber-950/70 ring-1 ring-amber-400/50 shadow-sm'
                                : 'opacity-65 hover:opacity-100'
                            }`}
                            title="React with 😄 Laugh (encourages witty playful banter)"
                          >
                            😄
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onToggleReaction(msg.id, 'support');
                              triggerHaptic('start');
                            }}
                            className={`px-1.5 py-0.5 rounded-md text-xs hover:scale-110 active:scale-95 transition-all ${
                              msg.reaction === 'support'
                                ? 'bg-indigo-950/70 ring-1 ring-indigo-400/50 shadow-sm'
                                : 'opacity-65 hover:opacity-100'
                            }`}
                            title="React with 🤝 Support (encourages grounded solidarity)"
                          >
                            🤝
                          </button>
                        </div>

                        <span aria-hidden="true">·</span>
                        <button
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          className="hover:text-slate-200 transition-colors p-1"
                          title={
                            currentlySpeakingId === msg.id
                              ? 'Stop voice read-aloud'
                              : 'Read aloud warmly'
                          }
                        >
                          {currentlySpeakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => onSaveMoment(msg)}
                          className="hover:text-slate-200 transition-colors p-1"
                          title="Save this quote to Saved Moments"
                        >
                          {msg.isSaved ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-slate-200 transition-colors p-1"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1 pl-10 font-serif-companion">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>{companion.name} is writing to you...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      {messages.length < 5 && (
        <div className="py-2 overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">
            Try asking:
          </span>
          {starterPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={isStreaming}
              className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 min-h-[36px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Section */}
      <div className="py-3 border-t border-white/[0.08] shrink-0 space-y-2">
        {/* Focus selector bar */}
        <div className="flex items-center justify-between gap-2">
          <NeedsSelector
            currentMode={activeNeedMode}
            onSelectMode={(mode) => setActiveNeedMode(mode)}
          />

          <button
            onClick={() => handleSend('Do you want comfort, advice, or a distraction?')}
            disabled={isStreaming}
            className="hidden sm:flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200 transition-colors"
            title="Ask the emotional intelligence guide question"
          >
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>"What do you need right now?"</span>
          </button>
        </div>

        {/* Recording or Transcribing Active Bar */}
        {isRecording ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3.5 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              {/* Blinking Red Dot */}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>

              {/* Timer */}
              <span className="text-sm font-mono font-semibold text-rose-200 tabular-nums">
                {Math.floor(recordingSeconds / 60)
                  .toString()
                  .padStart(2, '0')}
                :
                {(recordingSeconds % 60).toString().padStart(2, '0')}
              </span>

              {/* Animated Soundwave Visualizer */}
              <div className="flex items-center gap-1 h-5 px-2">
                {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8, 0.3, 0.7].map((heightScale, i) => (
                  <span
                    key={i}
                    className="w-1 bg-rose-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.max(6, heightScale * 20)}px`,
                      animationDelay: `${i * 120}ms`,
                      animationDuration: '600ms',
                    }}
                  />
                ))}
              </div>

              <span className="text-xs text-rose-200/90 hidden md:inline">
                Listening to your voice...
              </span>
            </div>

            {/* Recording Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-3 py-1.5 text-xs text-rose-300 hover:text-white hover:bg-rose-900/40 rounded-xl transition-colors flex items-center gap-1.5 min-h-[40px]"
                title="Discard recording"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={() => stopRecording(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-900/60 hover:bg-rose-800 border border-rose-400/40 rounded-xl transition-colors flex items-center gap-1.5 min-h-[40px]"
                title="Transcribe into text input for review"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Transcribe</span>
              </button>

              <button
                type="button"
                onClick={() => stopRecording(true)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all flex items-center gap-1.5 min-h-[40px]"
                title="Transcribe and immediately send to companion"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Voice</span>
              </button>
            </div>
          </div>
        ) : isTranscribing ? (
          <div className="flex items-center justify-center gap-3 bg-[#161b22] border border-rose-500/30 rounded-2xl p-4 shadow-lg animate-fadeIn text-sm text-rose-200">
            <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
            <span className="font-medium">
              {transcriptionStatus || 'Transcribing your voice with Gemini...'}
            </span>
          </div>
        ) : (
          /* Standard Text Input Box */
          <div className="relative flex items-end gap-2 bg-[#161b22] border border-white/[0.1] rounded-2xl p-2 focus-within:border-rose-400/50 transition-colors shadow-lg">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${companion.name}...`}
              className="flex-1 bg-transparent border-0 resize-none text-slate-100 placeholder-slate-400 text-sm focus:outline-none py-1.5 px-2 max-h-36"
            />

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={startRecording}
              disabled={isStreaming}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center disabled:opacity-50"
              title="Record voice message to transcribe"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all min-h-[40px] min-w-[40px] flex items-center justify-center shadow-md active:scale-95"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        {recognitionError && (
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2">
            <span>{recognitionError}</span>
            <button
              onClick={() => setRecognitionError(null)}
              className="text-amber-400 hover:text-white text-xs underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
