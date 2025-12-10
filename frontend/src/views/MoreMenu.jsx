import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import useUIStore from '../store/uiStore';

const freeFeatures = [
  { icon: '\uD83D\uDCF1', name: 'Live Remote', action: 'openLiveQR' },
  { icon: '\uD83C\uDF9A\uFE0F', name: 'Fixtures', path: '/fixtures-menu' },
  { icon: '\uD83D\uDCC1', name: 'Saved Scenes', path: '/scenes' },
  { icon: '\uD83D\uDCC5', name: 'Schedule', path: '/schedules-menu' },
  { icon: '\uD83D\uDCE1', name: 'Nodes', path: '/nodes' },
  { icon: '\uD83C\uDFA8', name: 'Theme', action: 'openThemePicker' },
  { icon: '\u2699\uFE0F', name: 'Settings', path: '/settings' },
];

// Hardcoded AETHER hotspot IP for mobile access
const LIVE_CONSOLE_URL = 'http://192.168.50.1:3000/live';

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
  const [showLiveQR, setShowLiveQR] = useState(false);

  const handleItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.action === 'openThemePicker') {
      setShowThemePicker(true);
    } else if (item.action === 'openLiveQR') {
      setShowLiveQR(true);
    } else if (item.badge === 'PRO') {
      // Show pro features modal or redirect
      alert('Pro features coming soon!');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(LIVE_CONSOLE_URL);
    } catch (e) {
      console.error('Copy failed:', e);
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

      {/* Mobile Live Console QR Modal */}
      {showLiveQR && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLiveQR(false)}
        >
          <div
            className="glass-card p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,255,0.08) 0%, rgba(0,0,0,0.95) 100%)',
              border: '1px solid rgba(0,255,255,0.25)',
              borderRadius: '20px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{'\uD83D\uDCF1'}</div>
                <div>
                  <h2 className="text-lg font-bold text-white">Live Remote</h2>
                  <p className="text-xs text-cyan-400">Control from your phone</p>
                </div>
              </div>
              <button
                onClick={() => setShowLiveQR(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
              >
                {'\u2715'}
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center mb-4">
              <div
                className="p-3 rounded-xl mb-3"
                style={{ background: 'rgba(255,255,255,0.95)' }}
              >
                <QRCodeSVG
                  value={LIVE_CONSOLE_URL}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                />
              </div>
              <p className="text-sm text-white/60 text-center">
                Scan with your phone camera
              </p>
            </div>

            {/* URL Display */}
            <div
              className="p-3 rounded-xl mb-4 flex items-center justify-between"
              style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.2)' }}
            >
              <code className="text-cyan-400 text-sm truncate flex-1 mr-2">
                {LIVE_CONSOLE_URL}
              </code>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all"
              >
                Copy
              </button>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-xs text-white/50">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Connect phone to <strong className="text-cyan-400">AetherDMX</strong> WiFi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Scan QR code with camera</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>Control fixtures while walking the venue</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
