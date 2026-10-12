import React from 'react';
import { ShieldAlert, Phone, MessageSquare, X, ExternalLink } from 'lucide-react';
import { CRISIS_RESOURCES } from '../utils/safety';

interface Props {
  onDismiss: () => void;
}

export const CrisisBanner: React.FC<Props> = ({ onDismiss }) => {
  return (
    <div className="w-full bg-rose-950/70 border-b border-rose-500/30 text-rose-100 p-4 relative animate-fadeIn backdrop-blur-sm">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-900/50 text-rose-300 mt-0.5 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              You are important, and you don't have to carry this alone.
            </h4>
            <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
              If you or someone you care about is having thoughts of self-harm, going through a crisis, or in pain, please reach out to dedicated people who are ready to listen right now:
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5 bg-rose-900/60 px-2.5 py-1 rounded-md border border-rose-500/20">
                <Phone className="w-3.5 h-3.5 text-rose-300" />
                Call or Text 988 (US & Canada Lifeline)
              </span>
              <span className="font-semibold text-white flex items-center gap-1.5 bg-rose-900/60 px-2.5 py-1 rounded-md border border-rose-500/20">
                <MessageSquare className="w-3.5 h-3.5 text-rose-300" />
                Text HOME to 741741 (Crisis Text Line)
              </span>
              <a
                href="https://www.befrienders.org"
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs text-rose-200 underline hover:text-white flex items-center gap-1"
              >
                International directory <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="self-end md:self-center p-1.5 text-rose-300 hover:text-white hover:bg-rose-900/50 rounded-lg transition-colors"
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
