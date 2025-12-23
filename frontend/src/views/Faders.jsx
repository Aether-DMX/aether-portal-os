import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Palette, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Zap, RotateCcw } from 'lucide-react';
import useDMXStore from '../store/dmxStore';
import useNodeStore from '../store/nodeStore';
import { useFixtureStore } from '../store/fixtureStore';

// Safe array helper
const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

// Color presets for RGB fixtures
const COLOR_PRESETS = [
  { name: 'Red', rgb: [255, 0, 0], color: '#ef4444' },
  { name: 'Orange', rgb: [255, 128, 0], color: '#f97316' },
  { name: 'Yellow', rgb: [255, 255, 0], color: '#eab308' },
  { name: 'Green', rgb: [0, 255, 0], color: '#22c55e' },
  { name: 'Cyan', rgb: [0, 255, 255], color: '#06b6d4' },
  { name: 'Blue', rgb: [0, 0, 255], color: '#3b82f6' },
  { name: 'Purple', rgb: [128, 0, 255], color: '#8b5cf6' },
  { name: 'Magenta', rgb: [255, 0, 255], color: '#ec4899' },
  { name: 'White', rgb: [255, 255, 255], color: '#ffffff' },
  { name: 'Warm', rgb: [255, 200, 150], color: '#fcd34d' },
];

