import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Layers, Repeat, Sliders, Settings, MoreHorizontal } from 'lucide-react';

const navItems = [
  { id: 'live', icon: Home, label: 'Live', path: '/', altPaths: ['/mobile'] },
  { id: 'scenes', icon: Layers, label: 'Scenes', path: '/scenes', altPaths: ['/mobile/scenes'] },
  { id: 'chases', icon: Repeat, label: 'Chases', path: '/chases', altPaths: ['/mobile/chases'] },
  { id: 'fixtures', icon: Sliders, label: 'Fixtures', path: '/fixtures', altPaths: ['/mobile/fixtures'] },
  { id: 'more', icon: MoreHorizontal, label: 'More', path: '/more', altPaths: ['/mobile/more'] },
];

export default function MobileLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if a nav item is active (matches path or alt paths)
  const isActive = (item) => {
    return item.path === location.pathname || item.altPaths?.includes(location.pathname);
  };

  return (
    <div className="mobile-layout">
      {/* Header - with safe area for notch */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div className="mobile-logo">
            <img src="/aether_logo.png" alt="AETHER" className="mobile-logo-img" />
            <span className="mobile-logo-text">AETHER</span>
          </div>
          <span className="mobile-badge">MOBILE</span>
        </div>
      </header>

      {/* Content - scrollable with touch */}
      <main className="mobile-content">
        {children}
      </main>

      {/* Bottom Nav - with safe area for home indicator */}
      <nav className="mobile-nav">
        {navItems.map(item => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className="mobile-nav-icon" />
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
