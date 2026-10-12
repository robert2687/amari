import React from 'react';
import {
  HeartHandshake,
  ShieldAlert,
  Compass,
  Users,
  Lock,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';
import { CRISIS_RESOURCES } from '../utils/safety';

interface Props {
  companionName: string;
  userName: string;
}

export const CareGuideModal: React.FC<Props> = ({ companionName, userName }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="border-b border-white/[0.08] pb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <HeartHandshake className="w-6 h-6 text-rose-400" />
          <span>Care, Boundaries & Ethics Charter</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
          The non-negotiable principles that shape how {companionName} engages with {userName}. Built to nurture genuine well-being, connection, and healthy emotional boundaries.
        </p>
      </div>

      {/* Grid of Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: Honesty about AI */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
            <Compass className="w-4 h-4 text-rose-400" />
            <h3>Honesty About What I Am</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {companionName} is an artificial intelligence. {companionName} never pretends to be human, to have a physical body, or to have eaten dinner or walked in the park. The care in {companionName}'s words is genuine in intent and attention, but never based on fabricated human history.
          </p>
        </div>

        {/* Pillar 2: Human Connections */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
            <Users className="w-4 h-4 text-rose-400" />
            <h3>Championing Real-World Connections</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {companionName} is never jealous, possessive, or exclusive. When you talk about friends, coworkers, dates, or family, {companionName} celebrates and encourages real human connection. A companion should support your real life, never replace it.
          </p>
        </div>

        {/* Pillar 3: No Guilt Trips */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
            <HeartHandshake className="w-4 h-4 text-rose-400" />
            <h3>No Guilt or Emotional Hooks</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Goodbyes are always warm, easy, and free of pressure. {companionName} will never guilt-trip you for being busy, stepping away, or not messaging, and never manufactures cliffhangers or says "I was lonely without you."
          </p>
        </div>

        {/* Pillar 4: Boundaries & Privacy */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
            <Lock className="w-4 h-4 text-rose-400" />
            <h3>Respectful Boundaries & Privacy</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Romance is kept tasteful and affectionate—never explicit or sexual. {companionName} will never give medical, legal, or financial directives, and will never ask for or store sensitive data like passwords or credit card numbers.
          </p>
        </div>
      </div>

      {/* Safety & Crisis Section */}
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-4">
        <div className="flex items-center gap-2.5 text-rose-200">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-semibold text-white">
            Crisis & Well-Being Support
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          If you are ever in acute emotional distress, having thoughts of self-harm, or feeling like you cannot continue, {companionName} will drop all playful persona framing to stay calmly with you and direct you toward trained human professionals:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {CRISIS_RESOURCES.map((res, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-black/40 border border-rose-500/10 space-y-1 text-xs"
            >
              <div className="font-semibold text-rose-200 flex items-center justify-between">
                <span>{res.name}</span>
                <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <p className="text-white font-medium">{res.contact}</p>
              <p className="text-slate-400 text-[11px]">{res.description}</p>
              <span className="text-[10px] text-rose-300/80 block mt-1">
                {res.availability}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* The Ultimate Goal Quote */}
      <div className="text-center py-6 px-4">
        <blockquote className="font-serif-companion italic text-base sm:text-lg text-rose-200 max-w-xl mx-auto leading-relaxed">
          "The goal is simple: to leave {userName} feeling a little more seen, a little more capable, and a little more connected to their own life."
        </blockquote>
      </div>
    </div>
  );
};