// Vertical fader component - touch optimized for 800x480
function VerticalFader({ channel, value, onChange, onDragStart, onDragEnd, fixture, isActive }) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const pct = Math.round((value / 255) * 100);

  const handleInteraction = useCallback((clientY) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    // Invert Y - top = 100%, bottom = 0%
    const y = clientY - rect.top;
    const pctVal = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
    const dmxVal = Math.round((pctVal / 100) * 255);
    onChange(channel, dmxVal);
  }, [channel, onChange]);

  const handleStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    onDragStart?.();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    handleInteraction(clientY);
  };

  const handleMove = useCallback((e) => {
    if (!isDragging) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    handleInteraction(clientY);
  }, [isDragging, handleInteraction]);

  const handleEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  }, [isDragging, onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      const opts = { passive: false };
      window.addEventListener('mousemove', handleMove, opts);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, opts);
      window.addEventListener('touchend', handleEnd);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Channel label */}
      <div className="text-[10px] text-white/50 font-medium truncate w-full text-center">
        {fixture ? fixture.name : `Ch ${channel}`}
      </div>

      {/* Fader track */}
      <div
        ref={trackRef}
        className={`relative w-14 rounded-xl border transition-all touch-none cursor-pointer ${
          isDragging ? 'border-[var(--accent)] bg-white/10' : 'border-white/20 bg-black/40'
        } ${isActive ? 'ring-2 ring-[var(--accent)]/50' : ''}`}
        style={{ height: '160px' }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b-xl transition-all"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(to top, var(--accent), rgba(var(--accent-rgb), 0.3))`
          }}
        />

        {/* Handle */}
        <div
          className="absolute left-1 right-1 h-5 rounded-lg bg-white shadow-lg transition-all flex items-center justify-center"
          style={{ bottom: `calc(${pct}% - 10px)` }}
        >
          <div className="w-8 h-1 bg-black/30 rounded-full" />
        </div>

        {/* Tick marks */}
        <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none flex flex-col justify-between py-3 px-0.5">
          {[100, 75, 50, 25, 0].map(tick => (
            <div key={tick} className="flex items-center justify-between">
              <div className="w-1.5 h-px bg-white/20" />
              <div className="w-1.5 h-px bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Value */}
      <div className={`text-sm font-bold ${value > 0 ? 'text-white' : 'text-white/40'}`}>
        {pct}%
      </div>
    </div>
  );
}

// Quick action button
function QuickButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all active:scale-95 ${
        active
          ? 'bg-[var(--accent)] text-black'
          : 'bg-white/10 text-white/70 hover:bg-white/15'
      }`}
    >
      <Icon size={18} />
      <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
}

// Main Faders component - optimized for 800x480
export default function Faders() {
  const navigate = useNavigate();

  // DMX SSOT - use store's currentUniverse and configuredUniverses
  const {
    universeState: rawUniverseState,
    currentUniverse: storeUniverse,
    configuredUniverses: rawConfiguredUniverses,
    setChannels,
    setCurrentUniverse,
    initSocket,
    fetchUniverseState,
    stopPolling,
    startPolling
  } = useDMXStore();

  const { nodes: rawNodes, fetchNodes } = useNodeStore();
  const { fixtures: rawFixtures } = useFixtureStore();

  // Defensive arrays
  const nodes = safeArray(rawNodes);
  const fixtures = safeArray(rawFixtures);
  const universeState = safeArray(rawUniverseState).length === 512 ? rawUniverseState : new Array(512).fill(0);
  const configuredUniverses = safeArray(rawConfiguredUniverses).length > 0 ? rawConfiguredUniverses : [1];

  // Local state
  const [currentBank, setCurrentBank] = useState(0);
  const [showColors, setShowColors] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const dragCountRef = useRef(0); // Track number of active drags

  // Layout config for 800x480 - 8 faders per page (fits nicely)
  const FADERS_PER_PAGE = 8;
  const startChannel = currentBank * FADERS_PER_PAGE + 1;
  const endChannel = Math.min(startChannel + FADERS_PER_PAGE - 1, 512);
  const totalBanks = Math.ceil(512 / FADERS_PER_PAGE);

  // Initialize DMX connection
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        initSocket();
        await fetchNodes();
        await fetchUniverseState(storeUniverse || 1);
      } catch (e) {
        console.error('Faders init error:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Re-fetch when universe changes
  useEffect(() => {
    if (!loading) {
      fetchUniverseState(storeUniverse);
    }
  }, [storeUniverse]);

  // Get fixtures for current bank
  const bankFixtures = useMemo(() => {
    const result = {};
    for (let ch = startChannel; ch <= endChannel; ch++) {
      const fixture = fixtures.find(f =>
        f && f.universe === storeUniverse &&
        ch >= f.start_channel &&
        ch < f.start_channel + (f.channel_count || 1)
      );
      if (fixture) result[ch] = fixture;
    }
    return result;
  }, [fixtures, startChannel, endChannel, storeUniverse]);

  // Check if any fader in bank is active (> 0)
  const bankHasActive = useMemo(() => {
    for (let ch = startChannel; ch <= endChannel; ch++) {
      if ((universeState[ch - 1] || 0) > 0) return true;
    }
    return false;
  }, [universeState, startChannel, endChannel]);

  // Handle fader change - live update to SSOT
  const handleFaderChange = useCallback((channel, value) => {
    setChannels(storeUniverse, { [channel]: value }, 0);
  }, [storeUniverse, setChannels]);

  // Pause polling when any fader starts dragging
  const handleDragStart = useCallback(() => {
    dragCountRef.current += 1;
    if (dragCountRef.current === 1) {
      // First fader started dragging - pause polling
      stopPolling();
      setIsDraggingAny(true);
      console.log('⏸️ Paused polling - fader drag started');
    }
  }, [stopPolling]);

  // Resume polling when all faders stop dragging
  const handleDragEnd = useCallback(() => {
    dragCountRef.current = Math.max(0, dragCountRef.current - 1);
    if (dragCountRef.current === 0) {
      // All faders stopped dragging - resume polling after a short delay
      setTimeout(() => {
        if (dragCountRef.current === 0) {
          startPolling();
          setIsDraggingAny(false);
          console.log('▶️ Resumed polling - fader drag ended');
        }
      }, 100); // Small delay to let the last setChannels go through
    }
  }, [startPolling]);

  // Quick actions - apply to all faders in current bank
  const setAllInBank = (value) => {
    const channels = {};
    for (let ch = startChannel; ch <= endChannel; ch++) {
      channels[ch] = value;
    }
    setChannels(storeUniverse, channels, 100);
  };

  const applyColor = (rgb) => {
    const channels = {};
    // Apply RGB in groups of 3 starting from bank start
    for (let i = 0; i < FADERS_PER_PAGE; i++) {
      const ch = startChannel + i;
      if (ch <= 512) {
        channels[ch] = rgb[i % 3];
      }
    }
    setChannels(storeUniverse, channels, 100);
    setShowColors(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-[var(--accent)] animate-spin mb-4" />
        <p className="text-white/60">Connecting to DMX...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Connection Error</h2>
        <p className="text-white/60 text-sm text-center mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-bold flex items-center gap-2"
        >
          <RotateCcw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/10 active:scale-95">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">Faders</h1>

        {/* Universe selector - from SSOT */}
        <div className="flex gap-1 ml-auto">
          {configuredUniverses.map(u => (
            <button
              key={u}
              onClick={() => {
                setCurrentUniverse(u);
                setCurrentBank(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                storeUniverse === u
                  ? 'bg-[var(--accent)] text-black'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              U{u}
            </button>
          ))}
        </div>
      </div>

      {/* Bank selector + quick actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 shrink-0">
        {/* Bank nav */}
        <button
          onClick={() => setCurrentBank(b => Math.max(0, b - 1))}
          disabled={currentBank === 0}
          className="p-2 rounded-lg bg-white/10 disabled:opacity-30 active:scale-95"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>

        <div className="text-center min-w-[100px]">
          <div className="text-sm font-bold text-white">
            {startChannel}-{endChannel}
          </div>
          <div className="text-[10px] text-white/40">
            Bank {currentBank + 1}/{totalBanks}
          </div>
        </div>

        <button
          onClick={() => setCurrentBank(b => Math.min(totalBanks - 1, b + 1))}
          disabled={currentBank >= totalBanks - 1}
          className="p-2 rounded-lg bg-white/10 disabled:opacity-30 active:scale-95"
        >
          <ChevronRight size={18} className="text-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* Quick actions */}
        <QuickButton icon={Sun} label="Full" onClick={() => setAllInBank(255)} />
        <QuickButton icon={Moon} label="Off" onClick={() => setAllInBank(0)} />
        <QuickButton icon={Zap} label="50%" onClick={() => setAllInBank(128)} />
        <QuickButton
          icon={Palette}
          label="Color"
          onClick={() => setShowColors(!showColors)}
          active={showColors}
        />

        {/* Bank active indicator */}
        {bankHasActive && (
          <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent)]/20">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[10px] text-[var(--accent)] font-bold">LIVE</span>
          </div>
        )}
      </div>

      {/* Color picker */}
      {showColors && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/40 shrink-0">
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyColor(preset.rgb)}
              className="w-10 h-10 rounded-xl border-2 border-white/20 hover:scale-110 active:scale-95 transition-transform"
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}
        </div>
      )}

      {/* Faders - main content */}
      <div className="flex-1 flex items-center justify-center gap-4 px-4 py-2">
        {Array.from({ length: FADERS_PER_PAGE }, (_, i) => {
          const ch = startChannel + i;
          if (ch > 512) return null;
          const value = universeState[ch - 1] || 0;
          const fixture = bankFixtures[ch];

          return (
            <VerticalFader
              key={ch}
              channel={ch}
              value={value}
              onChange={handleFaderChange}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              fixture={fixture}
              isActive={value > 0}
            />
          );
        })}
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 text-xs text-white/40 shrink-0">
        <span>Universe {storeUniverse}</span>
        <span>{nodes.filter(n => n && n.status === 'online').length} nodes online</span>
      </div>
    </div>
  );
}
