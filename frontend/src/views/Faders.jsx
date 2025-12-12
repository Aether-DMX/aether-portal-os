import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layers, Sun, Moon, Lock, Unlock, Palette } from 'lucide-react';
import useDMXStore from '../store/dmxStore';
import useNodeStore from '../store/nodeStore';
import { useFixtureStore } from '../store/fixtureStore';

const COLOR_PRESETS = [
  { name: 'Red', rgb: [255, 0, 0] },
  { name: 'Orange', rgb: [255, 128, 0] },
  { name: 'Yellow', rgb: [255, 255, 0] },
  { name: 'Green', rgb: [0, 255, 0] },
  { name: 'Cyan', rgb: [0, 255, 255] },
  { name: 'Blue', rgb: [0, 0, 255] },
  { name: 'Purple', rgb: [128, 0, 255] },
  { name: 'Magenta', rgb: [255, 0, 255] },
  { name: 'White', rgb: [255, 255, 255] },
  { name: 'Warm', rgb: [255, 200, 150] },
];

function ChannelCell({ channel, value, isSelected, onSelect, isLocked }) {
  const brightness = Math.round((value / 255) * 100);
  
  return (
    <button
      onClick={() => onSelect(channel)}
      className={`relative aspect-square rounded-lg transition-all duration-150 ${
        isSelected 
          ? 'ring-2 ring-white scale-105 z-10' 
          : 'hover:ring-1 hover:ring-white/50'
      } ${isLocked ? 'opacity-50' : ''}`}
      style={{
        background: value > 0 
          ? `linear-gradient(135deg, rgba(255,255,255,${brightness/100 * 0.3}) 0%, rgba(var(--theme-primary-rgb),${brightness/100 * 0.5}) 100%)`
          : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isSelected ? 'white' : 'rgba(255,255,255,0.1)'}`
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[10px] font-bold ${value > 128 ? 'text-white' : 'text-white/70'}`}>
          {channel}
        </span>
        {value > 0 && (
          <span className="text-[8px] text-white/60">{brightness}%</span>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 rounded-b-lg overflow-hidden">
        <div 
          className="h-full transition-all duration-100"
          style={{ width: `${brightness}%`, background: 'var(--theme-primary)' }}
        />
      </div>
      {isLocked && (
        <div className="absolute top-0.5 right-0.5">
          <Lock size={8} className="text-yellow-400" />
        </div>
      )}
    </button>
  );
}

function ValueStrip({ value, onChange, onChangeEnd, selectedCount }) {
  const stripRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleInteraction = useCallback((clientX) => {
    if (!stripRef.current) return;
    const rect = stripRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    onChange(Math.round((pct / 100) * 255));
  }, [onChange]);

  const handleStart = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    handleInteraction(clientX);
  };

  const handleMove = useCallback((e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    handleInteraction(clientX);
  }, [isDragging, handleInteraction]);

  const handleEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onChangeEnd?.();
    }
  }, [isDragging, onChangeEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleMove, handleEnd]);

  const pct = Math.round((value / 255) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">
          {selectedCount > 0 ? `${selectedCount} channel${selectedCount > 1 ? 's' : ''} selected` : 'Tap channels above'}
        </span>
        <span className="font-bold text-white">{pct}%</span>
      </div>
      <div
        ref={stripRef}
        className="h-14 rounded-xl bg-black/40 border border-white/10 relative cursor-pointer overflow-hidden touch-none"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div 
          className="absolute inset-0 opacity-30"
          style={{ background: 'linear-gradient(90deg, #000 0%, var(--theme-primary) 50%, #fff 100%)' }}
        />
        <div 
          className="absolute top-0 bottom-0 left-0 transition-all duration-75"
          style={{ 
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgba(var(--theme-primary-rgb),0.3) 0%, rgba(var(--theme-primary-rgb),0.8) 100%)'
          }}
        />
        <div 
          className="absolute top-1 bottom-1 w-1 bg-white rounded-full shadow-lg transition-all duration-75"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
        <div className="absolute top-0 bottom-0 left-1/4 w-px bg-white/10" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
        <div className="absolute top-0 bottom-0 left-3/4 w-px bg-white/10" />
      </div>
    </div>
  );
}

