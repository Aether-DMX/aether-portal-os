import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Square, Moon, AlertOctagon, Play, Pause, RotateCcw,
  ChevronUp, ChevronDown, Zap, Layers
} from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import usePlaybackStore from '../store/playbackStore';
import useDMXStore from '../store/dmxStore';

export default function MobileLive() {
  const { scenes, fetchScenes, playScene, stopScene } = useSceneStore();
  const { chases, fetchChases, startChase, stopChase } = useChaseStore();
  const { playback, syncStatus, stopAll } = usePlaybackStore();
  const { blackoutAll, masterValue } = useDMXStore();

  const [master, setMaster] = useState(masterValue || 100);
  const [isBlackout, setIsBlackout] = useState(false);
  const [longPressItem, setLongPressItem] = useState(null);
  const [showMasterSlider, setShowMasterSlider] = useState(false);

  const longPressTimer = useRef(null);
  const backendUrl = 'http://' + window.location.hostname + ':8891';

  useEffect(() => {
    fetchScenes();
    fetchChases();
    syncStatus();
    const i = setInterval(syncStatus, 2000);
    return () => clearInterval(i);
  }, []);

  // Sync master from store
  useEffect(() => {
    if (masterValue !== undefined) {
      setMaster(masterValue);
    }
  }, [masterValue]);

  const handleMaster = async (v) => {
    setMaster(v);
    try {
      await fetch(backendUrl + '/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: v })
      });
    } catch (e) { /* ignore */ }
  };

  const handleBlackout = async () => {
    // Trigger haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(100);

    setIsBlackout(true);
    await blackoutAll(500);
    await stopAll();

    // Visual feedback
    setTimeout(() => setIsBlackout(false), 1000);
  };

  const handlePauseAll = async () => {
    if (navigator.vibrate) navigator.vibrate(50);
    await stopAll();
  };

  const handleResume = async () => {
    // TODO: Implement resume from last state
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };

  // Get currently playing item
  const nowPlaying = Object.values(playback)[0];
  const isPlaying = !!nowPlaying;

  // Get display name for now playing
  const getNowPlayingName = () => {
    if (!nowPlaying) return 'Nothing';

    if (nowPlaying.type === 'scene') {
      const scene = scenes.find(s => (s.scene_id || s.id) === nowPlaying.id);
      return scene?.name?.replace(/_/g, ' ') || nowPlaying.id;
    }
    if (nowPlaying.type === 'chase') {
      const chase = chases.find(c => (c.chase_id || c.id) === nowPlaying.id);
      return chase?.name?.replace(/_/g, ' ') || nowPlaying.id;
    }
    return nowPlaying.name || nowPlaying.id || 'Unknown';
  };

  // Long press handlers
  const handleLongPressStart = (item, type) => {
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(30);
      setLongPressItem({ ...item, itemType: type });
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Check if item is playing
  const isItemPlaying = (item, type) => {
    const id = item.scene_id || item.chase_id || item.id;
    return Object.values(playback).some(
      p => p?.type === type && p?.id === id
    );
  };

  // Quick scenes and chases for mobile view
  const quickScenes = scenes.slice(0, 6);
  const quickChases = chases.slice(0, 4);

  return (
    <div className={`mobile-live ${isBlackout ? 'blackout-active' : ''}`}>
      {/* Now Playing - Hero Section */}
      <div className={`now-playing-hero ${isPlaying ? 'active' : ''}`}>
        <div className="now-playing-label">NOW PLAYING</div>
        <div className="now-playing-title">{getNowPlayingName()}</div>
        {isPlaying && (
          <div className="now-playing-indicator">
            <span className="pulse-ring" />
            <span className="pulse-dot" />
          </div>
        )}
        {isPlaying && (
          <button
            className="now-playing-stop"
            onClick={handlePauseAll}
            aria-label="Stop playback"
          >
            <Square size={20} />
          </button>
        )}
      </div>

      {/* Emergency Controls */}
      <div className="emergency-controls">
        <button
          className={`emergency-btn blackout ${isBlackout ? 'active' : ''}`}
          onClick={handleBlackout}
          aria-label="Blackout all lights"
        >
          <AlertOctagon size={24} />
          <span>BLACKOUT</span>
        </button>

        <button
          className="emergency-btn pause"
          onClick={handlePauseAll}
          disabled={!isPlaying}
          aria-label="Pause all playback"
        >
          <Pause size={20} />
          <span>Pause All</span>
        </button>

        <button
          className="emergency-btn resume"
          onClick={handleResume}
          aria-label="Resume output"
        >
          <RotateCcw size={20} />
          <span>Resume</span>
        </button>
      </div>

      {/* Master Intensity - Swipe Up to Expand */}
      <div
        className={`master-section ${showMasterSlider ? 'expanded' : ''}`}
        onClick={() => setShowMasterSlider(!showMasterSlider)}
      >
        <div className="master-header">
          <span className="master-label">MASTER</span>
          <span className="master-value">{master}%</span>
          {showMasterSlider ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
        {showMasterSlider && (
          <div className="master-slider-container" onClick={e => e.stopPropagation()}>
            <input
              type="range"
              min="0"
              max="100"
              value={master}
              onChange={e => handleMaster(+e.target.value)}
              className="master-slider"
              aria-label="Master intensity"
            />
            <div className="master-presets">
              <button onClick={() => handleMaster(0)}>0%</button>
              <button onClick={() => handleMaster(50)}>50%</button>
              <button onClick={() => handleMaster(100)}>100%</button>
            </div>
          </div>
        )}
      </div>

      {/* Scenes Grid */}
      <div className="mobile-section">
        <div className="section-header">
          <Layers size={16} />
          <span>SCENES</span>
        </div>
        <div className="playback-grid">
          {quickScenes.map(s => {
            const playing = isItemPlaying(s, 'scene');
            return (
              <PlaybackTile
                key={s.id}
                item={s}
                type="scene"
                playing={playing}
                onTap={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  if (playing) {
                    stopScene();
                  } else {
                    playScene(s.scene_id || s.id, 1000);
                  }
                }}
                onLongPressStart={() => handleLongPressStart(s, 'scene')}
                onLongPressEnd={handleLongPressEnd}
              />
            );
          })}
        </div>
      </div>

      {/* Chases Grid */}
      <div className="mobile-section">
        <div className="section-header">
          <Zap size={16} />
          <span>CHASES</span>
        </div>
        <div className="playback-grid chases">
          {quickChases.map(c => {
            const playing = isItemPlaying(c, 'chase');
            return (
              <PlaybackTile
                key={c.id}
                item={c}
                type="chase"
                playing={playing}
                onTap={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  if (playing) {
                    stopChase(c.chase_id || c.id);
                  } else {
                    startChase(c.chase_id || c.id);
                  }
                }}
                onLongPressStart={() => handleLongPressStart(c, 'chase')}
                onLongPressEnd={handleLongPressEnd}
              />
            );
          })}
        </div>
      </div>

      {/* Long Press Context Menu */}
      {longPressItem && (
        <LongPressMenu
          item={longPressItem}
          onClose={() => setLongPressItem(null)}
          onStop={() => {
            if (longPressItem.itemType === 'scene') {
              stopScene();
            } else {
              stopChase(longPressItem.chase_id || longPressItem.id);
            }
            setLongPressItem(null);
          }}
          onFade={(fadeMs) => {
            if (longPressItem.itemType === 'scene') {
              playScene(longPressItem.scene_id || longPressItem.id, fadeMs);
            }
            setLongPressItem(null);
          }}
        />
      )}

      <style>{mobileStyles}</style>
    </div>
  );
}

