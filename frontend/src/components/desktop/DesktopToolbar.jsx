import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, Square, SkipBack, SkipForward, AlertTriangle,
  Search, Command
} from 'lucide-react';
import usePlaybackStore from '../../store/playbackStore';
import useDMXStore from '../../store/dmxStore';
import useNodeStore from '../../store/nodeStore';
import { useDesktop } from './DesktopShell';
import ThemedLogo from '../ThemedLogo';

export default function DesktopToolbar() {
  const navigate = useNavigate();
  const { playback, stopAll, syncStatus } = usePlaybackStore();
  const { blackoutAll } = useDMXStore();
  const { nodes } = useNodeStore();
  const { setCommandPaletteOpen } = useDesktop();

  const [masterValue, setMasterValue] = useState(100);
  const [isBlackout, setIsBlackout] = useState(false);
  const [time, setTime] = useState(new Date());
  const masterTrackRef = useRef(null);
  const isDragging = useRef(false);

  // Time update
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync playback status
  useEffect(() => {
    syncStatus();
    const interval = setInterval(syncStatus, 2000);
    return () => clearInterval(interval);
  }, [syncStatus]);

  const isPlaying = Object.keys(playback).length > 0;
  const onlineNodes = nodes.filter(n => n.status === 'online').length;

  const handleBlackout = () => {
    if (!isBlackout) {
      blackoutAll(500);
      stopAll();
    }
    setIsBlackout(!isBlackout);
  };

  const handleMasterDrag = (e) => {
    if (!masterTrackRef.current) return;
    const rect = masterTrackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setMasterValue(Math.round(pct));
  };

  const handleMasterStart = (e) => {
    isDragging.current = true;
    handleMasterDrag(e);
    document.addEventListener('mousemove', handleMasterDrag);
    document.addEventListener('mouseup', handleMasterEnd);
  };

  const handleMasterEnd = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMasterDrag);
    document.removeEventListener('mouseup', handleMasterEnd);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCurrentPlaying = () => {
    const item = Object.values(playback)[0];
    if (!item) return null;
    return item.name || item.id?.replace(/_/g, ' ') || 'Unknown';
  };

  return (
    <header className="desktop-toolbar">
      {/* Left: Logo + Search */}
      <div className="toolbar-left">
        <button className="toolbar-logo" onClick={() => navigate('/')}>
          <ThemedLogo size={32} />
          <span className="logo-text">AETHER</span>
        </button>

        <button className="search-trigger" onClick={() => setCommandPaletteOpen(true)}>
          <Search size={16} />
          <span>Search...</span>
          <div className="search-shortcut">
            <Command size={12} />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Center: Playback Controls + Master */}
      <div className="toolbar-center">
        {/* Transport Controls */}
        <div className="transport-controls">
          <button className="transport-btn" onClick={() => navigate('/scenes')}>
            <SkipBack size={16} />
          </button>
          <button
            className={`transport-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => isPlaying ? stopAll() : navigate('/scenes')}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="transport-btn stop-btn" onClick={stopAll}>
            <Square size={14} />
          </button>
          <button className="transport-btn" onClick={() => navigate('/chases')}>
            <SkipForward size={16} />
          </button>
        </div>

        {/* Now Playing */}
        <div className="now-playing">
          {isPlaying ? (
            <>
              <span className="playing-indicator" />
              <span className="playing-name">{getCurrentPlaying()}</span>
            </>
          ) : (
            <span className="playing-idle">Ready</span>
          )}
        </div>

        {/* Master Fader */}
        <div className="master-fader">
          <span className="master-label">MASTER</span>
          <div
            ref={masterTrackRef}
            className="master-track"
            onMouseDown={handleMasterStart}
          >
            <div
              className="master-fill"
              style={{ width: `${isBlackout ? 0 : masterValue}%` }}
            />
            <span className="master-value">{isBlackout ? 0 : masterValue}%</span>
          </div>
        </div>

        {/* Blackout Button */}
        <button
          className={`blackout-btn ${isBlackout ? 'active' : ''}`}
          onClick={handleBlackout}
        >
          <AlertTriangle size={16} />
          <span>BLACKOUT</span>
        </button>
      </div>

      {/* Right: Status */}
      <div className="toolbar-right">
        <div className="status-indicators">
          <div className="status-item">
            <span className={`status-dot ${onlineNodes > 0 ? 'online' : 'offline'}`} />
            <span>{onlineNodes} Nodes</span>
          </div>
          <div className="status-item">
            <span className="status-dot online" />
            <span>44 fps</span>
          </div>
        </div>
        <span className="toolbar-time">{formatTime(time)}</span>
      </div>

      <style>{`
        .desktop-toolbar {
          height: 56px;
          background: rgba(15, 15, 25, 0.98);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 24px;
          backdrop-filter: blur(12px);
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 280px;
        }

        .toolbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: background 0.15s;
        }

        .toolbar-logo:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .logo-text {
          font-size: 16px;
          font-weight: 700;
          color: white;
          letter-spacing: 2px;
        }

        .search-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          min-width: 180px;
        }

        .search-trigger:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.6);
        }

        .search-shortcut {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: auto;
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
        }

        .toolbar-center {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .transport-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .transport-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .transport-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .transport-btn.play-btn {
          width: 44px;
          height: 44px;
          background: var(--theme-primary, #00ffaa);
          color: #000;
        }

        .transport-btn.play-btn:hover {
          filter: brightness(1.1);
        }

        .transport-btn.play-btn.playing {
          background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.2);
          color: var(--theme-primary, #00ffaa);
        }

        .transport-btn.stop-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .now-playing {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
        }

        .playing-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--theme-primary, #00ffaa);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .playing-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--theme-primary, #00ffaa);
          text-transform: capitalize;
        }

        .playing-idle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.3);
        }

        .master-fader {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .master-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 1px;
        }

        .master-track {
          width: 160px;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          cursor: pointer;
          position: relative;
        }

        .master-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--theme-primary, #00ffaa), rgba(var(--theme-primary-rgb, 0, 255, 170), 0.7));
          border-radius: 4px;
          transition: width 0.1s;
        }

        .master-value {
          position: absolute;
          right: -40px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: 600;
          color: white;
          width: 36px;
          text-align: right;
        }

        .blackout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .blackout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .blackout-btn.active {
          background: #ef4444;
          color: white;
          animation: blackout-flash 0.5s ease-in-out infinite;
        }

        @keyframes blackout-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 200px;
          justify-content: flex-end;
        }

        .status-indicators {
          display: flex;
          gap: 16px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
        }

        .status-dot.offline {
          background: #eab308;
        }

        .toolbar-time {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </header>
  );
}
