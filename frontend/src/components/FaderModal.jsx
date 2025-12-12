import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronLeft, ChevronRight, Sun, Moon, Check, Layers } from 'lucide-react';
import useDMXStore from '../store/dmxStore';

const COLOR_PRESETS = [
  { name: 'Red', rgb: [255, 0, 0], hex: '#ff0000' },
  { name: 'Orange', rgb: [255, 128, 0], hex: '#ff8000' },
  { name: 'Yellow', rgb: [255, 255, 0], hex: '#ffff00' },
  { name: 'Green', rgb: [0, 255, 0], hex: '#00ff00' },
  { name: 'Cyan', rgb: [0, 255, 255], hex: '#00ffff' },
  { name: 'Blue', rgb: [0, 0, 255], hex: '#0000ff' },
  { name: 'Purple', rgb: [128, 0, 255], hex: '#8000ff' },
  { name: 'Magenta', rgb: [255, 0, 255], hex: '#ff00ff' },
  { name: 'White', rgb: [255, 255, 255], hex: '#ffffff' },
  { name: 'Warm', rgb: [255, 180, 100], hex: '#ffb464' },
];

function ChannelCell({ channel, value, isSelected, onSelect, universe }) {
  const pct = Math.round((value / 255) * 100);
  return (
    <button
      onClick={() => onSelect(universe, channel)}
      style={{
        background: value > 0
          ? `linear-gradient(to top, var(--theme-primary) ${pct}%, #1a1a2e ${pct}%)`
          : '#1a1a2e',
        border: isSelected ? '2px solid var(--theme-primary)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
      }}
    >
      <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.9)' }}>{channel}</span>
      {value > 0 && <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.5)' }}>{pct}%</span>}
    </button>
  );
}

