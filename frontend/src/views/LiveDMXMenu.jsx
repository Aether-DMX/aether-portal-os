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
      <div className="h-[calc(100vh-66px)] flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold text-white text-center" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          Live DMX Control
        </h1>

        <div className="flex gap-4">
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="premium-card glass-panel rounded-2xl border-2 p-6 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-3"
              style={{
                width: '180px',
                height: '200px',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="w-16 h-16 rounded-xl flex items-center justify-center premium-glow"
                style={{
                  background: 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))',
                  boxShadow: '0 0 20px rgba(var(--theme-primary-rgb), 0.5), 0 8px 16px rgba(0, 0, 0, 0.3)'
                }}>
                <item.icon size={32} style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold text-white text-center">{item.name}</span>
              <span className="text-xs text-white/60 text-center">{item.description}</span>
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
