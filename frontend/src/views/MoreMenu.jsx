import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useUIStore from '../store/uiStore';

const freeFeatures = [
  { icon: '\uD83C\uDF9A\uFE0F', name: 'Fixtures', path: '/fixtures-menu' },
  { icon: '\uD83D\uDCC1', name: 'Saved Scenes', path: '/scenes' },
  { icon: '\uD83D\uDCC5', name: 'Schedule', path: '/schedules-menu' },
  { icon: '\uD83D\uDCE1', name: 'Nodes', path: '/nodes' },
  { icon: '\uD83C\uDFA8', name: 'Theme', action: 'openThemePicker' },
  { icon: '\u2699\uFE0F', name: 'Settings', path: '/settings' },
];

const proFeatures = [
  { icon: '\u2601\uFE0F', name: 'Cloud Sync', badge: 'PRO' },
  { icon: '\uD83C\uDFE2', name: 'Multi-Venue', badge: 'PRO' },
  { icon: '\uD83D\uDD0C', name: 'API Access', badge: 'PRO' },
];

const accentColors = [
  '#00ffaa', // Mint (default)
  '#00d4ff', // Cyan
  '#ff6b6b', // Coral
  '#ffd93d', // Gold
  '#6bcb77', // Green
  '#9b59b6', // Purple
  '#ff9f43', // Orange
  '#00cec9', // Teal
];

export default function MoreMenu() {
  const navigate = useNavigate();
  const { accentColor, setAccentColor } = useUIStore();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const handleItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.action === 'openThemePicker') {
      setShowThemePicker(true);
    } else if (item.badge === 'PRO') {
      // Show pro features modal or redirect
      alert('Pro features coming soon!');
    }
  };

  const handleColorSelect = (color) => {
    setAccentColor(color);
    setShowThemePicker(false);
  };

  return (
    <div className="screen-overlay open">
      <div className="screen-glow" />

      {/* Header */}
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="screen-title">More</div>
        <div style={{ width: 46 }} />
      </div>

      {/* Content */}
      <div className="screen-content">
        {/* Free Features */}
        <div className="settings-grid">
          {freeFeatures.map((item) => (
            <button
              key={item.name}
              className="settings-item"
              onClick={() => handleItemClick(item)}
            >
              <span className="settings-icon">{item.icon}</span>
              <span className="settings-name">{item.name}</span>
            </button>
          ))}
        </div>

        {/* Pro Features Section */}
        <div className="settings-section">
          <div className="settings-section-title">Pro Features</div>
          <div className="settings-grid">
            {proFeatures.map((item) => (
              <button
                key={item.name}
                className="settings-item"
                onClick={() => handleItemClick(item)}
              >
                <span className="settings-icon">{item.icon}</span>
                <span className="settings-name">{item.name}</span>
                {item.badge && <span className="pro-badge">{item.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Picker Modal */}
      {showThemePicker && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowThemePicker(false)}
        >
          <div
            className="glass-card p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              {'\uD83C\uDFA8'} Choose Accent Color
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {accentColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className="aspect-square rounded-xl border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: accentColor === color ? '#fff' : 'transparent',
                    boxShadow: accentColor === color ? `0 0 20px ${color}` : 'none',
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setShowThemePicker(false)}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-medium transition-all hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
