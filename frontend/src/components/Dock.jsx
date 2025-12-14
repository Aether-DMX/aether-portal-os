import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useDMXStore from '../store/dmxStore';
// Import custom icons
import scenesIcon from '../assets/icons/Scenes_Icon.png';
import aiIcon from '../assets/icons/AI_Assistant.png';
import chasesIcon from '../assets/icons/Chases_Icon.png';
import settingsIcon from '../assets/icons/Settings_Icon.png';
import showsIcon from '../assets/icons/Show_Icon.png';

const dockItems = [
  { id: 'blackout', emoji: '⏻', label: 'Blackout', action: 'blackout' },
  { id: 'scenes', img: scenesIcon, label: 'Scenes', path: '/scenes' },
  { id: 'chases', img: chasesIcon, label: 'Chases', path: '/chases' },
  { id: 'aether', img: aiIcon, label: 'Aether AI', action: 'openAI', accent: true },
  { id: 'shows', img: showsIcon, label: 'Shows', path: '/shows' },
  { id: 'more', img: settingsIcon, label: 'More', path: '/more' },
];

export default function Dock({ onAIClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { blackoutAll } = useDMXStore();

  const handleDockClick = (item) => {
    if (item.action === 'blackout') {
      blackoutAll(1, 1500);
    } else if (item.action === 'openAI') {
      if (onAIClick) onAIClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // Don't show dock on certain pages
  const hiddenPaths = ['/aether-ai', '/console', '/scenes', '/chases', '/shows'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="dock">
      <div className="dock-bar">
        {dockItems.map((item) => (
          <button
            key={item.id}
            className={`dock-btn ${item.id === 'blackout' ? 'blackout-btn' : ''}`}
            onClick={() => handleDockClick(item)}
            aria-label={item.label}
          >
            <div className={`dock-icon ${item.accent ? 'accent-bg' : ''}`}>
              {item.img ? (
                <img src={item.img} alt={item.label} style={{ width: 40, height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              ) : (
                item.emoji
              )}
            </div>
            <span className="dock-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
