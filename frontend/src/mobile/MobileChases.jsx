import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Clock, Zap, Pause, SkipForward, Gauge } from 'lucide-react';
import useChaseStore from '../store/chaseStore';
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

// Chase Card Component - Rich playback tile for sequences
function ChaseCard({ chase, isActive, onPlay, onLongPress }) {
  const longPressHandlers = useLongPress(() => onLongPress(chase));

  const displayName = chase.name?.replace(/_/g, ' ') || 'Unnamed';
  const stepCount = chase.steps?.length || 0;
  const bpm = chase.bpm || 120;

  // Chase accent color (purple theme)
  const chaseColor = '#a855f7';

  return (
    <button
      className={`chase-card ${isActive ? 'active' : ''}`}
      onClick={() => { haptic(); onPlay(chase); }}
      {...longPressHandlers}
      style={{
        '--chase-color': chaseColor,
      }}
    >
      {/* Color preview bar */}
      <div className="chase-card-color" style={{ background: chaseColor }} />

      {/* Content */}
      <div className="chase-card-content">
        <span className="chase-card-name">{displayName}</span>
        <div className="chase-card-meta">
          <span className="chase-meta-item">
            <SkipForward size={12} />
            {stepCount} steps
          </span>
          <span className="chase-meta-item">
            <Gauge size={12} />
            {bpm} BPM
          </span>
        </div>
        {isActive && (
          <div className="chase-card-active-indicator">
            <div className="chase-pulse-animation" />
            <span>Running</span>
          </div>
        )}
      </div>

      {/* Play icon overlay */}
      <div className="chase-card-play">
        <Play size={20} fill="currentColor" />
      </div>
    </button>
  );
}

