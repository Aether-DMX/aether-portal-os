import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Sliders, Image, Zap, Layers, Film, Calendar, Timer,
  Box, Settings, Users, ChevronLeft, ChevronRight, Sparkles, Radio
} from 'lucide-react';

const navSections = [
  {
    title: 'Control',
    items: [
      { path: '/', icon: Home, label: 'Dashboard', shortcut: '1' },
      { path: '/scenes', icon: Image, label: 'Scenes', shortcut: '2' },
      { path: '/chases', icon: Zap, label: 'Chases', shortcut: '3' },
      { path: '/faders', icon: Sliders, label: 'Faders', shortcut: '4' },
      { path: '/effects', icon: Sparkles, label: 'Effects', shortcut: '5' },
    ]
  },
  {
    title: 'Show',
    items: [
      { path: '/looks', icon: Image, label: 'Looks', shortcut: '6' },
      { path: '/cue-stacks', icon: Layers, label: 'Cue Stacks', shortcut: '7' },
      { path: '/shows', icon: Film, label: 'Shows', shortcut: '8' },
      { path: '/schedules', icon: Calendar, label: 'Schedules' },
      { path: '/timers', icon: Timer, label: 'Timers' },
    ]
  },
  {
    title: 'System',
    items: [
      { path: '/fixtures', icon: Box, label: 'Fixtures', shortcut: '9' },
      { path: '/nodes', icon: Radio, label: 'Nodes', shortcut: '0' },
      { path: '/more', icon: Settings, label: 'Settings' },
    ]
  }
];

export default function DesktopSidebar({ collapsed, onToggle, width = 220 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <aside
      className={`desktop-sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{ width: collapsed ? 64 : width }}
    >
      {/* Collapse toggle */}
      <button className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Navigation sections */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            {!collapsed && <div className="nav-section-title">{section.title}</div>}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={20} className="nav-icon" />
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.shortcut && (
                        <span className="nav-shortcut">{item.shortcut}</span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <style>{`
        .desktop-sidebar {
          background: rgba(15, 15, 25, 0.95);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          transition: width 0.2s ease;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }

        .sidebar-toggle {
          position: absolute;
          top: 12px;
          right: -12px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(30, 30, 45, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
        }

        .sidebar-toggle:hover {
          background: rgba(50, 50, 70, 0.95);
          color: white;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 8px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .nav-section {
          margin-bottom: 24px;
        }

        .nav-section-title {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.3);
          padding: 0 12px;
          margin-bottom: 8px;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .desktop-sidebar.collapsed .nav-item {
          justify-content: center;
          padding: 12px;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
        }

        .nav-item.active {
          background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.15);
          color: var(--theme-primary, #00ffaa);
        }

        .nav-item.active .nav-icon {
          color: var(--theme-primary, #00ffaa);
        }

        .nav-icon {
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-shortcut {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }

        /* Scrollbar */
        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
      `}</style>
    </aside>
  );
}