export default function Faders() {
  const { nodes } = useNodeStore();
  const { fixtures } = useFixtureStore();
  const { universeState, setChannel, setChannels, fetchUniverseState } = useDMXStore();
  
  const [selectedChannels, setSelectedChannels] = useState(new Set());
  const [currentBank, setCurrentBank] = useState(0);
  const [currentUniverse, setCurrentUniverse] = useState(1);
  const [adjustValue, setAdjustValue] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [lockedChannels, setLockedChannels] = useState(new Set());

  const universes = [...new Set(nodes.map(n => n.universe || 1))].sort((a, b) => a - b);
  if (universes.length === 0) universes.push(1);

  const CHANNELS_PER_PAGE = 32;
  const COLS = 8;
  const startChannel = currentBank * CHANNELS_PER_PAGE + 1;
  const endChannel = Math.min(startChannel + CHANNELS_PER_PAGE - 1, 512);
  const totalBanks = Math.ceil(512 / CHANNELS_PER_PAGE);

  useEffect(() => {
    fetchUniverseState(currentUniverse);
  }, [currentUniverse, fetchUniverseState]);

  useEffect(() => {
    if (selectedChannels.size === 1) {
      const ch = Array.from(selectedChannels)[0];
      setAdjustValue(universeState[ch - 1] || 0);
    } else if (selectedChannels.size > 1) {
      let sum = 0;
      selectedChannels.forEach(ch => { sum += universeState[ch - 1] || 0; });
      setAdjustValue(Math.round(sum / selectedChannels.size));
    }
  }, [selectedChannels, universeState]);

  const toggleChannel = (ch) => {
    if (lockedChannels.has(ch)) return;
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set();
    for (let i = startChannel; i <= endChannel; i++) {
      if (!lockedChannels.has(i)) all.add(i);
    }
    setSelectedChannels(all);
  };

  const selectNone = () => setSelectedChannels(new Set());

  const handleValueChange = (newValue) => {
    setAdjustValue(newValue);
    if (selectedChannels.size > 0) {
      const channels = {};
      selectedChannels.forEach(ch => { channels[ch] = newValue; });
      setChannels(currentUniverse, channels, 0);
    }
  };

  const handleValueChangeEnd = () => {
    if (selectedChannels.size > 0) {
      const channels = {};
      selectedChannels.forEach(ch => { channels[ch] = adjustValue; });
      setChannels(currentUniverse, channels, 100);
    }
  };

  const applyColorPreset = (rgb) => {
    if (selectedChannels.size === 0) return;
    const sortedChannels = Array.from(selectedChannels).sort((a, b) => a - b);
    const channels = {};
    sortedChannels.forEach((ch, idx) => {
      channels[ch] = rgb[idx % 3];
    });
    setChannels(currentUniverse, channels, 200);
    setShowColorPicker(false);
  };

  const quickSet = (value) => {
    if (selectedChannels.size === 0) return;
    const channels = {};
    selectedChannels.forEach(ch => { channels[ch] = value; });
    setChannels(currentUniverse, channels, 200);
    setAdjustValue(value);
  };

  const toggleLock = () => {
    if (selectedChannels.size === 0) return;
    const allLocked = Array.from(selectedChannels).every(ch => lockedChannels.has(ch));
    setLockedChannels(prev => {
      const next = new Set(prev);
      selectedChannels.forEach(ch => {
        if (allLocked) next.delete(ch);
        else next.add(ch);
      });
      return next;
    });
  };

  return (
    <div className="page-container flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center gap-2 p-2 border-b border-white/10">
        <div className="flex gap-1">
          {universes.map(u => (
            <button
              key={u}
              onClick={() => setCurrentUniverse(u)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentUniverse === u 
                  ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[rgba(var(--theme-primary-rgb),0.7)] text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              U{u}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex-1 overflow-x-auto flex gap-1 scrollbar-hide">
          {Array.from({ length: totalBanks }, (_, i) => {
            const bankStart = i * CHANNELS_PER_PAGE + 1;
            const bankEnd = Math.min((i + 1) * CHANNELS_PER_PAGE, 512);
            return (
              <button
                key={i}
                onClick={() => { setCurrentBank(i); setSelectedChannels(new Set()); }}
                className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap transition-all ${
                  currentBank === i ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {bankStart}-{bankEnd}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 p-2 border-b border-white/10 overflow-x-auto">
        <button onClick={selectAll} className="px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] font-bold hover:bg-white/10">All</button>
        <button onClick={selectNone} className="px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] font-bold hover:bg-white/10">None</button>
        <div className="w-px h-4 bg-white/10" />
        <button onClick={() => quickSet(255)} className="px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] font-bold hover:bg-white/10 flex items-center gap-1">
          <Sun size={10} /> Full
        </button>
        <button onClick={() => quickSet(0)} className="px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] font-bold hover:bg-white/10 flex items-center gap-1">
          <Moon size={10} /> Off
        </button>
        <button onClick={() => quickSet(128)} className="px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] font-bold hover:bg-white/10">50%</button>
        <div className="w-px h-4 bg-white/10" />
        <button 
          onClick={() => setShowColorPicker(!showColorPicker)} 
          className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${showColorPicker ? 'bg-[var(--theme-primary)]/30 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
        >
          <Palette size={10} /> Color
        </button>
        <button onClick={toggleLock} className="px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] font-bold hover:bg-white/10 flex items-center gap-1">
          {lockedChannels.size > 0 ? <Lock size={10} /> : <Unlock size={10} />} Lock
        </button>
      </div>

      {/* Color Picker */}
      {showColorPicker && (
        <div className="p-2 border-b border-white/10 bg-black/30">
          <div className="flex gap-1 flex-wrap">
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => applyColorPreset(preset.rgb)}
                className="w-8 h-8 rounded-lg border border-white/20 hover:scale-110 transition-transform"
                style={{ backgroundColor: `rgb(${preset.rgb.join(',')})` }}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Channel Grid */}
      <div className="flex-1 p-2 overflow-hidden">
        <div 
          className="h-full grid gap-1"
          style={{ 
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${Math.ceil(CHANNELS_PER_PAGE / COLS)}, 1fr)`
          }}
        >
          {Array.from({ length: endChannel - startChannel + 1 }, (_, i) => {
            const ch = startChannel + i;
            return (
              <ChannelCell
                key={ch}
                channel={ch}
                value={universeState[ch - 1] || 0}
                isSelected={selectedChannels.has(ch)}
                isLocked={lockedChannels.has(ch)}
                onSelect={toggleChannel}
              />
            );
          })}
        </div>
      </div>

      {/* Value Strip */}
      <div className="p-3 border-t border-white/10 bg-black/20">
        <ValueStrip
          value={adjustValue}
          onChange={handleValueChange}
          onChangeEnd={handleValueChangeEnd}
          selectedCount={selectedChannels.size}
        />
      </div>
    </div>
  );
}

export const FadersHeaderExtension = () => null;
