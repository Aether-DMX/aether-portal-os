import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Sliders, Eye } from 'lucide-react';

export default function LiveDMXMenu() {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Console', icon: LayoutDashboard, path: '/console', description: 'Live control surface' },
    { name: 'Faders', icon: Sliders, path: '/faders', description: 'Manual channel control' },
    { name: 'View Live', icon: Eye, path: '/view-live', description: 'Monitor all outputs' },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-primary pt-[60px] pb-3 px-4">
      <div className="h-[calc(100vh-66px)] flex flex-col items-center justify-center gap-[clamp(16px,4vh,24px)]">
        <h1 className="text-[clamp(1.25rem,4vw,1.875rem)] font-bold text-white text-center" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          Live DMX Control
        </h1>

        <div className="flex flex-wrap justify-center gap-[clamp(10px,2.5vw,16px)]">
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="premium-card glass-panel rounded-2xl border-2 p-[clamp(12px,2.5vw,24px)] transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-[clamp(6px,1.5vh,12px)]"
              style={{
                width: 'clamp(110px, 22vw, 180px)',
                height: 'clamp(130px, 30vh, 200px)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="rounded-xl flex items-center justify-center premium-glow"
                style={{
                  width: 'clamp(40px, 10vw, 64px)',
                  height: 'clamp(40px, 10vw, 64px)',
                  background: 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))',
                  boxShadow: '0 0 20px rgba(var(--theme-primary-rgb), 0.5), 0 8px 16px rgba(0, 0, 0, 0.3)'
                }}>
                <item.icon style={{ width: 'clamp(20px, 5vw, 32px)', height: 'clamp(20px, 5vw, 32px)', color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} strokeWidth={2.5} />
              </div>
              <span className="text-[clamp(0.875rem,2.5vw,1.125rem)] font-bold text-white text-center">{item.name}</span>
              <span className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-white/60 text-center">{item.description}</span>
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

export const LiveDMXMenuHeaderExtension = () => null;
