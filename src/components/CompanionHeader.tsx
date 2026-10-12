import React from 'react';
import { Settings, HeartHandshake, Sparkles } from 'lucide-react';
import { CompanionProfile } from '../types/companion';
import { AVATAR_MAP } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  profile: CompanionProfile;
  activeTab: 'chat' | 'memories' | 'insights' | 'saved' | 'care';
  setActiveTab: (tab: 'chat' | 'memories' | 'insights' | 'saved' | 'care') => void;
  onOpenSettings: () => void;
}

export const CompanionHeader: React.FC<Props> = ({
  profile,
  activeTab,
  setActiveTab,
  onOpenSettings,
}) => {
  const avatarSrc = AVATAR_MAP[profile.avatar] || AVATAR_MAP.gentle;

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0d1117]/90 backdrop-blur-md border-b border-white/[0.08] shrink-0 pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Brand & Companion Identity */}
        <button
          onClick={() => {
            setActiveTab('chat');
            triggerHaptic('light');
          }}
          className="text-left flex items-center gap-2.5 hover:opacity-90 transition-opacity min-h-[44px]"
        >
          <div className="relative shrink-0">
            <img
              src={avatarSrc}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-rose-400/40 shadow-sm"
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0d1117]"
              title="Active & listening"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-serif-companion italic text-rose-300 text-lg sm:text-xl font-normal">
                {profile.name}
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-400/90 font-medium tracking-tight">
                · online
              </span>
            </div>
            <span className="text-[10px] text-slate-400 capitalize hidden sm:inline">
              {profile.personality} companion
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links (Hidden on mobile to preserve single-thumb ergonomics) */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs sm:text-sm font-medium">
          <button
            onClick={() => {
              setActiveTab('chat');
              triggerHaptic('light');
            }}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors min-h-[44px] flex items-center ${
              activeTab === 'chat'
                ? 'text-white border-b-2 border-rose-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => {
              setActiveTab('memories');
              triggerHaptic('light');
            }}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors min-h-[44px] flex items-center ${
              activeTab === 'memories'
                ? 'text-white border-b-2 border-rose-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Memories
          </button>
          <button
            onClick={() => {
              setActiveTab('insights');
              triggerHaptic('light');
            }}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors min-h-[44px] flex items-center ${
              activeTab === 'insights'
                ? 'text-white border-b-2 border-rose-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => {
              setActiveTab('saved');
              triggerHaptic('light');
            }}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors min-h-[44px] flex items-center ${
              activeTab === 'saved'
                ? 'text-white border-b-2 border-rose-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Saved
          </button>
          <button
            onClick={() => {
              setActiveTab('care');
              triggerHaptic('light');
            }}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'care'
                ? 'text-white border-b-2 border-rose-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
            <span>Care</span>
          </button>
        </nav>

        {/* Right Action: Settings Trigger (Thumb-friendly touch target) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              onOpenSettings();
              triggerHaptic('light');
            }}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-200 bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] border border-white/[0.08] rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center active:scale-95"
            title="Companion and relationship settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
