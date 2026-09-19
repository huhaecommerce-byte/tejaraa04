import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface WelcomeOverlayProps {
  name?: string;
  onDone: () => void;
  duration?: number;
}

export const WelcomeOverlay = ({ name, onDone, duration = 1400 }: WelcomeOverlayProps) => {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[10000] flex items-center justify-center mesh-gradient-cta backdrop-blur-xl animate-fade-in"
    >
      <span className="sr-only">Account created successfully. Setting up your dashboard.</span>

      <span className="sparkle-dot top-[20%] left-[20%]" />
      <span className="sparkle-dot top-[25%] right-[22%]" style={{ animationDelay: '0.3s' }} />
      <span className="sparkle-dot bottom-[28%] left-[30%] !w-1.5 !h-1.5" style={{ animationDelay: '0.6s' }} />
      <span className="sparkle-dot bottom-[22%] right-[28%]" style={{ animationDelay: '0.9s' }} />

      <div className="relative bg-white/10 backdrop-blur-2xl border border-white/25 shadow-2xl rounded-3xl px-10 py-10 max-w-sm mx-4 text-center animate-scale-in">
        <div className="relative mx-auto w-24 h-24 mb-5">
          <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/40">
            <svg
              viewBox="0 0 52 52"
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M14 27 L23 36 L40 18"
                style={{
                  strokeDasharray: 60,
                  strokeDashoffset: 60,
                  animation: 'check-draw 0.6s ease-out 0.15s forwards',
                }}
              />
            </svg>
          </div>
          <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-300 animate-pulse" />
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Welcome{name ? `, ${name.split(' ')[0]}` : ''}! 🎉
        </h2>
        <p className="mt-2 text-white/80 text-sm">Setting up your dashboard…</p>

        <div className="mt-5 flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-white/70"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes check-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default WelcomeOverlay;
