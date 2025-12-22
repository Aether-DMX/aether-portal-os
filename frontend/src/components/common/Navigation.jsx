import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Sliders, Image, Users, Layers, Zap, Clock, Radio, Settings, Power } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/faders', icon: Sliders, label: 'Faders' },
  { path: '/scenes', icon: Image, label: 'Scenes' },
  { path: '/fixtures', icon: Layers, label: 'Fixtures' },
  { path: '/chases', icon: Zap, label: 'Chases' },
  { path: '/schedules', icon: Clock, label: 'Schedules' },
  { path: '/stage', icon: Radio, label: 'Stage' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="w-28 glass-panel m-4 p-4 flex flex-col gap-3">
      <div className="text-center py-4 mb-2 border-b border-white/10">
        <div className="text-2xl font-bold accent-gradient bg-clip-text text-transparent tracking-tight">
          DMX
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full p-4 rounded-xl flex flex-col items-center gap-2 transition-all
                ${isActive 
                  ? 'bg-accent-500/20 border-2 border-accent-500 shadow-lg shadow-accent-500/20' 
                  : 'hover:bg-white/5 border-2 border-transparent'
                }`}
            >
              <Icon className={`w-7 h-7 ${isActive ? 'text-accent-400' : 'text-slate-400'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <button className="w-full p-4 rounded-xl flex flex-col items-center gap-2 hover:bg-red-500/10 border-2 border-transparent hover:border-red-500/50 transition-all">
        <Power className="w-7 h-7 text-red-400" />
        <span className="text-xs font-medium text-red-400">Logout</span>
      </button>
    </nav>
  );
}
