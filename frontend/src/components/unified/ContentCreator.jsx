import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  X, Save, Play, ChevronLeft, ChevronRight, Plus, Trash2,
  Palette, Zap, Sparkles, Layers, Film, Settings,
  ChevronUp, ChevronDown, Repeat, Music, Activity,
  Eye, RotateCcw, Sliders, Flame, Waves
} from 'lucide-react';
import useToastStore from '../../store/toastStore';
import useDMXStore from '../../store/dmxStore';
import TapTempo from '../shared/TapTempo';

// ============================================================
// Constants & Presets
// ============================================================

const COLOR_PRESETS = [
  { name: 'Red', rgb: [255, 0, 0], hex: '#ff0000' },
  { name: 'Orange', rgb: [255, 128, 0], hex: '#ff8000' },
  { name: 'Yellow', rgb: [255, 255, 0], hex: '#ffff00' },
  { name: 'Green', rgb: [0, 255, 0], hex: '#00ff00' },
  { name: 'Cyan', rgb: [0, 255, 255], hex: '#00ffff' },
  { name: 'Blue', rgb: [0, 0, 255], hex: '#3b82f6' },
  { name: 'Purple', rgb: [128, 0, 255], hex: '#8b5cf6' },
  { name: 'Magenta', rgb: [255, 0, 255], hex: '#ec4899' },
  { name: 'White', rgb: [255, 255, 255], hex: '#ffffff' },
  { name: 'Warm', rgb: [255, 200, 150], hex: '#ffc896' },
];

const CONTENT_MODES = {
  scene: { label: 'Scene', icon: Palette, color: '#22c55e', description: 'Static lighting state' },
  chase: { label: 'Chase', icon: Zap, color: '#f59e0b', description: 'Animated sequence' },
  look: { label: 'Look', icon: Sparkles, color: '#8b5cf6', description: 'Scene + modifiers' },
  sequence: { label: 'Sequence', icon: Layers, color: '#ec4899', description: 'Multi-step animation' },
};

const BPM_PRESETS = [60, 90, 120, 140, 180, 240];

const QUICK_PATTERNS = [
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', colors: ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue'] },
  { id: 'strobe', name: 'Strobe', icon: '⚡', bpm: 240, colors: ['White', 'Off'] },
  { id: 'fire', name: 'Fire', icon: '🔥', colors: ['Red', 'Orange', 'Yellow'] },
  { id: 'ocean', name: 'Ocean', icon: '🌊', colors: ['Blue', 'Cyan', 'Blue'] },
];

// ============================================================
// Vertical Fader Component
// ============================================================

function VerticalFader({ channel, value, label, onChange, onRemove }) {
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
    setIsDragging(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    handleInteraction(clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      handleInteraction(clientY);
    };
    const handleEnd = () => setIsDragging(false);

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
  }, [isDragging, handleInteraction]);

  return (
    <div className="fader-container">
      <div className="fader-label">{label || `Ch ${channel}`}</div>
      <div
        ref={trackRef}
        className={`fader-track ${isDragging ? 'active' : ''} ${value > 0 ? 'has-value' : ''}`}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div className="fader-fill" style={{ height: `${pct}%` }} />
        <div className="fader-handle" style={{ bottom: `calc(${pct}% - 8px)` }}>
          <div className="handle-grip" />
        </div>
      </div>
      <div className="fader-value">{value}</div>
      {onRemove && (
        <button className="fader-remove" onClick={() => onRemove(channel)}>
          <X size={10} />
        </button>
      )}
    </div>
  );
}

// ============================================================
// Step Item Component
// ============================================================