// Context Menu for long-press actions
function ContextMenu({ chase, onClose, onAction }) {
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

  const displayName = chase.name?.replace(/_/g, ' ') || 'Unnamed';
  const bpm = chase.bpm || 120;

  return (
    <div className="context-menu-overlay" onClick={onClose}>
      <div
        ref={menuRef}
        className="context-menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="context-menu-header">
          <span className="context-menu-title">{displayName}</span>
          <span className="context-menu-subtitle">{bpm} BPM</span>
        </div>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('play', chase); onClose(); }}
        >
          <Play size={18} />
          <span>Start Chase</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('stop', chase); onClose(); }}
        >
          <Square size={18} />
          <span>Stop</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('pause', chase); onClose(); }}
        >
          <Pause size={18} />
          <span>Pause</span>
        </button>

        <div className="context-menu-divider" />

        <div className="context-menu-section-label">Fade Between Steps</div>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('fade-0', chase); onClose(); }}
        >
          <Zap size={18} />
          <span>Snap (No Fade)</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('fade-25', chase); onClose(); }}
        >
          <Clock size={18} />
          <span>25% Crossfade</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('fade-50', chase); onClose(); }}
        >
          <Clock size={18} />
          <span>50% Crossfade</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => { haptic(); onAction('fade-100', chase); onClose(); }}
        >
          <Clock size={18} />
          <span>Full Crossfade</span>
        </button>

        <div className="context-menu-divider" />

        <div className="context-menu-section-label">Tempo</div>

        <div className="context-menu-tempo-controls">
          <button
            className="tempo-btn"
            onClick={() => { haptic(); onAction('tempo-slow', chase); }}
          >
            -10
          </button>
          <span className="tempo-display">{bpm} BPM</span>
          <button
            className="tempo-btn"
            onClick={() => { haptic(); onAction('tempo-fast', chase); }}
          >
            +10
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MobileChases() {
  const { chases, fetchChases, playChase, stopChase } = useChaseStore();
  const playbackStore = usePlaybackStore();
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    fetchChases();
  }, [fetchChases]);

  // Get active chase from playback state
  const getActiveChaseId = () => {
    if (playbackStore?.currentChase) {
      return playbackStore.currentChase.id;
    }
    return null;
  };

  const activeChaseId = getActiveChaseId();

  const handlePlay = (chase) => {
    playChase(chase.id, 1); // 1 second default fade
  };

  const handleLongPress = (chase) => {
    setContextMenu({ chase });
  };

  const handleAction = (action, chase) => {
    switch (action) {
      case 'play':
        playChase(chase.id, 1);
        break;
      case 'stop':
        if (stopChase) {
          stopChase(chase.id);
        }
        break;
      case 'pause':
        if (playbackStore?.pauseChase) {
          playbackStore.pauseChase(chase.id);
        }
        break;
      case 'fade-0':
        playChase(chase.id, 0);
        break;
      case 'fade-25':
        // Play with 25% crossfade timing
        playChase(chase.id, 0.25);
        break;
      case 'fade-50':
        playChase(chase.id, 0.5);
        break;
      case 'fade-100':
        playChase(chase.id, 1);
        break;
      case 'tempo-slow':
        // Would need chase tempo update API
        console.log('Slow down tempo for chase', chase.id);
        break;
      case 'tempo-fast':
        // Would need chase tempo update API
        console.log('Speed up tempo for chase', chase.id);
        break;
      default:
        break;
    }
  };

  return (
    <div className="mobile-chases-page">
      {/* Header */}
      <div className="mobile-page-header">
        <h1 className="mobile-page-title">Chases</h1>
        <span className="mobile-page-count">{chases.length} available</span>
      </div>

      {/* Chase Grid */}
      {chases.length === 0 ? (
        <div className="mobile-empty-state">
          <div className="empty-icon chase">
            <SkipForward size={32} />
          </div>
          <p className="empty-text">No chases available</p>
          <p className="empty-subtext">Create chases on desktop to run them here</p>
        </div>
      ) : (
        <div className="chase-card-grid">
          {chases.map(chase => (
            <ChaseCard
              key={chase.id}
              chase={chase}
              isActive={chase.id === activeChaseId}
              onPlay={handlePlay}
              onLongPress={handleLongPress}
            />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          chase={contextMenu.chase}
          onClose={() => setContextMenu(null)}
          onAction={handleAction}
        />
      )}

      {/* Styles */}
      <style>{`
        .mobile-chases-page {
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

        /* Chase Card Grid */
        .chase-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        /* Chase Card */
        .chase-card {
          position: relative;
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 110px;
          display: flex;
          flex-direction: column;
          -webkit-tap-highlight-color: transparent;
        }

        .chase-card:active {
          transform: scale(0.97);
          background: rgba(168, 85, 247, 0.12);
        }

        .chase-card.active {
          border-color: var(--chase-color, #a855f7);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
        }

        .chase-card-color {
          height: 6px;
          width: 100%;
          flex-shrink: 0;
        }

        .chase-card-content {
          flex: 1;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .chase-card-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          text-transform: capitalize;
          line-height: 1.3;
        }

        .chase-card-meta {
          display: flex;
          gap: 10px;
        }

        .chase-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: rgba(255,255,255,0.5);
        }

        .chase-card-active-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: auto;
          font-size: 11px;
          color: var(--chase-color, #a855f7);
        }

        .chase-pulse-animation {
          width: 24px;
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg,
            var(--chase-color) 0%,
            var(--chase-color) 50%,
            transparent 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: chaseStep 0.5s steps(2) infinite;
        }

        @keyframes chaseStep {
          0% { background-position: 0% 0; }
          100% { background-position: -200% 0; }
        }

        .chase-card-play {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(168, 85, 247, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(168, 85, 247, 0.8);
          transition: all 0.2s ease;
        }

        .chase-card:active .chase-card-play {
          background: var(--chase-color, #a855f7);
          color: #fff;
        }

        .chase-card.active .chase-card-play {
          background: var(--chase-color, #a855f7);
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

        .empty-icon.chase {
          background: rgba(168, 85, 247, 0.1);
          color: rgba(168, 85, 247, 0.4);
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
          border: 1px solid rgba(168, 85, 247, 0.2);
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
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .context-menu-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          text-transform: capitalize;
        }

        .context-menu-subtitle {
          font-size: 13px;
          color: rgba(168, 85, 247, 0.8);
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
          background: rgba(168, 85, 247, 0.15);
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

        .context-menu-tempo-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          gap: 12px;
        }

        .tempo-btn {
          width: 56px;
          height: 44px;
          border-radius: 8px;
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: #a855f7;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tempo-btn:active {
          background: rgba(168, 85, 247, 0.3);
          transform: scale(0.95);
        }

        .tempo-display {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
