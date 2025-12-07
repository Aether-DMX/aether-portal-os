import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Sliders, Image, Users, Zap, Clock, Radio, Settings, ArrowLeft } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home', hideNav: false },
  { path: '/faders', icon: Sliders, label: 'Faders', hideNav: true },
  { path: '/scenes', icon: Image, label: 'Scenes', hideNav: true },
  { path: '/groups', icon: Users, label: 'Groups', hideNav: true },
  { path: '/chases', icon: Zap, label: 'Chases', hideNav: true },
  { path: '/schedules', icon: Clock, label: 'Schedule', hideNav: true },
  { path: '/stage', icon: Radio, label: 'Stage', hideNav: true },
  { path: '/settings', icon: Settings, label: 'Settings', hideNav: false },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentRoute = navItems.find(item => item.path === location.pathname);
  const showNav = !currentRoute?.hideNav;

  return (
    <div className="h-screen flex overflow-hidden bg-black" style={{ maxHeight: '480px', maxWidth: '800px' }}>
      {showNav && (
        <nav className="glass-panel m-2 p-1.5 flex flex-col gap-0.5" style={{ width: '70px' }}>
          <div className="text-center py-1.5 mb-0.5 border-b border-white/10">
            <div className="text-base font-bold accent-gradient bg-clip-text text-transparent">DMX</div>
          </div>

          <div className="flex-1 space-y-0.5 overflow-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className={`w-full p-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all text-[9px]
                    ${isActive ? 'bg-accent-500/20 border border-accent-500' : 'hover:bg-white/5'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent-400' : 'text-slate-400'}`} />
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {!showNav && (
        <button onClick={() => navigate('/')} className="fixed top-3 left-3 z-50 glass-button px-3 py-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