function StepItem({ step, index, totalSteps, onPreview, onEdit, onRemove, onMove }) {
  const getStepColor = () => {
    const ch = step.channels || {};
    const r = ch['1:1'] ?? ch['1'] ?? ch[1] ?? 0;
    const g = ch['1:2'] ?? ch['2'] ?? ch[2] ?? 0;
    const b = ch['1:3'] ?? ch['3'] ?? ch[3] ?? 0;
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="step-item" onClick={() => onPreview(step)}>
      <div className="step-number" style={{ background: getStepColor() }}>
        {index + 1}
      </div>
      <span className="step-name">{step.name || 'Step'}</span>
      <div className="step-actions">
        <button onClick={(e) => { e.stopPropagation(); onEdit(index); }}>
          <Sliders size={12} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0}>
          <ChevronUp size={12} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMove(index, 1); }} disabled={index === totalSteps - 1}>
          <ChevronDown size={12} />
        </button>
        <button className="danger" onClick={(e) => { e.stopPropagation(); onRemove(index); }}>
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// AI Assistant Panel (contextual suggestions)
// ============================================================

function AIAssistantPanel({ mode, channels, steps, onSuggest }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Generate contextual suggestions based on current state
    const newSuggestions = [];
    const hour = new Date().getHours();

    if (mode === 'scene') {
      if (Object.keys(channels).length < 3) {
        newSuggestions.push({ action: 'addRGB', label: 'Add RGB (Ch 1-3)' });
      }
      if (hour >= 18 || hour < 6) {
        newSuggestions.push({ action: 'warmPreset', label: 'Evening Warm' });
      } else {
        newSuggestions.push({ action: 'brightPreset', label: 'Daylight' });
      }
    }

    if (mode === 'chase' || mode === 'sequence') {
      if (steps.length === 0) {
        newSuggestions.push({ action: 'rainbowChase', label: 'Rainbow Pattern' });
        newSuggestions.push({ action: 'pulseChase', label: 'Pulse Pattern' });
      }
      if (steps.length > 2) {
        newSuggestions.push({ action: 'reverseSteps', label: 'Reverse Steps' });
      }
    }

    setSuggestions(newSuggestions.slice(0, 3));
  }, [mode, channels, steps]);

  if (suggestions.length === 0) return null;

  return (
    <div className="ai-panel">
      <div className="ai-header">
        <Sparkles size={12} />
        <span>Suggestions</span>
      </div>
      <div className="ai-suggestions">
        {suggestions.map((s, i) => (
          <button key={i} className="ai-suggestion" onClick={() => onSuggest(s.action)}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Content Creator
// ============================================================

function ContentCreatorContent({ mode, item, onSave, onClose, onModeChange }) {
  const toast = useToastStore();
  const { setChannels: sendDMX } = useDMXStore();

  // Core state
  const [name, setName] = useState(item?.name || '');
  const [channels, setChannels] = useState(item?.channels || {});
  const [steps, setSteps] = useState(item?.steps || []);
  const [bpm, setBpm] = useState(item?.bpm || 120);
  const [fadePercent, setFadePercent] = useState(item?.fade_percent || 30);
  const [loop, setLoop] = useState(item?.loop !== false);
  const [modifiers, setModifiers] = useState(item?.modifiers || []);

  // UI state
  const [activeTab, setActiveTab] = useState(mode === 'chase' || mode === 'sequence' ? 'steps' : 'channels');
  const [showColorPresets, setShowColorPresets] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingStepIndex, setEditingStepIndex] = useState(null);

  const FADERS_PER_PAGE = 6;
  const channelNumbers = Object.keys(channels).map(Number).sort((a, b) => a - b);
  const totalPages = Math.max(1, Math.ceil(channelNumbers.length / FADERS_PER_PAGE));
  const pageChannels = channelNumbers.slice(currentPage * FADERS_PER_PAGE, (currentPage + 1) * FADERS_PER_PAGE);

  // Apply preset to initialize from AI suggestion
  useEffect(() => {
    if (item?._preset) {
      handleAISuggestion(item._preset + 'Preset');
    }
  }, [item?._preset]);

  // Channel management
  const updateChannel = (ch, value) => {
    setChannels({ ...channels, [ch]: value });
  };

  const addChannels = (start, count) => {
    const newChannels = { ...channels };
    for (let i = 0; i < count; i++) {
      const ch = start + i;
      if (ch <= 512 && !newChannels[ch]) {
        newChannels[ch] = 0;
      }
    }
    setChannels(newChannels);
  };

  const removeChannel = (ch) => {
    const newChannels = { ...channels };
    delete newChannels[ch];
    setChannels(newChannels);
  };

  // Color preset application
  const applyColorPreset = (preset) => {
    if (mode === 'chase' || mode === 'sequence' || activeTab === 'steps') {
      // Add as step
      const stepDuration = Math.round(60000 / bpm);
      setSteps([...steps, {
        id: Date.now(),
        name: preset.name,
        channels: { '1': preset.rgb[0], '2': preset.rgb[1], '3': preset.rgb[2] },
        fade_ms: Math.round(stepDuration * (fadePercent / 100)),
        hold_ms: Math.round(stepDuration * (1 - fadePercent / 100)),
      }]);
    } else {
      // Set base channels
      const sortedChans = Object.keys(channels).map(Number).sort((a, b) => a - b);
      if (sortedChans.length >= 3) {
        const newChannels = { ...channels };
        newChannels[sortedChans[0]] = preset.rgb[0];
        newChannels[sortedChans[1]] = preset.rgb[1];
        newChannels[sortedChans[2]] = preset.rgb[2];
        setChannels(newChannels);
      } else {
        setChannels({ 1: preset.rgb[0], 2: preset.rgb[1], 3: preset.rgb[2] });
      }
    }
  };

  // Quick pattern creation
  const applyQuickPattern = (pattern) => {
    const colors = pattern.colors.map(c => COLOR_PRESETS.find(p => p.name === c) || COLOR_PRESETS[0]);
    const stepDuration = Math.round(60000 / (pattern.bpm || bpm));
    const newSteps = colors.map((preset, idx) => ({
      id: Date.now() + idx,
      name: preset.name,
      channels: { '1': preset.rgb[0], '2': preset.rgb[1], '3': preset.rgb[2] },
      fade_ms: Math.round(stepDuration * (fadePercent / 100)),
      hold_ms: Math.round(stepDuration * (1 - fadePercent / 100)),
    }));
    setSteps(newSteps);
    if (pattern.bpm) setBpm(pattern.bpm);
    toast.success(`${pattern.name} pattern applied!`);
  };

  // Step management
  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const previewStep = (step) => {
    const byUniverse = {};
    Object.entries(step.channels || {}).forEach(([key, value]) => {
      const [u, ch] = key.includes(':') ? key.split(':').map(Number) : [1, parseInt(key)];
      if (!byUniverse[u]) byUniverse[u] = {};
      byUniverse[u][ch] = value;
    });
    Object.entries(byUniverse).forEach(([u, chs]) => sendDMX(parseInt(u), chs, 200));
  };

  // AI suggestions
  const handleAISuggestion = (action) => {
    switch (action) {
      case 'addRGB':
        addChannels(1, 3);
        break;
      case 'warmPreset':
        applyColorPreset(COLOR_PRESETS.find(p => p.name === 'Warm') || COLOR_PRESETS[0]);
        break;
      case 'brightPreset':
        applyColorPreset(COLOR_PRESETS.find(p => p.name === 'White') || COLOR_PRESETS[8]);
        break;
      case 'rainbowChase':
        applyQuickPattern(QUICK_PATTERNS.find(p => p.id === 'rainbow'));
        break;
      case 'pulseChase':
        const white = COLOR_PRESETS.find(p => p.name === 'White');
        const off = { name: 'Off', rgb: [0, 0, 0] };
        const stepDuration = Math.round(60000 / bpm);
        setSteps([
          { id: Date.now(), name: 'On', channels: { '1': 255, '2': 255, '3': 255 }, fade_ms: Math.round(stepDuration * 0.5), hold_ms: Math.round(stepDuration * 0.5) },
          { id: Date.now() + 1, name: 'Off', channels: { '1': 0, '2': 0, '3': 0 }, fade_ms: Math.round(stepDuration * 0.5), hold_ms: Math.round(stepDuration * 0.5) },
        ]);
        break;
      case 'reverseSteps':
        setSteps([...steps].reverse());
        toast.success('Steps reversed');
        break;
    }
  };

  // Test/preview
  const handleTest = () => {
    sendDMX(1, channels, 200);
    toast.success('Sent to DMX!');
  };

  // Save
  const handleSave = () => {
    if (!name.trim()) {
      toast.warning('Please enter a name');
      return;
    }

    const isStepBased = mode === 'chase' || mode === 'sequence' || steps.length > 0;

    if (isStepBased && steps.length === 0) {
      toast.warning('Add at least one step');
      return;
    }

    if (!isStepBased && Object.keys(channels).length === 0) {
      toast.warning('Add at least one channel');
      return;
    }

    const stepDur = Math.round(60000 / bpm);
    const fadeDur = Math.round(stepDur * (fadePercent / 100));
    const holdDur = stepDur - fadeDur;

    const data = {
      ...item,
      name: name.trim(),
      channels: isStepBased ? {} : channels,
      steps: isStepBased ? steps.map(s => ({
        ...s,
        fade_ms: fadeDur,
        hold_ms: holdDur,
      })) : [],
      bpm,
      loop,
      fade_percent: fadePercent,
      modifiers,
    };

    // Determine actual type based on content
    let actualType = mode;
    if (mode === 'look' && steps.length > 0) actualType = 'sequence';
    if (mode === 'scene' && steps.length > 0) actualType = 'chase';

    onSave(data, actualType);
  };

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const modeConfig = CONTENT_MODES[mode];

  return (
    <div className="creator-container">
      {/* Header */}
      <div className="creator-header">
        <button className="close-btn" onClick={onClose}>
          <X size={18} />
        </button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${modeConfig.label} name...`}
          className="name-input"
          maxLength={50}
        />
        <button className="test-btn" onClick={handleTest}>
          <Play size={14} /> Test
        </button>
        <button className="save-btn" onClick={handleSave}>
          <Save size={14} /> Save
        </button>
      </div>

      {/* Mode Selector */}
      <div className="mode-selector">
        {Object.entries(CONTENT_MODES).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              className={`mode-btn ${mode === key ? 'active' : ''}`}
              onClick={() => onModeChange(key)}
              style={{ '--mode-color': config.color }}
            >
              <Icon size={14} />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Selector (for modes with multiple views) */}
      {(mode === 'look' || mode === 'sequence' || steps.length > 0 || (mode === 'chase')) && (
        <div className="tab-selector">
          <button
            className={`tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            <Palette size={12} /> Base
          </button>
          <button
            className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
            onClick={() => setActiveTab('steps')}
          >
            <Layers size={12} /> Steps ({steps.length})
          </button>
          {(mode === 'look' || mode === 'sequence') && (
            <button
              className={`tab-btn ${activeTab === 'modifiers' ? 'active' : ''}`}
              onClick={() => setActiveTab('modifiers')}
            >
              <Activity size={12} /> Modifiers
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="creator-content">
        {/* AI Suggestions */}
        <AIAssistantPanel
          mode={mode}
          channels={channels}
          steps={steps}
          onSuggest={handleAISuggestion}
        />

        {/* Channels/Base Tab */}
        {(activeTab === 'channels' || (!steps.length && mode === 'scene')) && (
          <div className="channels-section">
            {/* Color Presets */}
            <div className="preset-row">
              <span className="section-label">Quick Colors</span>
              <div className="color-presets">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    className="color-btn"
                    style={{ background: preset.hex }}
                    onClick={() => applyColorPreset(preset)}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Quick Add */}
            <div className="quick-add-row">
              <button onClick={() => addChannels(1, 3)}>+RGB</button>
              <button onClick={() => addChannels(channelNumbers.length > 0 ? Math.max(...channelNumbers) + 1 : 1, 1)}>+1 Ch</button>
              <button onClick={() => addChannels(1, 4)}>+4 Ch</button>
              <button onClick={() => {
                const newCh = {};
                channelNumbers.forEach(ch => newCh[ch] = 255);
                setChannels(newCh);
              }}>All Full</button>
              <button onClick={() => {
                const newCh = {};
                channelNumbers.forEach(ch => newCh[ch] = 0);
                setChannels(newCh);
              }}>All Off</button>
            </div>

            {/* Faders */}
            {channelNumbers.length === 0 ? (
              <div className="empty-channels">
                <Sliders size={32} />
                <p>No channels yet</p>
                <button onClick={() => addChannels(1, 3)}>Add RGB Channels</button>
              </div>
            ) : (
              <div className="faders-area">
                <div className="faders-grid">
                  {pageChannels.map(ch => (
                    <VerticalFader
                      key={ch}
                      channel={ch}
                      value={channels[ch] || 0}
                      label={`Ch ${ch}`}
                      onChange={updateChannel}
                      onRemove={removeChannel}
                    />
                  ))}
                  <button className="add-fader-btn" onClick={() => addChannels(channelNumbers.length > 0 ? Math.max(...channelNumbers) + 1 : 1, 1)}>
                    <Plus size={20} />
                  </button>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="faders-pagination">
                    <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                      <ChevronLeft size={16} />
                    </button>
                    <span>{currentPage + 1}/{totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Steps Tab */}
        {activeTab === 'steps' && (
          <div className="steps-section">
            {/* BPM & Timing Controls */}
            <div className="timing-controls">
              <div className="timing-row">
                <span className="section-label">Tempo</span>
                <div className="bpm-control">
                  <button onClick={() => setBpm(Math.max(30, bpm - 10))}>-</button>
                  <span className="bpm-value">{bpm}</span>
                  <button onClick={() => setBpm(Math.min(300, bpm + 10))}>+</button>
                  <TapTempo onBpmChange={setBpm} size="small" />
                </div>
              </div>
              <div className="bpm-presets">
                {BPM_PRESETS.map(b => (
                  <button
                    key={b}
                    className={bpm === b ? 'active' : ''}
                    onClick={() => setBpm(b)}
                  >{b}</button>
                ))}
              </div>
              <div className="fade-row">
                <span>Fade {fadePercent}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fadePercent}
                  onChange={(e) => setFadePercent(parseInt(e.target.value))}
                />
              </div>
              <div className="loop-row">
                <button className={`loop-btn ${loop ? 'active' : ''}`} onClick={() => setLoop(!loop)}>
                  <Repeat size={14} /> {loop ? 'Loop' : 'Once'}
                </button>
              </div>
            </div>

            {/* Quick Patterns */}
            <div className="quick-patterns">
              <span className="section-label">Quick Patterns</span>
              <div className="pattern-btns">
                {QUICK_PATTERNS.map(p => (
                  <button key={p.id} onClick={() => applyQuickPattern(p)}>
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Presets for Steps */}
            <div className="step-colors">
              <span className="section-label">Add Step</span>
              <div className="color-presets">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    className="color-btn"
                    style={{ background: preset.hex }}
                    onClick={() => applyColorPreset(preset)}
                    title={`Add ${preset.name} step`}
                  />
                ))}
              </div>
            </div>

            {/* Steps List */}
            <div className="steps-list">
              {steps.length === 0 ? (
                <div className="empty-steps">
                  <Layers size={24} />
                  <p>No steps yet</p>
                  <span>Tap colors above or use a quick pattern</span>
                </div>
              ) : (
                steps.map((step, idx) => (
                  <StepItem
                    key={step.id || idx}
                    step={step}
                    index={idx}
                    totalSteps={steps.length}
                    onPreview={previewStep}
                    onEdit={(i) => { /* TODO: Open fader editor for step */ }}
                    onRemove={removeStep}
                    onMove={moveStep}
                  />
                ))
              )}
            </div>

            {steps.length > 0 && (
              <div className="steps-actions">
                <button onClick={() => setSteps([])}>Clear All</button>
                <button onClick={() => setSteps([...steps].reverse())}>Reverse</button>
              </div>
            )}
          </div>
        )}

        {/* Modifiers Tab */}
        {activeTab === 'modifiers' && (
          <div className="modifiers-section">
            <div className="empty-modifiers">
              <Activity size={32} />
              <p>Modifiers add effects like pulse, strobe, or fade</p>
              <button onClick={() => toast.info('Modifier editor coming soon!')}>
                <Plus size={14} /> Add Modifier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="creator-footer">
        <span className="footer-info">
          {mode === 'scene' ? `${channelNumbers.length} channels` :
           `${steps.length} steps • ${bpm} BPM • ${loop ? 'Loop' : 'Once'}`}
        </span>
      </div>

      <style>{`
        .creator-container {
          position: fixed;
          inset: 0;
          background: #0a0a0f;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Header */
        .creator-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .name-input {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: white;
          font-size: 16px;
          font-weight: 600;
          padding: 8px 4px;
          outline: none;
        }

        .name-input:focus {
          border-bottom-color: var(--accent);
        }

        .test-btn, .save-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .test-btn {
          background: rgba(255,255,255,0.08);
          color: white;
        }

        .save-btn {
          background: var(--accent);
          color: black;
        }

        /* Mode Selector */
        .mode-selector {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .mode-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .mode-btn:hover {
          background: rgba(255,255,255,0.06);
        }

        .mode-btn.active {
          background: rgba(var(--accent-rgb), 0.15);
          border-color: var(--mode-color);
          color: var(--mode-color);
        }

        /* Tab Selector */
        .tab-selector {
          display: flex;
          gap: 4px;
          padding: 6px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          cursor: pointer;
        }

        .tab-btn.active {
          background: rgba(255,255,255,0.08);
          color: white;
        }

        /* Content Area */
        .creator-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        /* AI Panel */
        .ai-panel {
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.15);
          border-radius: 10px;
          padding: 8px 10px;
          margin-bottom: 12px;
        }

        .ai-header {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #a78bfa;
          font-size: 10px;
          margin-bottom: 6px;
        }

        .ai-suggestions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .ai-suggestion {
          padding: 4px 10px;
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 12px;
          color: #c4b5fd;
          font-size: 11px;
          cursor: pointer;
        }

        .ai-suggestion:hover {
          background: rgba(139,92,246,0.25);
        }

        /* Section Label */
        .section-label {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          display: block;
        }

        /* Color Presets */
        .preset-row, .step-colors {
          margin-bottom: 12px;
        }

        .color-presets {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .color-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 2px solid rgba(255,255,255,0.2);
          cursor: pointer;
          transition: all 0.15s;
        }

        .color-btn:hover {
          transform: scale(1.1);
          border-color: rgba(255,255,255,0.5);
        }

        /* Quick Add */
        .quick-add-row {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
        }

        .quick-add-row button {
          flex: 1;
          padding: 8px;
          background: rgba(255,255,255,0.05);
          border: none;
          border-radius: 6px;
          color: rgba(255,255,255,0.6);
          font-size: 11px;
          cursor: pointer;
        }

        .quick-add-row button:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        /* Faders */
        .empty-channels, .empty-steps, .empty-modifiers {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: rgba(255,255,255,0.3);
          text-align: center;
        }

        .empty-channels button, .empty-steps button, .empty-modifiers button {
          margin-top: 12px;
          padding: 10px 16px;
          background: var(--accent);
          border: none;
          border-radius: 8px;
          color: black;
          font-weight: 600;
          cursor: pointer;
        }

        .faders-area {
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          padding: 12px;
        }

        .faders-grid {
          display: flex;
          gap: 10px;
          justify-content: center;
          align-items: flex-end;
        }

        .fader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        .fader-label {
          font-size: 9px;
          color: rgba(255,255,255,0.4);
          text-align: center;
        }

        .fader-track {
          width: 36px;
          height: 100px;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          position: relative;
          cursor: pointer;
          touch-action: none;
        }

        .fader-track.active {
          border-color: var(--accent);
        }

        .fader-track.has-value {
          box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.3);
        }

        .fader-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, var(--accent), rgba(var(--accent-rgb), 0.3));
          border-radius: 0 0 7px 7px;
          transition: height 0.05s;
        }

        .fader-handle {
          position: absolute;
          left: 2px;
          right: 2px;
          height: 12px;
          background: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .handle-grip {
          width: 16px;
          height: 2px;
          background: rgba(0,0,0,0.3);
          border-radius: 1px;
        }

        .fader-value {
          font-size: 10px;
          font-weight: 600;
          color: white;
        }

        .fader-remove {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ef4444;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
        }

        .fader-container:hover .fader-remove {
          opacity: 1;
        }

        .add-fader-btn {
          width: 36px;
          height: 100px;
          background: transparent;
          border: 2px dashed rgba(255,255,255,0.15);
          border-radius: 8px;
          color: rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .add-fader-btn:hover {
          border-color: rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.5);
        }

        .faders-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 10px;
        }

        .faders-pagination button {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255,255,255,0.06);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .faders-pagination button:disabled {
          opacity: 0.3;
        }

        .faders-pagination span {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
        }

        /* Steps Section */
        .timing-controls {
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .timing-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .bpm-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bpm-control button {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255,255,255,0.08);
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .bpm-value {
          font-size: 20px;
          font-weight: 700;
          color: white;
          min-width: 50px;
          text-align: center;
        }

        .bpm-presets {
          display: flex;
          gap: 4px;
          margin-bottom: 10px;
        }

        .bpm-presets button {
          flex: 1;
          padding: 6px;
          background: rgba(255,255,255,0.05);
          border: none;
          border-radius: 6px;
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .bpm-presets button.active {
          background: var(--accent);
          color: black;
        }

        .fade-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .fade-row span {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          min-width: 70px;
        }

        .fade-row input[type="range"] {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.1);
          accent-color: var(--accent);
        }

        .loop-row {
          display: flex;
          justify-content: center;
        }

        .loop-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          cursor: pointer;
        }

        .loop-btn.active {
          background: rgba(var(--accent-rgb), 0.15);
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Quick Patterns */
        .quick-patterns {
          margin-bottom: 12px;
        }

        .pattern-btns {
          display: flex;
          gap: 6px;
        }

        .pattern-btns button {
          flex: 1;
          padding: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: rgba(255,255,255,0.7);
          font-size: 11px;
          cursor: pointer;
        }

        .pattern-btns button:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.15);
        }

        /* Steps List */
        .steps-list {
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
          max-height: 200px;
          overflow-y: auto;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          cursor: pointer;
        }

        .step-item:last-child {
          border-bottom: none;
        }

        .step-item:hover {
          background: rgba(255,255,255,0.03);
        }

        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: black;
          text-shadow: 0 0 2px rgba(255,255,255,0.5);
        }

        .step-name {
          flex: 1;
          font-size: 12px;
          color: white;
        }

        .step-actions {
          display: flex;
          gap: 2px;
        }

        .step-actions button {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .step-actions button:hover {
          color: white;
          background: rgba(255,255,255,0.1);
        }

        .step-actions button.danger:hover {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
        }

        .step-actions button:disabled {
          opacity: 0.2;
        }

        .steps-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .steps-actions button {
          flex: 1;
          padding: 8px;
          background: rgba(255,255,255,0.05);
          border: none;
          border-radius: 6px;
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          cursor: pointer;
        }

        .steps-actions button:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        /* Footer */
        .creator-footer {
          padding: 10px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-info {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Portal Wrapper
// ============================================================

export default function ContentCreator(props) {
  if (!props.mode) return null;

  return ReactDOM.createPortal(
    <ContentCreatorContent {...props} />,
    document.body
  );
}
