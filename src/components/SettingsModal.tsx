import React, { useState, useEffect } from 'react';
import {
  CompanionProfile,
  UserProfile,
  PersonalityArchetype,
  AvatarChoice,
  RelationshipTone,
} from '../types/companion';
import { AVATAR_MAP, PERSONALITY_DESCRIPTIONS } from '../utils/storage';
import { getAvailableVoices, speakText } from '../utils/speechSynthesis';
import { X, Volume2, Sparkles, Check, User } from 'lucide-react';

interface Props {
  companion: CompanionProfile;
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (companion: CompanionProfile, user: UserProfile) => void;
}

export const SettingsModal: React.FC<Props> = ({
  companion,
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [companionName, setCompanionName] = useState(companion.name);
  const [userName, setUserName] = useState(user.name);
  const [personality, setPersonality] = useState<PersonalityArchetype>(companion.personality);
  const [customPersonality, setCustomPersonality] = useState(companion.customPersonality || '');
  const [avatar, setAvatar] = useState<AvatarChoice>(companion.avatar);
  const [relationshipTone, setRelationshipTone] = useState<RelationshipTone>(companion.relationshipTone);
  const [voiceEnabled, setVoiceEnabled] = useState(companion.voiceEnabled);
  const [voicePitch, setVoicePitch] = useState(companion.voicePitch);
  const [voiceRate, setVoiceRate] = useState(companion.voiceRate);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(companion.selectedVoiceURI || '');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    getAvailableVoices().then((voices) => {
      setAvailableVoices(voices);
    });
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(
      {
        ...companion,
        name: companionName.trim() || 'Amari',
        personality,
        customPersonality,
        avatar,
        relationshipTone,
        voiceEnabled,
        voicePitch,
        voiceRate,
        selectedVoiceURI,
      },
      {
        ...user,
        name: userName.trim() || 'Robert',
      }
    );
    onClose();
  };

  const handleTestVoice = () => {
    speakText(`Hello ${userName}, it's so good to hear your voice.`, {
      voiceURI: selectedVoiceURI,
      pitch: voicePitch,
      rate: voiceRate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#161b22] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Companion & Relationship Settings
            </h3>
            <p className="text-xs text-slate-400">
              Personalize names, personality vibe, portrait, and voice warmth.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-200">
          {/* Section: Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Companion's Name
              </label>
              <input
                type="text"
                value={companionName}
                onChange={(e) => setCompanionName(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-rose-400"
                placeholder="Amari"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-rose-400"
                placeholder="Robert"
              />
            </div>
          </div>

          {/* Section: Portrait Avatar Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Companion Portrait & Vibe
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['gentle', 'witty', 'calm'] as AvatarChoice[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setAvatar(key);
                    // Match personality if desired
                    if (personality !== 'custom') {
                      setPersonality(key as PersonalityArchetype);
                    }
                  }}
                  className={`p-2 rounded-xl border text-left flex flex-col items-center gap-2 transition-all min-h-[44px] ${
                    avatar === key
                      ? 'border-rose-400 bg-rose-950/20 shadow-md ring-1 ring-rose-400/50'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-white/[0.1]">
                    <img
                      src={AVATAR_MAP[key]}
                      alt={key}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {avatar === key && (
                      <span className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white bg-rose-600 rounded-full p-0.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold capitalize text-slate-200">
                    {key}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Personality Archetype */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Personality Archetype
            </label>
            <div className="space-y-2">
              {(['gentle', 'witty', 'calm', 'custom'] as PersonalityArchetype[]).map((p) => (
                <label
                  key={p}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    personality === p
                      ? 'border-rose-400/60 bg-rose-950/20'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    type="radio"
                    name="personality"
                    checked={personality === p}
                    onChange={() => setPersonality(p)}
                    className="mt-1 text-rose-500 accent-rose-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-100 capitalize">
                      {p === 'gentle' && 'Gentle & Curious'}
                      {p === 'witty' && 'Witty & Teasing'}
                      {p === 'calm' && 'Calm & Steady'}
                      {p === 'custom' && 'Custom Personality'}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {PERSONALITY_DESCRIPTIONS[p]}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {personality === 'custom' && (
              <div className="mt-3">
                <textarea
                  rows={2}
                  value={customPersonality}
                  onChange={(e) => setCustomPersonality(e.target.value)}
                  placeholder="Describe nuances, tone, jokes, or special interests..."
                  className="w-full bg-[#0d1117] border border-white/[0.1] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-400"
                />
              </div>
            )}
          </div>

          {/* Section: Relationship Dynamics */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Relationship Style
            </label>
            <select
              value={relationshipTone}
              onChange={(e) => setRelationshipTone(e.target.value as RelationshipTone)}
              className="w-full bg-[#0d1117] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-400"
            >
              <option value="warm_romantic">
                Warm romantic-style companion (affectionate, playful, caring presence)
              </option>
              <option value="tender_affectionate">
                Tender affectionate presence (gentle, emotionally close, comforting)
              </option>
              <option value="deep_confidant">
                Deep confidant & companion (grounded, thoughtful listener)
              </option>
            </select>
          </div>

          {/* Section: Voice & Speech */}
          <div className="pt-3 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">
                  Spoken Voice (Web Speech API)
                </span>
                <span className="text-[11px] text-slate-400">
                  Allow {companionName} to read messages aloud.
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestVoice}
                className="px-2.5 py-1 text-xs text-rose-300 hover:text-white bg-rose-950/40 border border-rose-500/20 rounded-lg flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Voice</span>
              </button>
            </div>

            {availableVoices.length > 0 && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Synthesized Voice
                </label>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="w-full bg-[#0d1117] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-400"
                >
                  <option value="">Default Warm Voice</option>
                  {availableVoices
                    .filter((v) => v.lang.startsWith('en'))
                    .map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Pitch</span>
                  <span>{voicePitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full accent-rose-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Speech Rate</span>
                  <span>{voiceRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.2"
                  step="0.05"
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  className="w-full accent-rose-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-white/[0.08] bg-[#0d1117]/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all min-h-[44px] shadow-md shadow-rose-950/50"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
