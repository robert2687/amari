import React, { useRef, useState } from 'react';
import { CompanionProfile, UserProfile } from '../types/companion';
import { AVATAR_MAP, PERSONALITY_DESCRIPTIONS } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';
import {
  X,
  Settings,
  BookOpen,
  Volume2,
  Sparkles,
  RotateCcw,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  CloudRain,
  Flame,
} from 'lucide-react';
import { TimeOfDayTheme, ResolvedTheme, THEMES } from '../utils/theme';
import { ambientSound } from '../utils/ambientAudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companion: CompanionProfile;
  user: UserProfile;
  memoriesCount: number;
  themePref: TimeOfDayTheme;
  resolvedTheme: ResolvedTheme;
  onThemeChange: (theme: TimeOfDayTheme) => void;
  onOpenSettings: () => void;
  onNavigateToMemories: () => void;
  onClearChat: () => void;
}

export const CompanionProfileDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  companion,
  user,
  memoriesCount,
  themePref,
  resolvedTheme,
  onThemeChange,
  onOpenSettings,
  onNavigateToMemories,
  onClearChat,
}) => {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [currentTranslateY, setCurrentTranslateY] = useState<number>(0);
  const [currentSoundMode, setCurrentSoundMode] = useState<'off' | 'rain' | 'fireplace' | 'twilight'>(() =>
    ambientSound.getMode()
  );

  if (!isOpen) return null;

  const avatarSrc = AVATAR_MAP[companion.avatar] || AVATAR_MAP.gentle;
  const currentThemeConfig = THEMES[resolvedTheme];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const deltaY = e.touches[0].clientY - touchStartY;
    if (deltaY > 0) {
      setCurrentTranslateY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentTranslateY > 80) {
      triggerHaptic('cancel');
      onClose();
    }
    setCurrentTranslateY(0);
    setTouchStartY(null);
  };

  const handleSoundSelect = (mode: 'off' | 'rain' | 'fireplace' | 'twilight') => {
    triggerHaptic('select');
    if (mode === 'off') {
      ambientSound.stop();
      setCurrentSoundMode('off');
    } else {
      ambientSound.play(mode);
      setCurrentSoundMode(mode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom Sheet Drawer */}
      <div
        className="relative w-full max-w-lg bg-[#161b22] border-t border-white/[0.12] rounded-t-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col pb-safe z-10 transition-transform duration-150"
        style={{
          transform: currentTranslateY > 0 ? `translateY(${currentTranslateY}px)` : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-rose-300">
              Companion Presence
            </span>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl active:bg-white/[0.06] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5 text-slate-200">
          {/* Avatar and Identity */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={avatarSrc}
                alt={companion.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-rose-400/40 shadow-xl"
              />
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#161b22]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight font-serif-companion italic">
                  {companion.name}
                </h3>
                <span className="text-xs text-emerald-400 font-medium">· Active now</span>
              </div>
              <p className="text-xs text-rose-300 font-medium capitalize mt-0.5">
                {companion.relationshipTone}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {PERSONALITY_DESCRIPTIONS[companion.personality]}
              </p>
            </div>
          </div>

          {/* Quick Stats / Shortcuts */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                triggerHaptic('select');
                onNavigateToMemories();
                onClose();
              }}
              className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] active:bg-white/[0.12] text-left transition-all active:scale-95 min-h-[56px]"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px]">Stored Memories</span>
                <BookOpen className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-base font-bold text-white font-mono tabular-nums">
                {memoriesCount} <span className="text-xs font-normal text-slate-400">notes</span>
              </div>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenSettings();
                onClose();
              }}
              className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] active:bg-white/[0.12] text-left transition-all active:scale-95 min-h-[56px]"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px]">Personality</span>
                <Settings className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-sm font-semibold text-white capitalize truncate">
                {companion.personality}
              </div>
            </button>
          </div>

          {/* Atmosphere Lighting System */}
          <div className="space-y-2 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                <span>Atmosphere Lighting</span>
              </span>
              <span className="text-[11px] text-slate-400">{currentThemeConfig.name}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onThemeChange('auto')}
                className={`px-2.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all min-h-[44px] active:scale-95 ${
                  themePref === 'auto'
                    ? 'bg-rose-950/60 border border-rose-500/40 text-rose-200 font-semibold'
                    : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Auto</span>
              </button>

              {(['dawn', 'afternoon', 'sunset', 'midnight'] as ResolvedTheme[]).slice(0, 2).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onThemeChange(key)}
                  className={`px-2.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all min-h-[44px] active:scale-95 capitalize ${
                    themePref === key
                      ? 'bg-rose-950/60 border border-rose-500/40 text-rose-200 font-semibold'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {key === 'dawn' ? <Sunrise className="w-3.5 h-3.5 text-orange-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ambient Background Sounds */}
          <div className="space-y-2 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Background Ambient Sounds</span>
              </span>
              <span className="text-[11px] text-slate-400 capitalize">{currentSoundMode}</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleSoundSelect('off')}
                className={`py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all min-h-[44px] active:scale-95 ${
                  currentSoundMode === 'off'
                    ? 'bg-white/15 text-white font-semibold'
                    : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                }`}
              >
                <span>Mute</span>
              </button>
              <button
                type="button"
                onClick={() => handleSoundSelect('rain')}
                className={`py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all min-h-[44px] active:scale-95 ${
                  currentSoundMode === 'rain'
                    ? 'bg-blue-950/60 border border-blue-500/40 text-blue-200 font-semibold'
                    : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-blue-300" />
                <span>Rain</span>
              </button>
              <button
                type="button"
                onClick={() => handleSoundSelect('fireplace')}
                className={`py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all min-h-[44px] active:scale-95 ${
                  currentSoundMode === 'fireplace'
                    ? 'bg-amber-950/60 border border-amber-500/40 text-amber-200 font-semibold'
                    : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Fire</span>
              </button>
              <button
                type="button"
                onClick={() => handleSoundSelect('twilight')}
                className={`py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all min-h-[44px] active:scale-95 ${
                  currentSoundMode === 'twilight'
                    ? 'bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 font-semibold'
                    : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span>Night</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="px-5 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('cancel');
              onClearChat();
              onClose();
            }}
            className="flex-1 py-2.5 px-3 text-xs text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.14] rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Fresh Chat</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('select');
              onOpenSettings();
              onClose();
            }}
            className="flex-1 py-2.5 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[44px] shadow-md active:scale-95"
          >
            <Settings className="w-4 h-4" />
            <span>Customize</span>
          </button>
        </div>
      </div>
    </div>
  );
};
