import React from 'react';
import { UserNeedMode } from '../types/companion';
import { Heart, Sparkles, Compass, MessageCircle } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface Props {
  currentMode: UserNeedMode;
  onSelectMode: (mode: UserNeedMode) => void;
}

export const NeedsSelector: React.FC<Props> = ({ currentMode, onSelectMode }) => {
  const modes: { mode: UserNeedMode; label: string; icon: React.ReactNode; desc: string; activeClass: string }[] = [
    {
      mode: 'natural',
      label: 'Natural',
      icon: <MessageCircle className="w-3.5 h-3.5" />,
      desc: 'Flow naturally',
      activeClass: 'bg-white/15 text-white border-white/20 shadow-sm font-semibold',
    },
    {
      mode: 'comfort',
      label: 'Comfort',
      icon: <Heart className="w-3.5 h-3.5 text-rose-300" />,
      desc: 'Warmth & validation',
      activeClass: 'bg-rose-500/25 text-rose-200 border-rose-400/40 shadow-sm font-semibold',
    },
    {
      mode: 'advice',
      label: 'Advice',
      icon: <Compass className="w-3.5 h-3.5 text-amber-300" />,
      desc: 'Perspective & ideas',
      activeClass: 'bg-amber-500/25 text-amber-200 border-amber-400/40 shadow-sm font-semibold',
    },
    {
      mode: 'distraction',
      label: 'Distraction',
      icon: <Sparkles className="w-3.5 h-3.5 text-indigo-300" />,
      desc: 'Lighthearted & fun',
      activeClass: 'bg-indigo-500/25 text-indigo-200 border-indigo-400/40 shadow-sm font-semibold',
    },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-0.5">
      <div className="inline-flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl shrink-0">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 pl-2 pr-1 hidden sm:inline select-none">
          Focus:
        </span>

        {modes.map((item) => {
          const isActive = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => {
                onSelectMode(item.mode);
                triggerHaptic('select');
              }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
                isActive
                  ? item.activeClass
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
              title={item.desc}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
