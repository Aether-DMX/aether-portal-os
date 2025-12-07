import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, PlusCircle, Zap } from 'lucide-react';

export default function DMXEffectsMenu() {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'My Effects', icon: FolderOpen, path: '/my-effects', description: 'View saved effects' },
    { name: 'Scene Creator', icon: PlusCircle, path: '/scene-creator', description: 'Create new scenes' },
    { name: 'Chase Creator', icon: Zap, path: '/chase-creator', description: 'Create new chases' },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-primary pt-[60px] pb-3 px-4">
      <div className="h-[calc(100vh-66px)] flex flex-col items-center justify-center gap-10">
        <h1 className="text-4xl font-bold text-white text-center" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          DMX Effects
        </h1>
        
        <div className="flex gap-6">
          {menuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="premium-card glass-panel rounded-2xl border-2 p-8 transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4"
              style={{
                width: '200px',
                height: '240px',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="w-20 h-20 rounded-xl flex items-center justify-center premium-glow"
                style={{
                  background: 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))',
                  boxShadow: '0 0 20px rgba(var(--theme-primary-rgb), 0.5), 0 8px 16px rgba(0, 0, 0, 0.3)'
                }}>
                <item.icon size={40} style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-white text-center">{item.name}</span>
              <span className="text-sm text-white/60 text-center">{item.description}</span>
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

export const DMXEffectsMenuHeaderExtension = () => null;
