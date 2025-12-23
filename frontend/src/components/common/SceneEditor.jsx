import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, Play, ChevronLeft, ChevronRight, Palette, Plus, Trash2 } from 'lucide-react';
import useToastStore from '../../store/toastStore';

// Color presets for quick scene creation
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

const SCENE_COLORS = ['blue', 'purple', 'cyan', 'green', 'red', 'orange'];

// Vertical fader component - matches Faders page design
function VerticalFader({ channel, value, label, onChange }) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const pct = Math.round((value / 255) * 100);

  const handleInteraction = useCallback((clientY) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const pctVal = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
    const dmxVal = Math.round((pctVal / 100) * 255);
    onChange(channel, dmxVal);
  }, [channel, onChange]);

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    handleInteraction(clientY);
  };

  const handleMove = useCallback((e) => {
    if (!isDragging) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    handleInteraction(clientY);
  }, [isDragging, handleInteraction]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

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
        {label || `Ch ${channel}`}
      </div>

      {/* Fader track */}
      <div
        ref={trackRef}
        className={`relative w-12 rounded-xl border transition-all touch-none cursor-pointer ${
          isDragging ? 'border-[var(--accent)] bg-white/10' : 'border-white/20 bg-black/40'
        } ${value > 0 ? 'ring-2 ring-[var(--accent)]/50' : ''}`}
        style={{ height: '120px' }}
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
          className="absolute left-1 right-1 h-4 rounded-lg bg-white shadow-lg transition-all flex items-center justify-center"
          style={{ bottom: `calc(${pct}% - 8px)` }}
        >
          <div className="w-6 h-0.5 bg-black/30 rounded-full" />
        </div>

        {/* Tick marks */}
        <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none flex flex-col justify-between py-2 px-0.5">
          {[100, 50, 0].map(tick => (
            <div key={tick} className="flex items-center justify-between">
              <div className="w-1 h-px bg-white/20" />
              <div className="w-1 h-px bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Value + delete */}
      <div className="flex items-center gap-1">
        <span className={`text-xs font-bold ${value > 0 ? 'text-white' : 'text-white/40'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function SceneEditor({ scene, onSave, onClose }) {
  const toast = useToastStore();
  const [name, setName] = useState(scene?.name || '');
  const [fadeTime, setFadeTime] = useState(scene?.fade_ms || scene?.fadeTime || 0);
  const [color, setColor] = useState(scene?.color || 'blue');
  const [universe, setUniverse] = useState(scene?.universe || 1);
  const [channels, setChannels] = useState(scene?.channels || {});
  const [currentPage, setCurrentPage] = useState(0);
  const [showColors, setShowColors] = useState(false);

  // Configuration - 8 faders visible at a time for 800x480
  const FADERS_PER_PAGE = 8;

  // Get sorted channel numbers
  const channelNumbers = Object.keys(channels).map(Number).sort((a, b) => a - b);
  const totalPages = Math.max(1, Math.ceil(channelNumbers.length / FADERS_PER_PAGE));

  // Current page channels
  const startIdx = currentPage * FADERS_PER_PAGE;
  const pageChannels = channelNumbers.slice(startIdx, startIdx + FADERS_PER_PAGE);

  // Update channel value
  const updateChannel = (ch, value) => {
    setChannels({ ...channels, [ch]: value });
  };

  // Add new channel
  const addChannel = () => {
    const maxCh = channelNumbers.length > 0 ? Math.max(...channelNumbers) : 0;
    const newCh = Math.min(512, maxCh + 1);
    if (!channels[newCh]) {
      setChannels({ ...channels, [newCh]: 0 });
      // Navigate to page containing new channel
      const newIdx = Object.keys({ ...channels, [newCh]: 0 }).map(Number).sort((a, b) => a - b).indexOf(newCh);
      setCurrentPage(Math.floor(newIdx / FADERS_PER_PAGE));
    }
  };

  // Add multiple channels (bulk)
  const addChannelRange = (start, count) => {
    const newChannels = { ...channels };
    for (let i = 0; i < count; i++) {
      const ch = start + i;
      if (ch <= 512 && !newChannels[ch]) {
        newChannels[ch] = 0;
      }
    }
    setChannels(newChannels);
  };

  // Remove channel
  const removeChannel = (ch) => {
    const newChannels = { ...channels };
    delete newChannels[ch];
    setChannels(newChannels);
  };

  // Apply color preset to first 3 channels (RGB)
  const applyColorPreset = (preset) => {
    const sortedChans = Object.keys(channels).map(Number).sort((a, b) => a - b);
    if (sortedChans.length >= 3) {
      const newChannels = { ...channels };
      newChannels[sortedChans[0]] = preset.rgb[0];
      newChannels[sortedChans[1]] = preset.rgb[1];
      newChannels[sortedChans[2]] = preset.rgb[2];
      setChannels(newChannels);
    } else {
      toast.warning('Add at least 3 channels for RGB presets');
    }
  };

  // Set all channels to a value
  const setAllTo = (value) => {
    const newChannels = {};
    Object.keys(channels).forEach(ch => {
      newChannels[ch] = value;
    });
    setChannels(newChannels);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning('Scene name is required');
      return;
    }

    if (Object.keys(channels).length === 0) {
      toast.warning('Add at least one channel');
      return;
    }

    onSave({
      ...scene,
      name: name.trim(),
      fadeTime: parseInt(fadeTime) || 0,
      fade_ms: parseInt(fadeTime) || 0,
      color,
      universe: parseInt(universe),
      channels,
    });
  };

  const testScene = async () => {
    if (!name.trim()) {
      toast.warning('Please name the scene first');
      return;
    }

    try {
      await onSave({
        ...scene,
        name: name.trim(),
        fadeTime: parseInt(fadeTime) || 0,
        fade_ms: parseInt(fadeTime) || 0,
        color,
        universe: parseInt(universe),
        channels,
      }, true);
      toast.success('Scene sent to DMX!');
    } catch (error) {
      toast.error('Failed to test scene: ' + error.message);
    }
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div className="flex-1 flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10">
            <X size={18} className="text-white" />
          </button>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-transparent text-lg font-bold text-white outline-none border-b border-transparent focus:border-[var(--accent)]"
            placeholder="Scene Name..."
            maxLength={50}
          />
          <button onClick={testScene} className="px-3 py-2 rounded-lg bg-white/10 text-white flex items-center gap-2">
            <Play size={16} /> Test
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-bold flex items-center gap-2">
            <Save size={16} /> Save
          </button>
        </div>

        {/* Settings row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 shrink-0">
          {/* Universe */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Universe</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(u => (
                <button
                  key={u}
                  onClick={() => setUniverse(u)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold ${
                    universe === u ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Fade time */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Fade</span>
            <div className="flex gap-1">
              {[0, 500, 1000, 2000].map(ms => (
                <button
                  key={ms}
                  onClick={() => setFadeTime(ms)}
                  className={`px-2 h-8 rounded-lg text-xs font-bold ${
                    fadeTime === ms ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {ms === 0 ? 'Snap' : `${ms / 1000}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Color tag */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Tag</span>
            <div className="flex gap-1">
              {SCENE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ background: c === 'white' ? '#ffffff' : `var(--${c}-500, ${c})` }}
                />
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Quick add channels */}
          <button
            onClick={addChannel}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs flex items-center gap-1"
          >
            <Plus size={14} /> Channel
          </button>
          <button
            onClick={() => addChannelRange(1, 4)}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs"
          >
            +4 Ch
          </button>
          <button
            onClick={() => setShowColors(!showColors)}
            className={`p-2 rounded-lg ${showColors ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white'}`}
          >
            <Palette size={16} />
          </button>
        </div>

        {/* Color presets panel */}
        {showColors && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 shrink-0 bg-white/5">
            <span className="text-xs text-white/50">RGB Presets:</span>
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => applyColorPreset(preset)}
                className="w-8 h-8 rounded-lg border-2 border-white/20 hover:border-white/50 transition-all"
                style={{ background: preset.color }}
                title={preset.name}
              />
            ))}
            <div className="flex-1" />
            <button onClick={() => setAllTo(255)} className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs">All 100%</button>
            <button onClick={() => setAllTo(128)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs">All 50%</button>
            <button onClick={() => setAllTo(0)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs">All Off</button>
          </div>
        )}

        {/* Faders area */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {Object.keys(channels).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-3">🎚️</div>
              <h3 className="text-lg font-semibold text-white mb-2">No Channels Yet</h3>
              <p className="text-white/50 text-sm mb-4">Add channels to create your scene</p>
              <div className="flex gap-3">
                <button
                  onClick={() => addChannelRange(1, 4)}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-bold text-sm"
                >
                  Add Channels 1-4
                </button>
                <button
                  onClick={() => addChannelRange(1, 8)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white font-semibold text-sm"
                >
                  Add Channels 1-8
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Fader grid */}
              <div className="flex-1 flex items-center justify-center gap-3">
                {/* Prev page */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-3 rounded-xl bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>

                {/* Faders */}
                <div className="flex gap-4 items-end">
                  {pageChannels.map(ch => (
                    <div key={ch} className="relative">
                      <VerticalFader
                        channel={ch}
                        value={channels[ch] || 0}
                        label={`Ch ${ch}`}
                        onChange={updateChannel}
                      />
                      <button
                        onClick={() => removeChannel(ch)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Empty slots if less than 8 */}
                  {pageChannels.length < FADERS_PER_PAGE && (
                    <button
                      onClick={addChannel}
                      className="w-12 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 hover:border-white/40 hover:text-white/50 transition-all"
                      style={{ height: '120px' }}
                    >
                      <Plus size={24} />
                    </button>
                  )}
                </div>

                {/* Next page */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-3 rounded-xl bg-white/10 disabled:opacity-30"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </div>

              {/* Page indicator */}
              {totalPages > 1 && (
                <div className="text-center text-white/50 text-sm mt-2">
                  Page {currentPage + 1} / {totalPages} • {channelNumbers.length} channels total
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer summary */}
        <div className="px-4 py-2 border-t border-white/10 shrink-0 flex items-center justify-between text-sm text-white/50">
          <span>Universe {universe} • {Object.keys(channels).length} channels • {fadeTime}ms fade</span>
          <span className="text-white/30">Tap fader track to set value, drag to adjust</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
