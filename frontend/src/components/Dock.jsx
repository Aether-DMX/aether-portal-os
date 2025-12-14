import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useDMXStore from '../store/dmxStore';

// Import custom icons
import scenesIcon from '../assets/icons/Scenes_Icon.png';
import aiIcon from '../assets/icons/AI_Assistant.png';
import chasesIcon from '../assets/icons/Chases_Icon.png';
import settingsIcon from '../assets/icons/Settings_Icon.png';

const dockItems = [
  { id: 'blackout', emoji: '⏻', label: 'Blackout', action: 'blackout' },
  { id: 'scenes', img: scenesIcon, label: 'Scenes', path: '/scenes' },
  { id: 'aether', img: aiIcon, label: 'AETHER', action: 'openAI', accent: true },
  { id: 'chases', img: chasesIcon, label: 'Chases', path: '/chases' },
  { id: 'more', img: settingsIcon, label: 'More', path: '/more' },
];

export default function Dock({ onAIClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { blackoutAll } = useDMXStore();
  const [showBlackoutConfirm, setShowBlackoutConfirm] = useState(false);

  const handleDockClick = (item) => {
    if (item.action === 'blackout') {
      setShowBlackoutConfirm(true);
    } else if (item.action === 'openAI') {
      if (onAIClick) onAIClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const confirmBlackout = () => {
    blackoutAll(1, 1500);
    setShowBlackoutConfirm(false);
  };

  // Don't show dock on certain pages
  const hiddenPaths = ['/aether-ai', '/console'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <>
      <div className="dock">
        <div className="dock-bar">
          {dockItems.map((item) => (
            <button
              key={item.id}
              className="dock-btn"
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

      {/* Blackout Confirmation Modal */}
      {showBlackoutConfirm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowBlackoutConfirm(false)}
        >
          <div
            className="glass-card p-6 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-4">⏻</div>
            <h3 className="text-xl font-bold text-white mb-2">Blackout All Zones?</h3>
            <p className="text-sm text-white/60 mb-6">
              This will fade all lights to 0% over 1.5 seconds.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlackoutConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-medium transition-all hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlackout}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-medium transition-all hover:bg-red-500/30"
              >
                Blackout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
