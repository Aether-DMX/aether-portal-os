import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Timer, Layers, Film } from 'lucide-react';

export default function SchedulesMenu() {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Cue Stacks', icon: Layers, path: '/cue-stacks', description: 'Theatrical cueing' },
    { name: 'Shows', icon: Film, path: '/shows', description: 'Automated sequences' },
    { name: 'Schedules', icon: Calendar, path: '/schedules', description: 'Time-based automation' },
    { name: 'Timers', icon: Timer, path: '/timers', description: 'Countdown events' },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-primary pt-[60px] pb-3 px-4">
      <div className="h-[calc(100vh-66px)] flex flex-col items-center justify-center gap-[clamp(24px,6vh,48px)]">
        <h1 className="text-[clamp(1.5rem,5vw,2.5rem)] font-bold text-white text-center" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          Show Control
        </h1>

        <div className="flex flex-wrap justify-center gap-[clamp(12px,3vw,24px)]">
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="premium-card glass-panel rounded-2xl border-2 p-[clamp(16px,3vw,32px)] transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-[clamp(8px,2vh,16px)]"
              style={{
                width: 'clamp(140px, 28vw, 220px)',
                height: 'clamp(150px, 35vh, 240px)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="rounded-xl flex items-center justify-center premium-glow"
                style={{
                  width: 'clamp(48px, 12vw, 80px)',
                  height: 'clamp(48px, 12vw, 80px)',
                  background: 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))',
                  boxShadow: '0 0 20px rgba(var(--theme-primary-rgb), 0.5), 0 8px 16px rgba(0, 0, 0, 0.3)'
                }}>
                <item.icon style={{ width: 'clamp(24px, 6vw, 40px)', height: 'clamp(24px, 6vw, 40px)', color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} strokeWidth={2.5} />
              </div>
              <span className="text-[clamp(0.875rem,2.5vw,1.25rem)] font-bold text-white text-center">{item.name}</span>
              <span className="text-[clamp(0.75rem,2vw,0.875rem)] text-white/60 text-center">{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export const SchedulesMenuHeaderExtension = () => null;
