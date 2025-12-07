import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Sliders, Image, Users, Zap, Calendar, Box, Settings, Menu, X, ArrowLeft } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const isHome = location.pathname === '/';

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/faders', icon: Sliders, label: 'Faders' },
    { path: '/scenes', icon: Image, label: 'Scenes' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/chases', icon: Zap, label: 'Chases' },
    { path: '/schedules', icon: Calendar, label: 'Schedules' },
    { path: '/stage', icon: Box, label: 'Stage' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  if (!isHome) {
    // Collapsed navbar with back button
    return (
      <div className="fixed left-4 top-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="w-14 h-14 bg-[#1a1a2e] border-2 border-[var(--theme-primary)] rounded-xl flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-[#0f0f19] transition-all shadow-lg"
        >
          <ArrowLeft size={24} />
        </button>
      </div>
    );
  }

  // Full navbar on home screen
  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-[#1a1a2e] border-r border-[#2a2a3e] flex flex-col items-center py-4 gap-2 z-50">
      {/* Logo */}
      <div className="w-14 h-14 bg-gradient-to-br from-[var(--theme-primary)] to-[#ff6496] rounded-xl mb-4 flex items-center justify-center">
        <span className="text-white font-bold text-lg">DMX</span>
      </div>

      {/* Nav Items */}
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all ${
              isActive 
                ? 'bg-[var(--theme-primary)] text-[#0f0f19]' 
                : 'text-[#78788c] hover:bg-[#2a2a3e] hover:text-[#dcdce6]'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Navbar;