function ValueSlider({ value, onChange, onChangeEnd }) {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleInteraction = useCallback((clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    onChange(Math.round((pct / 100) * 255));
  }, [onChange]);

  const handleStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    handleInteraction(e.touches ? e.touches[0].clientX : e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => handleInteraction(e.touches ? e.touches[0].clientX : e.clientX);
    const handleEnd = () => { setIsDragging(false); onChangeEnd?.(); };
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
  }, [isDragging, handleInteraction, onChangeEnd]);

  const pct = Math.round((value / 255) * 100);
  
  return (
    <div
      ref={sliderRef}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      style={{
        height: '44px',
        borderRadius: '12px',
        background: '#0a0a15',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: `${pct}%`,
        background: 'linear-gradient(90deg, rgba(var(--theme-primary-rgb),0.4) 0%, var(--theme-primary) 100%)',
        transition: 'width 0.05s',
      }} />
      <div style={{
        position: 'absolute',
        top: '4px',
        bottom: '4px',
        left: `calc(${pct}% - 3px)`,
        width: '6px',
        background: 'white',
        borderRadius: '3px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        transition: 'left 0.05s',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{pct}%</span>
      </div>
    </div>
  );
}

function FaderModalContent({ onClose, onApply, initialChannels = {}, availableUniverses = [1, 2, 3] }) {
  const { universes: dmxUniverses, setChannels, fetchUniverseState } = useDMXStore();
  
  const [channels, setLocalChannels] = useState({});
  const [selectedChannels, setSelectedChannels] = useState(new Set());
  const [activeUniverses, setActiveUniverses] = useState(new Set([1]));
  const [currentPage, setCurrentPage] = useState(0);
  const [adjustValue, setAdjustValue] = useState(128);
  const [viewUniverse, setViewUniverse] = useState(1);

  const CHANNELS_PER_PAGE = 48; // 8x6 grid
  const COLS = 8;
  const ROWS = 6;
  const totalPages = Math.ceil(512 / CHANNELS_PER_PAGE);
  const startChannel = currentPage * CHANNELS_PER_PAGE + 1;
  const endChannel = Math.min(startChannel + CHANNELS_PER_PAGE - 1, 512);

  useEffect(() => {
    const converted = {};
    const usedUniverses = new Set([1]);
    Object.entries(initialChannels).forEach(([key, value]) => {
      if (key.includes(':')) {
        const [u, ch] = key.split(':').map(Number);
        converted[`${u}:${ch}`] = value;
        usedUniverses.add(u);
      } else {
        converted[`1:${key}`] = value;
      }
    });
    setLocalChannels(converted);
    setActiveUniverses(usedUniverses);
    setSelectedChannels(new Set());
    availableUniverses.forEach(u => fetchUniverseState(u));
  }, [initialChannels, availableUniverses]);

  useEffect(() => {
    if (selectedChannels.size === 1) {
      const key = Array.from(selectedChannels)[0];
      setAdjustValue(channels[key] || 0);
    } else if (selectedChannels.size > 1) {
      let sum = 0;
      selectedChannels.forEach(key => { sum += channels[key] || 0; });
      setAdjustValue(Math.round(sum / selectedChannels.size));
    }
  }, [selectedChannels, channels]);

  const toggleUniverse = (u) => {
    setActiveUniverses(prev => {
      const next = new Set(prev);
      if (next.has(u) && next.size > 1) next.delete(u);
      else next.add(u);
      return next;
    });
    setViewUniverse(u);
  };

  const toggleChannel = (universe, ch) => {
    const key = `${universe}:${ch}`;
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set();
    for (let i = startChannel; i <= endChannel; i++) all.add(`${viewUniverse}:${i}`);
    setSelectedChannels(all);
  };

  const selectNone = () => setSelectedChannels(new Set());

  const handleValueChange = (newValue) => {
    setAdjustValue(newValue);
    if (selectedChannels.size > 0) {
      const updated = { ...channels };
      const byUniverse = {};
      selectedChannels.forEach(key => {
        updated[key] = newValue;
        const [u, ch] = key.split(':').map(Number);
        if (!byUniverse[u]) byUniverse[u] = {};
        byUniverse[u][ch] = newValue;
      });
      setLocalChannels(updated);
      Object.entries(byUniverse).forEach(([u, chs]) => setChannels(parseInt(u), chs, 0));
    }
  };

  const handleValueChangeEnd = () => {
    if (selectedChannels.size > 0) {
      const byUniverse = {};
      selectedChannels.forEach(key => {
        const [u, ch] = key.split(':').map(Number);
        if (!byUniverse[u]) byUniverse[u] = {};
        byUniverse[u][ch] = adjustValue;
      });
      Object.entries(byUniverse).forEach(([u, chs]) => setChannels(parseInt(u), chs, 100));
    }
  };

  const applyColorPreset = (rgb) => {
    const targets = selectedChannels.size > 0 
      ? Array.from(selectedChannels).sort()
      : [`${viewUniverse}:${startChannel}`, `${viewUniverse}:${startChannel + 1}`, `${viewUniverse}:${startChannel + 2}`];
    const updated = { ...channels };
    const byUniverse = {};
    targets.forEach((key, idx) => {
      const val = rgb[idx % 3];
      updated[key] = val;
      const [u, ch] = key.split(':').map(Number);
      if (!byUniverse[u]) byUniverse[u] = {};
      byUniverse[u][ch] = val;
    });
    setLocalChannels(updated);
    Object.entries(byUniverse).forEach(([u, chs]) => setChannels(parseInt(u), chs, 200));
  };

  const quickSet = (value) => {
    if (selectedChannels.size === 0) return;
    const updated = { ...channels };
    const byUniverse = {};
    selectedChannels.forEach(key => {
      updated[key] = value;
      const [u, ch] = key.split(':').map(Number);
      if (!byUniverse[u]) byUniverse[u] = {};
      byUniverse[u][ch] = value;
    });
    setLocalChannels(updated);
    Object.entries(byUniverse).forEach(([u, chs]) => setChannels(parseInt(u), chs, 200));
    setAdjustValue(value);
  };

  const handleApply = () => {
    const formatted = {};
    Object.entries(channels).forEach(([key, value]) => {
      const [u] = key.split(':').map(Number);
      if (activeUniverses.has(u) && value > 0) formatted[key] = value;
    });
    onApply(formatted);
    onClose();
  };

  const universeState = dmxUniverses[viewUniverse] || [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: '#0d0d1a',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: '#151528',
      }}>
        <button onClick={onClose} style={{
          padding: '8px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
        }}>
          <X size={20} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={16} style={{ color: 'var(--theme-primary)' }} />
          {availableUniverses.map(u => (
            <button
              key={u}
              onClick={() => toggleUniverse(u)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                background: activeUniverses.has(u)
                  ? viewUniverse === u ? 'var(--theme-primary)' : 'rgba(var(--theme-primary-rgb),0.3)'
                  : 'rgba(255,255,255,0.1)',
                color: activeUniverses.has(u) && viewUniverse === u ? 'black' : 'white',
              }}
            >
              U{u}
            </button>
          ))}
        </div>
        
        <button onClick={handleApply} style={{
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'var(--theme-primary)',
          border: 'none',
          color: 'black',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Check size={16} /> Apply
        </button>
      </div>

      {/* Controls Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: '#12122a',
        overflowX: 'auto',
      }}>
        <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
          style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', opacity: currentPage === 0 ? 0.3 : 1, cursor: 'pointer' }}>
          <ChevronLeft size={16} />
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => setCurrentPage(i)} style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            background: currentPage === i ? 'var(--theme-primary)' : 'rgba(255,255,255,0.05)',
            color: currentPage === i ? 'black' : 'rgba(255,255,255,0.5)',
          }}>
            {i * CHANNELS_PER_PAGE + 1}
          </button>
        ))}
        
        <button onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}
          style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', opacity: currentPage >= totalPages - 1 ? 0.3 : 1, cursor: 'pointer' }}>
          <ChevronRight size={16} />
        </button>
        
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
        
        <button onClick={selectAll} style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>All</button>
        <button onClick={selectNone} style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>None</button>
        <button onClick={() => quickSet(255)} style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}><Sun size={10} />Full</button>
        <button onClick={() => quickSet(0)} style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}><Moon size={10} />Off</button>
        
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
        
        {COLOR_PRESETS.slice(0, 6).map(preset => (
          <button key={preset.name} onClick={() => applyColorPreset(preset.rgb)} style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: preset.hex,
            cursor: 'pointer',
            flexShrink: 0,
          }} />
        ))}
      </div>

      {/* Channel Grid */}
      <div style={{ flex: 1, padding: '8px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: '4px',
        }}>
          {Array.from({ length: Math.min(CHANNELS_PER_PAGE, endChannel - startChannel + 1) }, (_, i) => {
            const ch = startChannel + i;
            const key = `${viewUniverse}:${ch}`;
            const value = channels[key] ?? universeState[ch - 1] ?? 0;
            return (
              <ChannelCell 
                key={ch} 
                channel={ch} 
                value={value} 
                isSelected={selectedChannels.has(key)} 
                onSelect={toggleChannel}
                universe={viewUniverse}
              />
            );
          })}
        </div>
      </div>

      {/* Value Slider */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: '#0a0a15',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
            {selectedChannels.size > 0 ? `${selectedChannels.size} selected` : 'Tap channels to select'}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0, 25, 50, 75, 100].map(pct => (
              <button key={pct} onClick={() => handleValueChange(Math.round(pct * 2.55))} style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}>{pct}%</button>
            ))}
          </div>
        </div>
        <ValueSlider value={adjustValue} onChange={handleValueChange} onChangeEnd={handleValueChangeEnd} />
      </div>
    </div>
  );
}

// Portal wrapper to render at document root
export default function FaderModal({ isOpen, onClose, onApply, initialChannels = {}, availableUniverses = [1, 2, 3] }) {
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <FaderModalContent 
      onClose={onClose} 
      onApply={onApply} 
      initialChannels={initialChannels} 
      availableUniverses={availableUniverses}
    />,
    document.body
  );
}