// Playback Tile Component
function PlaybackTile({ item, type, playing, onTap, onLongPressStart, onLongPressEnd }) {
  const color = item.color || (type === 'chase' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(59, 130, 246, 0.5)');

  return (
    <button
      className={`playback-tile ${type} ${playing ? 'playing' : ''}`}
      onClick={onTap}
      onTouchStart={onLongPressStart}
      onTouchEnd={onLongPressEnd}
      onMouseDown={onLongPressStart}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressEnd}
      style={{
        '--tile-color': color,
      }}
    >
      <div className="tile-color-preview" style={{ background: color }} />
      <div className="tile-content">
        <span className="tile-name">{item.name?.replace(/_/g, ' ')}</span>
        {type === 'chase' && (
          <span className="tile-meta">{item.steps?.length || 0} steps</span>
        )}
      </div>
      {playing && (
        <div className="tile-playing-indicator">
          <Square size={12} />
        </div>
      )}
    </button>
  );
}

// Long Press Context Menu
function LongPressMenu({ item, onClose, onStop, onFade }) {
  const isPlaying = item.isPlaying;

  return (
    <div className="longpress-overlay" onClick={onClose}>
      <div className="longpress-menu" onClick={e => e.stopPropagation()}>
        <div className="longpress-header">
          <span className="longpress-title">{item.name?.replace(/_/g, ' ')}</span>
          <span className="longpress-type">{item.itemType}</span>
        </div>

        <div className="longpress-actions">
          <button className="longpress-action stop" onClick={onStop}>
            <Square size={18} />
            <span>Stop</span>
          </button>

          {item.itemType === 'scene' && (
            <>
              <button className="longpress-action" onClick={() => onFade(500)}>
                <Play size={18} />
                <span>Quick Fade (0.5s)</span>
              </button>
              <button className="longpress-action" onClick={() => onFade(2000)}>
                <Play size={18} />
                <span>Slow Fade (2s)</span>
              </button>
              <button className="longpress-action" onClick={() => onFade(5000)}>
                <Play size={18} />
                <span>Very Slow (5s)</span>
              </button>
            </>
          )}
        </div>

        <button className="longpress-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const mobileStyles = `
  .mobile-live {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    padding-bottom: 100px;
    min-height: 100%;
    transition: background 0.3s;
  }

  .mobile-live.blackout-active {
    background: rgba(239, 68, 68, 0.1);
  }

  /* Now Playing Hero */
  .now-playing-hero {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    position: relative;
    transition: all 0.3s;
  }

  .now-playing-hero.active {
    background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.08);
    border-color: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.2);
  }

  .now-playing-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 8px;
  }

  .now-playing-title {
    font-size: 24px;
    font-weight: 700;
    color: white;
    text-transform: capitalize;
  }

  .now-playing-hero.active .now-playing-title {
    color: var(--theme-primary, #00ffaa);
  }

  .now-playing-indicator {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 12px;
    height: 12px;
  }

  .pulse-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--theme-primary, #00ffaa);
    animation: pulseRing 1.5s ease-out infinite;
  }

  @keyframes pulseRing {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }

  .pulse-dot {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--theme-primary, #00ffaa);
  }

  .now-playing-stop {
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.2);
    border: none;
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .now-playing-stop:active {
    transform: scale(0.95);
    background: rgba(239, 68, 68, 0.3);
  }

  /* Emergency Controls */
  .emergency-controls {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 10px;
  }

  .emergency-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 16px 12px;
    border-radius: 14px;
    border: none;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    min-height: 70px;
  }

  .emergency-btn:active {
    transform: scale(0.97);
  }

  .emergency-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .emergency-btn.blackout {
    background: rgba(239, 68, 68, 0.15);
    border: 2px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  .emergency-btn.blackout.active {
    background: rgba(239, 68, 68, 0.4);
    animation: blackoutPulse 0.5s ease;
  }

  @keyframes blackoutPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  .emergency-btn.blackout:active {
    background: rgba(239, 68, 68, 0.3);
  }

  .emergency-btn.pause {
    background: rgba(234, 179, 8, 0.15);
    border: 1px solid rgba(234, 179, 8, 0.3);
    color: #eab308;
  }

  .emergency-btn.resume {
    background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.15);
    border: 1px solid rgba(var(--theme-primary-rgb, 0, 255, 170), 0.3);
    color: var(--theme-primary, #00ffaa);
  }

  /* Master Section */
  .master-section {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .master-section.expanded {
    background: rgba(255, 255, 255, 0.05);
  }

  .master-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .master-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.4);
  }

  .master-value {
    flex: 1;
    font-size: 20px;
    font-weight: 700;
    color: var(--theme-primary, #00ffaa);
  }

  .master-slider-container {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .master-slider {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    outline: none;
  }

  .master-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--theme-primary, #00ffaa);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .master-presets {
    display: flex;
    gap: 8px;
  }

  .master-presets button {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .master-presets button:active {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Section Header */
  .mobile-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: rgba(255, 255, 255, 0.4);
    padding: 0 4px;
  }

  /* Playback Grid */
  .playback-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .playback-grid.chases {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Playback Tile */
  .playback-tile {
    display: flex;
    flex-direction: column;
    padding: 0;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
    min-height: 80px;
  }

  .playback-tile:active {
    transform: scale(0.97);
  }

  .playback-tile.scene {
    border-color: rgba(59, 130, 246, 0.2);
  }

  .playback-tile.chase {
    border-color: rgba(168, 85, 247, 0.2);
  }

  .playback-tile.playing {
    border-color: var(--theme-primary, #00ffaa);
    box-shadow: 0 0 20px rgba(var(--theme-primary-rgb, 0, 255, 170), 0.2);
  }

  .tile-color-preview {
    height: 6px;
    width: 100%;
    opacity: 0.6;
  }

  .playback-tile.playing .tile-color-preview {
    opacity: 1;
    animation: colorPulse 1s ease-in-out infinite;
  }

  @keyframes colorPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .tile-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    gap: 4px;
  }

  .tile-name {
    font-size: 12px;
    font-weight: 600;
    color: white;
    text-align: center;
    line-height: 1.2;
    text-transform: capitalize;
  }

  .tile-meta {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
  }

  .tile-playing-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    color: var(--theme-primary, #00ffaa);
  }

  /* Long Press Menu */
  .longpress-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .longpress-menu {
    width: 100%;
    max-width: 400px;
    background: rgba(25, 25, 35, 0.98);
    border-radius: 20px;
    padding: 20px;
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .longpress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .longpress-title {
    font-size: 18px;
    font-weight: 600;
    color: white;
    text-transform: capitalize;
  }

  .longpress-type {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
  }

  .longpress-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .longpress-action {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: none;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .longpress-action:active {
    background: rgba(255, 255, 255, 0.1);
  }

  .longpress-action.stop {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .longpress-cancel {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .longpress-cancel:active {
    background: rgba(255, 255, 255, 0.06);
  }
`;
