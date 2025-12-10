import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Square, Save, Layers,
  ChevronLeft, ChevronRight, Wifi, WifiOff, Sun, Moon,
  Zap
} from 'lucide-react';
import { io } from 'socket.io-client';
import useDMXStore from '../store/dmxStore';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import useNodeStore from '../store/nodeStore';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

// Responsive Vertical Fader Component
function MobileFader({ channel, value, onChange, label, color }) {
  const faderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouch = useCallback((e) => {
    if (!faderRef.current) return;
    const rect = faderRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const y = touch.clientY - rect.top;
    const height = rect.height;
    const newValue = Math.round(Math.max(0, Math.min(255, 255 - (y / height) * 255)));
    onChange(channel, newValue);
  }, [channel, onChange]);

  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    handleTouch(e);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      handleTouch(e);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const percentage = (value / 255) * 100;

  return (
    <div className="fader-container">
      <span className="fader-label">{label}</span>
      <div
        ref={faderRef}
        className={`fader-track ${isDragging ? 'active' : ''}`}
        style={{ '--fader-color': color || 'var(--accent)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <div className="fader-fill" style={{ height: `${percentage}%` }} />
        <div className="fader-value">{Math.round(percentage)}%</div>
      </div>
      <span className="fader-channel">CH {channel}</span>
    </div>
  );
}

// Scene Card
function QuickSceneCard({ scene, isActive, onPlay }) {
  return (
    <button
      onClick={() => onPlay(scene)}
      className={`scene-card ${isActive ? 'active' : ''}`}
      style={{ '--scene-color': scene.color || '#3b82f6' }}
    >
      <div className="scene-icon">{scene.icon || '💡'}</div>
      <div className="scene-name">{scene.name}</div>
    </button>
  );
}

export default function LiveConsole() {
  const { scenes, currentScene, playScene, stopScene, fetchScenes, createScene } = useSceneStore();
  const { chases, activeChase, startChase, stopChase, fetchChases } = useChaseStore();
  const { nodes, fetchNodes } = useNodeStore();

  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('faders');
  const [channelValues, setChannelValues] = useState({});
  const [channelPage, setChannelPage] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sceneName, setSceneName] = useState('');
  const [masterValue, setMasterValue] = useState(255);
  const [fadersPerPage, setFadersPerPage] = useState(6);
  const pendingUpdates = useRef({});
  const updateTimeout = useRef(null);
  const contentRef = useRef(null);

  // Calculate faders per page based on screen width
  useEffect(() => {
    const calculateFaders = () => {
      const width = window.innerWidth;
      if (width < 320) setFadersPerPage(4);
      else if (width < 400) setFadersPerPage(5);
      else if (width < 500) setFadersPerPage(6);
      else if (width < 700) setFadersPerPage(8);
      else setFadersPerPage(10);
    };

    calculateFaders();
    window.addEventListener('resize', calculateFaders);
    return () => window.removeEventListener('resize', calculateFaders);
  }, []);

  const totalPages = Math.ceil(64 / fadersPerPage);
  const selectedChannels = Array.from(
    { length: fadersPerPage },
    (_, i) => channelPage * fadersPerPage + i + 1
  ).filter(ch => ch <= 64);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(getAetherCore(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      newSocket.emit('get_dmx_state', { universe: 1 });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('dmx_state', (data) => {
      if (data.channels) {
        const values = {};
        data.channels.forEach((v, i) => {
          values[i + 1] = v;
        });
        setChannelValues(values);
      }
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // Initialize data
  useEffect(() => {
    fetchScenes();
    fetchChases();
    fetchNodes();
  }, []);

  // Batched channel update via WebSocket
  const sendPendingUpdates = useCallback(() => {
    if (socket && Object.keys(pendingUpdates.current).length > 0) {
      socket.emit('live_set_channels', {
        universe: 1,
        channels: pendingUpdates.current,
        fade_ms: 0
      });
      pendingUpdates.current = {};
    }
  }, [socket]);

  const handleChannelChange = useCallback((channel, value) => {
    setChannelValues(prev => ({ ...prev, [channel]: value }));
    pendingUpdates.current[channel] = value;

    if (updateTimeout.current) clearTimeout(updateTimeout.current);
    updateTimeout.current = setTimeout(sendPendingUpdates, 16);
  }, [sendPendingUpdates]);

  const handlePlayScene = async (scene) => {
    await playScene(scene.scene_id || scene.id, scene.fade_ms || 1000);
  };

  const handleSaveScene = async () => {
    if (!sceneName.trim()) return;

    const channelsToSave = {};
    for (let ch = 1; ch <= 64; ch++) {
      if (channelValues[ch] > 0) {
        channelsToSave[ch] = channelValues[ch];
      }
    }

    try {
      await createScene({
        name: sceneName,
        channels: channelsToSave,
        fade_ms: 1000,
        color: '#3b82f6'
      });
      setShowSaveModal(false);
      setSceneName('');
      await fetchScenes();
    } catch (e) {
      console.error('Failed to save scene:', e);
    }
  };

  const handleBlackout = () => {
    if (socket) socket.emit('live_blackout', { fade_ms: 500 });
    setChannelValues({});
  };

  const handleStopAll = () => {
    if (socket) socket.emit('live_stop_all', {});
    stopScene();
    stopChase();
  };

  const getChannelColor = (ch) => {
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#ffffff', '#eab308', '#a855f7'];
    return colors[(ch - 1) % colors.length];
  };

  const onlineNodes = nodes.filter(n => n.status === 'online').length;

  return (
    <div className="live-console">
      {/* Header */}
      <header className="live-header">
        <div className="header-logo">
          <span className="logo-icon">✨</span>
          <span className="logo-text">AETHER</span>
        </div>
        <div className="header-center">
          <h1>Live Console</h1>
          <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          </div>
        </div>
        <div className="header-right">
          <span className="node-count">{onlineNodes} nodes</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'faders' ? 'active' : ''}`}
          onClick={() => setActiveTab('faders')}
        >
          <Sun size={18} />
          <span>Faders</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'scenes' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenes')}
        >
          <Layers size={18} />
          <span>Scenes</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'chases' ? 'active' : ''}`}
          onClick={() => setActiveTab('chases')}
        >
          <Zap size={18} />
          <span>Chases</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="live-main" ref={contentRef}>
        {activeTab === 'faders' && (
          <div className="faders-panel">
            {/* Page Navigation */}
            <div className="page-nav">
              <button
                onClick={() => setChannelPage(p => Math.max(0, p - 1))}
                disabled={channelPage === 0}
                className="page-btn"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="page-info">
                CH {channelPage * fadersPerPage + 1}-{Math.min((channelPage + 1) * fadersPerPage, 64)}
              </span>
              <button
                onClick={() => setChannelPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={channelPage >= totalPages - 1}
                className="page-btn"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Faders Grid */}
            <div className="faders-row" style={{ '--fader-count': fadersPerPage }}>
              {selectedChannels.map(ch => (
                <MobileFader
                  key={ch}
                  channel={ch}
                  value={channelValues[ch] || 0}
                  onChange={handleChannelChange}
                  label={`CH${ch}`}
                  color={getChannelColor(ch)}
                />
              ))}
            </div>

            {/* Master */}
            <div className="master-row">
              <span className="master-label">MASTER</span>
              <input
                type="range"
                min="0"
                max="255"
                value={masterValue}
                onChange={(e) => setMasterValue(parseInt(e.target.value))}
                className="master-range"
              />
              <span className="master-percent">{Math.round((masterValue / 255) * 100)}%</span>
            </div>
          </div>
        )}

        {activeTab === 'scenes' && (
          <div className="scenes-panel">
            <div className="scenes-scroll">
              {scenes.map(scene => (
                <QuickSceneCard
                  key={scene.scene_id || scene.id}
                  scene={scene}
                  isActive={currentScene?.scene_id === scene.scene_id}
                  onPlay={handlePlayScene}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chases' && (
          <div className="chases-panel">
            <div className="chases-scroll">
              {chases.map(chase => (
                <button
                  key={chase.chase_id || chase.id}
                  onClick={() => {
                    const id = chase.chase_id || chase.id;
                    if (activeChase?.chase_id === id || activeChase?.id === id) {
                      stopChase();
                    } else {
                      startChase(id);
                    }
                  }}
                  className={`chase-card ${(activeChase?.chase_id === chase.chase_id || activeChase?.id === chase.id) ? 'active' : ''}`}
                  style={{ '--chase-color': chase.color || '#22c55e' }}
                >
                  <Zap size={24} className={(activeChase?.chase_id === chase.chase_id) ? 'pulse' : ''} />
                  <span className="chase-name">{chase.name}</span>
                  <span className="chase-bpm">{chase.bpm} BPM</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Actions */}
      <footer className="action-bar">
        <button className="action-btn danger" onClick={handleBlackout}>
          <Moon size={22} />
          <span>Blackout</span>
        </button>
        <button className="action-btn success" onClick={() => setShowSaveModal(true)}>
          <Save size={22} />
          <span>Save</span>
        </button>
        <button className="action-btn warning" onClick={handleStopAll}>
          <Square size={22} />
          <span>Stop</span>
        </button>
      </footer>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-backdrop" onClick={() => setShowSaveModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Save Scene</h3>
            <input
              type="text"
              placeholder="Enter scene name..."
              value={sceneName}
              onChange={e => setSceneName(e.target.value)}
              autoFocus
            />
            <div className="modal-btns">
              <button className="modal-cancel" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="modal-save" onClick={handleSaveScene}>Save</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        .live-console {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #0a0a12 0%, #161625 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          touch-action: manipulation;
        }

        /* Header */
        .live-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3vw 4vw;
          background: rgba(0,0,0,0.4);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 1.5vw;
        }

        .logo-icon {
          font-size: clamp(18px, 5vw, 24px);
        }

        .logo-text {
          font-size: clamp(12px, 3.5vw, 16px);
          font-weight: 800;
          background: linear-gradient(135deg, var(--accent, #00d4ff), #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-center {
          display: flex;
          align-items: center;
          gap: 2vw;
        }

        .header-center h1 {
          font-size: clamp(16px, 4.5vw, 20px);
          font-weight: 700;
          margin: 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          padding: 1vw 2vw;
          border-radius: 20px;
          font-size: clamp(10px, 2.5vw, 12px);
        }

        .status-indicator.online {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .status-indicator.offline {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .header-right {
          display: flex;
          align-items: center;
        }

        .node-count {
          font-size: clamp(12px, 3vw, 14px);
          color: rgba(255,255,255,0.5);
        }

        /* Tab Navigation */
        .tab-nav {
          display: flex;
          gap: 2vw;
          padding: 2vw 3vw;
          background: rgba(0,0,0,0.3);
          flex-shrink: 0;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2vw;
          padding: 3vw 2vw;
          border-radius: 12px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255,255,255,0.5);
          font-size: clamp(12px, 3.2vw, 14px);
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: var(--accent, #00d4ff);
          color: black;
          border-color: var(--accent, #00d4ff);
        }

        /* Main Content */
        .live-main {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        /* Faders Panel */
        .faders-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 3vw;
          gap: 3vw;
        }

        .page-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4vw;
          flex-shrink: 0;
        }

        .page-btn {
          width: 12vw;
          max-width: 48px;
          aspect-ratio: 1;
          border-radius: 12px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-btn:disabled {
          opacity: 0.3;
        }

        .page-info {
          font-size: clamp(13px, 3.5vw, 16px);
          font-weight: 600;
          color: rgba(255,255,255,0.7);
        }

        /* Faders Row */
        .faders-row {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          flex: 1;
          min-height: 0;
          padding: 2vw 0;
        }

        .fader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: calc(100% / var(--fader-count) - 2vw);
          max-width: 60px;
        }

        .fader-label {
          font-size: clamp(9px, 2.5vw, 11px);
          color: rgba(255,255,255,0.6);
          margin-bottom: 1.5vw;
          font-weight: 600;
        }

        .fader-track {
          position: relative;
          width: 100%;
          max-width: 50px;
          height: 35vh;
          max-height: 180px;
          min-height: 100px;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          overflow: hidden;
          touch-action: none;
          transition: border-color 0.15s;
        }

        .fader-track.active {
          border-color: var(--fader-color);
          box-shadow: 0 0 15px var(--fader-color);
        }

        .fader-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, var(--fader-color), color-mix(in srgb, var(--fader-color) 60%, transparent));
          transition: height 0.05s linear;
        }

        .fader-value {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(11px, 3vw, 14px);
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }

        .fader-channel {
          font-size: clamp(8px, 2.2vw, 10px);
          color: rgba(255,255,255,0.4);
          margin-top: 1.5vw;
        }

        /* Master Row */
        .master-row {
          display: flex;
          align-items: center;
          gap: 3vw;
          padding: 3vw 4vw;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          flex-shrink: 0;
        }

        .master-label {
          font-size: clamp(10px, 2.8vw, 12px);
          font-weight: 700;
          color: var(--accent, #00d4ff);
          width: 15vw;
          max-width: 60px;
        }

        .master-range {
          flex: 1;
          height: 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          -webkit-appearance: none;
          appearance: none;
        }

        .master-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 7vw;
          max-width: 28px;
          height: 7vw;
          max-height: 28px;
          border-radius: 50%;
          background: var(--accent, #00d4ff);
          border: 2px solid white;
          cursor: pointer;
        }

        .master-percent {
          font-size: clamp(12px, 3.5vw, 16px);
          font-weight: 700;
          width: 12vw;
          max-width: 50px;
          text-align: right;
        }

        /* Scenes Panel */
        .scenes-panel {
          height: 100%;
          padding: 3vw;
        }

        .scenes-scroll {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(30vw, 120px), 1fr));
          gap: 3vw;
          padding-bottom: 20px;
        }

        .scene-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
          padding: 3vw;
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.2s ease;
        }

        .scene-card.active {
          background: linear-gradient(135deg, color-mix(in srgb, var(--scene-color) 30%, transparent), transparent);
          border-color: var(--scene-color);
          box-shadow: 0 0 20px color-mix(in srgb, var(--scene-color) 40%, transparent);
        }

        .scene-card:active {
          transform: scale(0.95);
        }

        .scene-icon {
          font-size: clamp(20px, 7vw, 32px);
          margin-bottom: 2vw;
        }

        .scene-name {
          font-size: clamp(10px, 3vw, 13px);
          font-weight: 600;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }

        /* Chases Panel */
        .chases-panel {
          height: 100%;
          padding: 3vw;
        }

        .chases-scroll {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(42vw, 160px), 1fr));
          gap: 3vw;
          padding-bottom: 20px;
        }

        .chase-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2vw;
          padding: 5vw 3vw;
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          transition: all 0.2s ease;
        }

        .chase-card.active {
          background: linear-gradient(135deg, color-mix(in srgb, var(--chase-color) 25%, transparent), transparent);
          border-color: var(--chase-color);
          box-shadow: 0 0 25px color-mix(in srgb, var(--chase-color) 50%, transparent);
        }

        .chase-card:active {
          transform: scale(0.95);
        }

        .chase-name {
          font-size: clamp(12px, 3.5vw, 15px);
          font-weight: 600;
        }

        .chase-bpm {
          font-size: clamp(10px, 2.5vw, 12px);
          color: rgba(255,255,255,0.5);
        }

        .pulse {
          animation: pulse 0.8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        /* Action Bar */
        .action-bar {
          display: flex;
          gap: 2vw;
          padding: 3vw 4vw;
          padding-bottom: max(3vw, env(safe-area-inset-bottom));
          background: rgba(0,0,0,0.7);
          border-top: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .action-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5vw;
          padding: 3vw 2vw;
          border-radius: 14px;
          border: 1px solid;
          font-size: clamp(11px, 3vw, 13px);
          font-weight: 600;
          transition: all 0.15s ease;
        }

        .action-btn:active {
          transform: scale(0.95);
        }

        .action-btn.danger {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
        }

        .action-btn.success {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.4);
          color: #22c55e;
        }

        .action-btn.warning {
          background: rgba(251, 191, 36, 0.15);
          border-color: rgba(251, 191, 36, 0.4);
          color: #fbbf24;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5vw;
          z-index: 1000;
        }

        .modal-box {
          background: linear-gradient(180deg, #1e1e2e 0%, #151520 100%);
          border-radius: 20px;
          padding: 6vw;
          width: 100%;
          max-width: 340px;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .modal-box h3 {
          font-size: clamp(16px, 5vw, 20px);
          font-weight: 700;
          margin: 0 0 4vw 0;
        }

        .modal-box input {
          width: 100%;
          padding: 4vw;
          border-radius: 12px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: white;
          font-size: clamp(14px, 4vw, 16px);
          margin-bottom: 4vw;
          outline: none;
        }

        .modal-box input:focus {
          border-color: var(--accent, #00d4ff);
        }

        .modal-box input::placeholder {
          color: rgba(255,255,255,0.35);
        }

        .modal-btns {
          display: flex;
          gap: 3vw;
        }

        .modal-btns button {
          flex: 1;
          padding: 4vw;
          border-radius: 12px;
          font-size: clamp(13px, 3.5vw, 15px);
          font-weight: 600;
          border: none;
          transition: all 0.15s ease;
        }

        .modal-btns button:active {
          transform: scale(0.95);
        }

        .modal-cancel {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .modal-save {
          background: var(--accent, #00d4ff);
          color: black;
        }

        /* iOS safe area */
        @supports (padding: max(0px)) {
          .action-bar {
            padding-bottom: max(3vw, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}
