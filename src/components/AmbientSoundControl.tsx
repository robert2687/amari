import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Flame,
  Moon,
  VolumeX,
  Volume2,
  Sun,
  Sunrise,
  Sunset,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ambientSound } from '../utils/ambientAudio';
import {
  TimeOfDayTheme,
  ResolvedTheme,
  THEMES,
  getAutoThemeForHour,
  loadThemePreference,
  saveThemePreference,
} from '../utils/theme';

interface Props {
  themePref: TimeOfDayTheme;
  resolvedTheme: ResolvedTheme;
  onThemeChange: (theme: TimeOfDayTheme) => void;
}

export const AmbientSoundControl: React.FC<Props> = ({
  themePref,
  resolvedTheme,
  onThemeChange,
}) => {
  const [currentSoundMode, setCurrentSoundMode] = useState<
    'off' | 'rain' | 'fireplace' | 'twilight'
  >('off');
  const [volume, setVolume] = useState<number>(0.25);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    setCurrentSoundMode(ambientSound.getMode());
  }, []);

  const handleSoundSelect = (mode: 'off' | 'rain' | 'fireplace' | 'twilight') => {
    if (mode === 'off') {
      ambientSound.stop();
      setCurrentSoundMode('off');
    } else {
      ambientSound.play(mode);
      setCurrentSoundMode(mode);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ambientSound.setVolume(val);
  };

  const currentThemeConfig = THEMES[resolvedTheme];

  const getThemeIcon = (themeId: ResolvedTheme) => {
    switch (themeId) {
      case 'dawn':
        return <Sunrise className="w-3.5 h-3.5 text-orange-400" />;
      case 'afternoon':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'sunset':
        return <Sunset className="w-3.5 h-3.5 text-rose-400" />;
      case 'midnight':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all min-h-[44px] ${
          currentSoundMode !== 'off'
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08]'
        }`}
        title="Atmosphere & ambient lighting"
      >
        <div className="flex items-center gap-1.5">
          {getThemeIcon(resolvedTheme)}
          <span className="hidden sm:inline text-[11px] text-slate-300">
            {currentThemeConfig.ambientLight}
          </span>
        </div>

        <span className="text-white/20 hidden sm:inline" aria-hidden="true">
          ·
        </span>

        <div className="flex items-center gap-1">
          {currentSoundMode === 'rain' && <CloudRain className="w-3 h-3 text-blue-300" />}
          {currentSoundMode === 'fireplace' && <Flame className="w-3 h-3 text-amber-400" />}
          {currentSoundMode === 'twilight' && <Moon className="w-3 h-3 text-indigo-300" />}
          {currentSoundMode === 'off' && <Volume2 className="w-3 h-3 text-slate-400" />}
          <span className="capitalize text-[11px]">
            {currentSoundMode === 'off' ? 'Sound' : currentSoundMode}
          </span>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:bg-transparent" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[#161b22] border border-white/[0.12] shadow-2xl p-4 z-50 animate-fadeIn text-xs space-y-4 max-w-[calc(100vw-1.5rem)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="font-semibold text-slate-200">
                Atmosphere & Ambiance
              </span>
              <span className="text-[11px] text-rose-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Dynamic Light</span>
              </span>
            </div>

            {/* Time of Day Lighting Themes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Ambient Theme</span>
                <span className="text-slate-300 font-medium">
                  {themePref === 'auto' ? 'Auto Time Sync' : 'Custom Lighting'}
                </span>
              </div>

              {/* Theme Options */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onThemeChange('auto')}
                  className={`px-2.5 py-2 rounded-xl text-left border flex items-center gap-2 transition-colors min-h-[36px] col-span-2 ${
                    themePref === 'auto'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-100 font-medium ring-1 ring-rose-400/30'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate">
                      Auto (Sync with time)
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Current: {currentThemeConfig.name}
                    </div>
                  </div>
                </button>

                {(['dawn', 'afternoon', 'sunset', 'midnight'] as ResolvedTheme[]).map((themeKey) => {
                  const t = THEMES[themeKey];
                  const isSelected = themePref === themeKey;

                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => onThemeChange(themeKey)}
                      className={`px-2.5 py-2 rounded-xl text-left border flex items-center gap-2 transition-colors min-h-[36px] ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-100 font-medium ring-1 ring-rose-400/30'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.05]'
                      }`}
                    >
                      {getThemeIcon(themeKey)}
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium truncate">
                          {t.name}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {t.timeRange.split('–')[0].trim()}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ambient Sound Synthesizer */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <span className="text-[11px] text-slate-400 block">
                Background Sound
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSoundSelect('rain')}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors min-h-[36px] ${
                    currentSoundMode === 'rain'
                      ? 'bg-blue-950/60 text-blue-200 font-medium border border-blue-500/30'
                      : 'text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <CloudRain className="w-3.5 h-3.5 text-blue-300" />
                  <span>Rainfall</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSoundSelect('fireplace')}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors min-h-[36px] ${
                    currentSoundMode === 'fireplace'
                      ? 'bg-amber-950/60 text-amber-200 font-medium border border-amber-500/30'
                      : 'text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fireplace</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSoundSelect('twilight')}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors min-h-[36px] ${
                    currentSoundMode === 'twilight'
                      ? 'bg-indigo-950/60 text-indigo-200 font-medium border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Twilight</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSoundSelect('off')}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors min-h-[36px] ${
                    currentSoundMode === 'off'
                      ? 'bg-slate-800 text-slate-200 font-medium'
                      : 'text-slate-400 hover:bg-white/[0.05]'
                  }`}
                >
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Silence</span>
                </button>
              </div>

              {currentSoundMode !== 'off' && (
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-rose-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
