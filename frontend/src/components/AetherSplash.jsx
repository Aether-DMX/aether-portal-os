import React, { useEffect, useState } from 'react';

export default function AetherSplash({ onComplete, duration = 3000 }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), duration - 500);
    const t3 = setTimeout(() => onComplete?.(), duration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete, duration]);

  return (
    <div className={`fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col items-center justify-center transition-opacity duration-500 ${phase === 2 ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--theme-primary)]/20 rounded-full blur-[150px] animate-pulse" />
      </div>
      <div className={`relative transition-all duration-700 ${phase >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="relative">
          <svg className="w-32 h-32 animate-spin-slow" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#aether-gradient)" strokeWidth="1" strokeDasharray="10 5" className="opacity-40" />
            <defs><linearGradient id="aether-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--theme-primary)" /><stop offset="100%" stopColor="#60a5fa" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--theme-primary)] to-blue-500 flex items-center justify-center shadow-lg shadow-[var(--theme-primary)]/30">
              <span className="text-4xl font-black text-white tracking-tighter">A</span>
            </div>
          </div>
        </div>
      </div>
      <div className={`mt-8 text-center transition-all duration-700 delay-300 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          <span className="bg-gradient-to-r from-[var(--theme-primary)] to-blue-400 bg-clip-text text-transparent">AETHER</span>
          <span className="text-white/80 font-light ml-2">DMX</span>
        </h1>
        <p className="text-white/40 text-sm tracking-widest uppercase">Your Lighting Tech</p>
      </div>
      <div className={`mt-8 flex gap-1 transition-opacity duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        {[0, 1, 2].map(i => (<div key={i} className="w-2 h-2 rounded-full bg-[var(--theme-primary)] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />))}
      </div>
      <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 20s linear infinite; }`}</style>
    </div>
  );
}
