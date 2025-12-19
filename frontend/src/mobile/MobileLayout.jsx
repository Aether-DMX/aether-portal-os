import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Layers, Repeat, Sliders, Settings } from 'lucide-react';

const navItems = [
  { id: 'live', icon: Home, label: 'Live', path: '/mobile' },
  { id: 'scenes', icon: Layers, label: 'Scenes', path: '/mobile/scenes' },
  { id: 'chases', icon: Repeat, label: 'Chases', path: '/mobile/chases' },
  { id: 'fixtures', icon: Sliders, label: 'Fixtures', path: '/mobile/fixtures' },
  { id: 'more', icon: Settings, label: 'More', path: '/mobile/more' },
];

export default function MobileLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ 
      height: '100vh', width: '100vw', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', top: 0, left: 0
    }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/aether_logo.png" alt="AETHER" style={{ width: 28, height: 28 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>AETHER</span>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>MOBILE</span>
      </div>

      {/* Content - scrollable with touch */}
      <div style={{ 
        flex: 1, overflow: 'auto', padding: 12, 
        WebkitOverflowScrolling: 'touch', 
        touchAction: 'pan-y',
        overscrollBehavior: 'contain'
      }}>
        {children}
      </div>

      {/* Bottom Nav */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', flexShrink: 0 }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button key={item.id} onClick={() => navigate(item.path)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', padding: '10px 4px' }}>
              <item.icon size={20} color={isActive ? '#a855f7' : 'rgba(255,255,255,0.4)'} />
              <span style={{ fontSize: 9, color: isActive ? '#a855f7' : 'rgba(255,255,255,0.4)' }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
