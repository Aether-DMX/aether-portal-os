import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const dockItems = [
  { id: 'blackout', icon: '\u23FB', label: 'Blackout', action: 'blackout' },
  { id: 'scenes', icon: '\uD83C\uDFAD', label: 'Scenes', path: '/scenes' },
  { id: 'aether', icon: '\u2728', label: 'AETHER', action: 'openAI', accent: true },
  { id: 'chases', icon: '\uD83C\uDF1F', label: 'Chases', path: '/chases' },
  { id: 'live', icon: '\uD83D\uDCF1', label: 'Live', action: 'openLive' },
  { id: 'more', icon: '\u2630', label: 'More', path: '/more' },
];

export default function Dock({ onAIClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showBlackoutConfirm, setShowBlackoutConfirm] = useState(false);
  const [showLiveQR, setShowLiveQR] = useState(false);

  // Use hotspot IP when accessed locally, otherwise use current hostname
  const getHotspotUrl = () => {
    const hostname = window.location.hostname;
    // If accessed from localhost, use the AETHER WiFi hotspot IP
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://192.168.50.1:3000/live';
    }
    return `http://${hostname}:3000/live`;
  };
  const liveConsoleUrl = getHotspotUrl();

  const handleDockClick = (item) => {
    if (item.action === 'blackout') {
      setShowBlackoutConfirm(true);
    } else if (item.action === 'openAI') {
      if (onAIClick) onAIClick();
    } else if (item.action === 'openLive') {
      setShowLiveQR(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const confirmBlackout = async () => {
    try {
      // Stop all playback (scenes, chases) - must send empty JSON body
      await axios.post(getAetherCore() + '/api/playback/stop', {});
      // Blackout all 3 universes
      await Promise.all([
        axios.post(getAetherCore() + '/api/dmx/blackout', { universe: 1, fade_ms: 1500 }),
        axios.post(getAetherCore() + '/api/dmx/blackout', { universe: 2, fade_ms: 1500 }),
        axios.post(getAetherCore() + '/api/dmx/blackout', { universe: 3, fade_ms: 1500 }),
      ]);
      console.log('🌑 Blackout all universes');
    } catch (e) {
      console.error('Blackout failed:', e);
    }
    setShowBlackoutConfirm(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(liveConsoleUrl);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  // Don't show dock on certain pages
  const hiddenPaths = ['/aether-ai', '/console', '/live'];
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
                {item.icon}
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
            <div className="text-4xl mb-4">{'\u23FB'}</div>
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

      {/* Mobile Live Console QR Modal */}
      {showLiveQR && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLiveQR(false)}
        >
          <div
            className="glass-card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(0,0,0,0.95) 100%)',
              border: '1px solid rgba(0,255,255,0.3)',
              borderRadius: '20px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{'\uD83D\uDCF1'}</div>
                <div>
                  <h2 className="text-xl font-bold text-white">Mobile Live Console</h2>
                  <p className="text-xs text-cyan-400">Control fixtures from your phone</p>
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
            <div className="flex flex-col items-center mb-6">
              <div
                className="p-4 rounded-2xl mb-4"
                style={{ background: 'rgba(255,255,255,0.95)' }}
              >
                <QRCodeSVG
                  value={liveConsoleUrl}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                />
              </div>
              <p className="text-sm text-white/60 text-center mb-2">
                Scan with your phone camera
              </p>
            </div>

            {/* URL Display */}
            <div
              className="p-3 rounded-xl mb-4 flex items-center justify-between"
              style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.2)' }}
            >
              <code className="text-cyan-400 text-sm truncate flex-1 mr-2">
                {liveConsoleUrl}
              </code>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all"
              >
                Copy
              </button>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Connect to same WiFi as AETHER Portal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Scan QR code with phone camera</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>Control fixtures live while walking the venue</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
