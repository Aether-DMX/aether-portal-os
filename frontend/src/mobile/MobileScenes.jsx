import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Clock, Zap, ChevronRight } from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import usePlaybackStore from '../store/playbackStore';

// Haptic feedback helper
const haptic = (pattern = 10) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

// Long press hook
function useLongPress(callback, ms = 500) {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const start = useCallback((e) => {
    e.preventDefault();
    timerRef.current = setTimeout(() => {
      haptic(50);
      callbackRef.current(e);
    }, ms);
  }, [ms]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
  };
}

// Scene Card Component - Rich playback tile
function SceneCard({ scene, isActive, onPlay, onLongPress }) {
  const longPressHandlers = useLongPress(() => onLongPress(scene));

  // Extract color from scene channels for preview
  const getSceneColor = () => {
    if (!scene.channels) return '#3b82f6';
    const r = scene.channels[1] || 0;
    const g = scene.channels[2] || 0;
    const b = scene.channels[3] || 0;
    if (r === 0 && g === 0 && b === 0) return '#3b82f6';
    return `rgb(${r}, ${g}, ${b})`;
  };

  const sceneColor = getSceneColor();
  const displayName = scene.name?.replace(/_/g, ' ') || 'Unnamed';

  return (
    <button
      className={`scene-card ${isActive ? 'active' : ''}`}
      onClick={() => { haptic(); onPlay(scene); }}
      {...longPressHandlers}
      style={{
        '--scene-color': sceneColor,
      }}
    >
      {/* Color preview bar */}
      <div className="scene-card-color" style={{ background: sceneColor }} />

      {/* Content */}
      <div className="scene-card-content">
        <span className="scene-card-name">{displayName}</span>
        {isActive && (
          <div className="scene-card-active-indicator">
            <div className="pulse-dot" />
            <span>Playing</span>
          </div>
        )}
      </div>

      {/* Play icon overlay */}
      <div className="scene-card-play">
        <Play size={20} fill="currentColor" />
      </div>
    </button>
  );
}

// Context Menu for long-press actions
function ContextMenu({ scene, position, onClose, onAction }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const displayName = scene.name?.replace(/_/g, ' ') || 'Unnamed';

  return (
    <div className="context-menu-overlay" onClick={onClose}>
      <div
        ref={menuRef}
        className="context-menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="context-menu-header">
          <span className="context-menu-title">{displayName}</span>
        </div>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('play', scene); onClose(); }}
        >
          <Play size={18} />
          <span>Play Now</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('stop', scene); onClose(); }}
        >
          <Square size={18} />
          <span>Stop</span>
        </button>

        <div className="context-menu-divider" />

        <div className="context-menu-section-label">Fade In</div>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('fade-1s', scene); onClose(); }}
        >
          <Clock size={18} />
          <span>1 second</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('fade-3s', scene); onClose(); }}
        >
          <Clock size={18} />
          <span>3 seconds</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('fade-5s', scene); onClose(); }}
        >
          <Clock size={18} />
          <span>5 seconds</span>
        </button>

        <div className="context-menu-divider" />

        <button
          className="context-menu-item instant"
          onClick={() => { haptic(); onAction('instant', scene); onClose(); }}
        >
          <Zap size={18} />
          <span>Instant (No Fade)</span>
        </button>
      </div>
    </div>
  );
}

export default function MobileScenes() {
  const { scenes, fetchScenes, playScene } = useSceneStore();
  const playbackStore = usePlaybackStore();
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  // Get active scene from playback state
  const getActiveSceneId = () => {
    if (playbackStore?.currentScene) {
      return playbackStore.currentScene.id;
    }
    return null;
  };

  const activeSceneId = getActiveSceneId();

  const handlePlay = (scene) => {
    playScene(scene.id, 1); // 1 second default fade
  };

  const handleLongPress = (scene) => {
    setContextMenu({ scene });
  };

  const handleAction = (action, scene) => {
    switch (action) {
      case 'play':
        playScene(scene.id, 1);
        break;
      case 'stop':
        // Stop playback - typically send blackout or stop command
        if (playbackStore?.stopScene) {
          playbackStore.stopScene(scene.id);
        }
        break;
      case 'fade-1s':
        playScene(scene.id, 1);
        break;
      case 'fade-3s':
        playScene(scene.id, 3);
        break;
      case 'fade-5s':
        playScene(scene.id, 5);
        break;
      case 'instant':
        playScene(scene.id, 0);
        break;
      default:
        break;
    }
  };

  return (
    <div className="mobile-scenes-page">
      {/* Header */}
      <div className="mobile-page-header">
        <h1 className="mobile-page-title">Scenes</h1>
        <span className="mobile-page-count">{scenes.length} available</span>
      </div>

      {/* Scene Grid */}
      {scenes.length === 0 ? (
        <div className="mobile-empty-state">
          <div className="empty-icon">
            <Play size={32} />
          </div>
          <p className="empty-text">No scenes available</p>
          <p className="empty-subtext">Create scenes on desktop to play them here</p>
        </div>
      ) : (
        <div className="scene-card-grid">
          {scenes.map(scene => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isActive={scene.id === activeSceneId}
              onPlay={handlePlay}
              onLongPress={handleLongPress}
            />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          scene={contextMenu.scene}
          onClose={() => setContextMenu(null)}
          onAction={handleAction}
        />
      )}

      {/* Styles */}
      <style>{`
        .mobile-scenes-page {
          padding: 16px;
          padding-bottom: 100px;
          min-height: 100%;
        }

        .mobile-page-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .mobile-page-title {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .mobile-page-count {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }

        /* Scene Card Grid */
        .scene-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        /* Scene Card */
        .scene-card {
          position: relative;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 100px;
          display: flex;
          flex-direction: column;
          -webkit-tap-highlight-color: transparent;
        }

        .scene-card:active {
          transform: scale(0.97);
          background: rgba(255,255,255,0.08);
        }

        .scene-card.active {
          border-color: var(--scene-color, #3b82f6);
          box-shadow: 0 0 20px color-mix(in srgb, var(--scene-color) 30%, transparent);
        }

        .scene-card-color {
          height: 6px;
          width: 100%;
          flex-shrink: 0;
        }

        .scene-card-content {
          flex: 1;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .scene-card-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          text-transform: capitalize;
          line-height: 1.3;
        }

        .scene-card-active-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 11px;
          color: var(--scene-color, #3b82f6);
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--scene-color, #3b82f6);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .scene-card-play {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.6);
          transition: all 0.2s ease;
        }

        .scene-card:active .scene-card-play {
          background: var(--scene-color, #3b82f6);
          color: #fff;
        }

        .scene-card.active .scene-card-play {
          background: var(--scene-color, #3b82f6);
          color: #fff;
        }

        /* Empty State */
        .mobile-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.2);
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin: 0 0 4px 0;
        }

        .empty-subtext {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          margin: 0;
        }

        /* Context Menu */
        .context-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .context-menu {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          width: 100%;
          max-width: 360px;
          overflow: hidden;
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .context-menu-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .context-menu-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          text-transform: capitalize;
        }

        .context-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.9);
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .context-menu-item:active {
          background: rgba(255,255,255,0.1);
        }

        .context-menu-item.instant {
          color: #f59e0b;
        }

        .context-menu-divider {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 4px 0;
        }

        .context-menu-section-label {
          padding: 8px 16px 4px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
