import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  ArrowLeft, Save, X, Plus, Trash2, ChevronUp, ChevronDown,
  Play, Square, Eye, EyeOff, Zap, Activity, Flame, Waves,
  Palette, Sparkles, Music, Repeat, Sliders, ChevronLeft,
  ChevronRight, Copy, RotateCcw, AlertTriangle, Radio
} from 'lucide-react';
import useLookStore from '../../store/lookStore';
import useDMXStore from '../../store/dmxStore';
import FaderModal from '../FaderModal';

// ============================================================
// Color Presets (shared with chase creator)
// ============================================================
const COLOR_PRESETS = [
  { name: 'Red', channels: { '1': 255, '2': 0, '3': 0 }, color: '#ff0000' },
  { name: 'Orange', channels: { '1': 255, '2': 128, '3': 0 }, color: '#ff8000' },
  { name: 'Yellow', channels: { '1': 255, '2': 255, '3': 0 }, color: '#ffff00' },
  { name: 'Green', channels: { '1': 0, '2': 255, '3': 0 }, color: '#00ff00' },
  { name: 'Cyan', channels: { '1': 0, '2': 255, '3': 255 }, color: '#00ffff' },
  { name: 'Blue', channels: { '1': 0, '2': 0, '3': 255 }, color: '#0000ff' },
  { name: 'Purple', channels: { '1': 128, '2': 0, '3': 255 }, color: '#8000ff' },
  { name: 'Magenta', channels: { '1': 255, '2': 0, '3': 255 }, color: '#ff00ff' },
  { name: 'White', channels: { '1': 255, '2': 255, '3': 255 }, color: '#ffffff' },
  { name: 'Off', channels: { '1': 0, '2': 0, '3': 0 }, color: '#333333' },
];

// Modifier type icons
const MODIFIER_ICONS = {
  pulse: Activity,
  strobe: Zap,
  flicker: Flame,
  wave: Waves,
  rainbow: Palette,
  twinkle: Sparkles,
};

// ============================================================
// Tap Tempo Component
// ============================================================
function TapTempo({ onBpmChange }) {
  const [taps, setTaps] = useState([]);
  const [lastTap, setLastTap] = useState(0);
  const [flash, setFlash] = useState(false);

  const handleTap = () => {
    const now = Date.now();
    setFlash(true);
    setTimeout(() => setFlash(false), 100);

    if (now - lastTap > 2000) {
      setTaps([now]);
    } else {
      const newTaps = [...taps, now].slice(-4);
      setTaps(newTaps);
      if (newTaps.length >= 2) {
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) intervals.push(newTaps[i] - newTaps[i - 1]);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        onBpmChange(Math.min(300, Math.max(30, Math.round(60000 / avgInterval))));
      }
    }
    setLastTap(now);
  };

  return (
    <button
      onClick={handleTap}
      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
        flash ? 'bg-[var(--theme-primary)] text-black scale-95' : 'bg-white/10 text-white'
      }`}
    >
      TAP
    </button>
  );
}

// ============================================================
// Modifier Card Component
// ============================================================
function ModifierCard({ modifier, schema, onUpdate, onRemove, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = MODIFIER_ICONS[modifier.type] || Activity;

  if (!schema) return null;

  return (
    <div className={`rounded-xl border transition-all ${
      modifier.enabled
        ? 'bg-white/5 border-white/10'
        : 'bg-white/2 border-white/5 opacity-50'
    }`}>
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          modifier.enabled ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)]' : 'bg-white/10 text-white/40'
        }`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium text-sm truncate">{schema.name}</div>
          <div className="text-white/40 text-xs truncate">
            {modifier.preset_id
              ? schema.presets[modifier.preset_id]?.name || modifier.preset_id
              : 'Custom'}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`p-1.5 rounded-lg transition-colors ${
            modifier.enabled ? 'text-[var(--theme-primary)]' : 'text-white/30'
          }`}
        >
          {modifier.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Expanded Params */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
          {/* Presets */}
          {schema.presets && Object.keys(schema.presets).length > 0 && (
            <div>
              <label className="text-white/40 text-xs uppercase mb-1 block">Presets</label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(schema.presets).map(([presetId, preset]) => (
                  <button
                    key={presetId}
                    onClick={() => onUpdate({ ...modifier, preset_id: presetId, params: preset.params })}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      modifier.preset_id === presetId
                        ? 'bg-[var(--theme-primary)] text-black'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Params */}
          {Object.entries(schema.params).map(([paramKey, paramSchema]) => (
            <ParamControl
              key={paramKey}
              name={paramKey}
              schema={paramSchema}
              value={modifier.params[paramKey]}
              onChange={(value) => {
                onUpdate({
                  ...modifier,
                  preset_id: null, // Clear preset when manually adjusting
                  params: { ...modifier.params, [paramKey]: value }
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Param Control Component
// ============================================================
function ParamControl({ name, schema, value, onChange }) {
  const { type, label, min, max, step, unit, options } = schema;

  if (type === 'enum' && options) {
    return (
      <div>
        <label className="text-white/40 text-xs uppercase mb-1 block">{label}</label>
        <div className="flex flex-wrap gap-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                value === opt
                  ? 'bg-[var(--theme-primary)] text-black'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'bool') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[var(--theme-primary)]"
        />
        <span className="text-white/60 text-sm">{label}</span>
      </label>
    );
  }

  // Numeric (float or int)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-white/40 text-xs uppercase">{label}</label>
        <span className="text-white text-xs font-medium">
          {type === 'float' ? value?.toFixed(1) : value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min ?? 0}
        max={max ?? 100}
        step={step ?? 1}
        value={value ?? schema.default}
        onChange={(e) => onChange(type === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: 'var(--theme-primary)' }}
      />
    </div>
  );
}

// ============================================================
// Add Modifier Modal
// ============================================================
function AddModifierModal({ isOpen, onClose, onAdd, schemas }) {
  if (!isOpen || !schemas) return null;

  const categories = schemas.categories || {};

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-bold">Add Modifier</h3>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 text-white">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(categories).map(([category, types]) => (
            <div key={category} className="mb-4">
              <div className="text-white/40 text-xs uppercase mb-2">{category}</div>
              <div className="grid grid-cols-2 gap-2">
                {types.map((type) => {
                  const schema = schemas.schemas[type];
                  const Icon = MODIFIER_ICONS[type] || Activity;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        onAdd(type);
                        onClose();
                      }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--theme-primary)]/20 flex items-center justify-center text-[var(--theme-primary)]">
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{schema?.name || type}</div>
                        <div className="text-white/40 text-xs truncate">{schema?.description?.slice(0, 30)}...</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step Card Component (for Sequence Builder)
// ============================================================
function StepCard({ step, index, isFirst, isLast, onEdit, onRemove, onMove, onPreview }) {
  // Get dominant color from channels for visual preview
  const r = step.channels?.['1'] || step.channels?.['1:1'] || 0;
  const g = step.channels?.['2'] || step.channels?.['1:2'] || 0;
  const b = step.channels?.['3'] || step.channels?.['1:3'] || 0;
  const previewColor = `rgb(${r}, ${g}, ${b})`;

  return (
    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
      <span className="w-6 h-6 rounded bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>
      <div
        className="w-6 h-6 rounded border border-white/20"
        style={{ backgroundColor: previewColor }}
        onClick={() => onPreview(step)}
        title="Preview step"
      />
      <span
        className="flex-1 text-white text-sm cursor-pointer hover:text-[var(--theme-primary)]"
        onClick={() => onPreview(step)}
      >
        {step.name || 'Step ' + (index + 1)}
      </span>
      <button onClick={() => onEdit(index)} className="p-1 text-white/40 hover:text-white">
        <Sliders size={14} />
      </button>
      <button onClick={() => onMove(index, -1)} disabled={isFirst} className="p-1 text-white/40 hover:text-white disabled:opacity-20">
        <ChevronUp size={14} />
      </button>
      <button onClick={() => onMove(index, 1)} disabled={isLast} className="p-1 text-white/40 hover:text-white disabled:opacity-20">
        <ChevronDown size={14} />
      </button>
      <button onClick={() => onRemove(index)} className="p-1 text-red-400/60 hover:text-red-400">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ============================================================
// Main Editor Content
// ============================================================
function LookSequenceEditorContent({ item, mode, onClose, onSave }) {
  const {
    modifierSchemas,
    fetchModifierSchemas,
    startPreview,
    updatePreview,
    stopPreview,
    armPreview,
    disarmPreview,
    previewSession,
    previewArmed,
  } = useLookStore();

  const { setChannels } = useDMXStore();

  // Core state
  const [name, setName] = useState('');
  const [channels, setChannelsState] = useState({});
  const [modifiers, setModifiers] = useState([]);

  // Sequence state
  const [steps, setSteps] = useState([]);
  const [bpm, setBpm] = useState(120);
  const [loopMode, setLoopMode] = useState('loop');
  const [fadePercent, setFadePercent] = useState(30);

  // UI state
  const [activeTab, setActiveTab] = useState('base'); // 'base', 'modifiers', 'sequence'
  const [showFaders, setShowFaders] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [showAddModifier, setShowAddModifier] = useState(false);
  const [message, setMessage] = useState('');

  // Determine if this is a Look or Sequence based on steps
  const isSequence = steps.length > 0;

  // Load initial data
  useEffect(() => {
    if (!modifierSchemas) {
      fetchModifierSchemas();
    }
  }, [modifierSchemas, fetchModifierSchemas]);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setChannelsState(item.channels || {});
      setModifiers(item.modifiers || []);
      setSteps(item.steps || []);
      setBpm(item.bpm || 120);
      setLoopMode(item.loop_mode || 'loop');
      if (item.fade_percent !== undefined) {
        setFadePercent(item.fade_percent);
      }
    }
  }, [item]);

  // Preview management
  useEffect(() => {
    // Start preview when channels or modifiers change
    if (Object.keys(channels).length > 0 || modifiers.length > 0) {
      const timer = setTimeout(() => {
        if (previewSession) {
          updatePreview(channels, modifiers);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [channels, modifiers, previewSession, updatePreview]);

  // Cleanup preview on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  // ─────────────────────────────────────────────────────────
  // Channel Management
  // ─────────────────────────────────────────────────────────

  const handleFaderApply = (faderChannels) => {
    if (editingStepIndex !== null) {
      // Editing a sequence step
      const newSteps = [...steps];
      newSteps[editingStepIndex] = {
        ...newSteps[editingStepIndex],
        channels: faderChannels,
        name: newSteps[editingStepIndex].name || 'Custom',
      };
      setSteps(newSteps);
      setEditingStepIndex(null);
    } else if (activeTab === 'sequence') {
      // Adding a new step
      const stepDuration = Math.round(60000 / bpm);
      setSteps([...steps, {
        id: Date.now(),
        name: 'Custom',
        channels: faderChannels,
        fade_ms: Math.round(stepDuration * (fadePercent / 100)),
        hold_ms: Math.round(stepDuration * (1 - fadePercent / 100)),
      }]);
    } else {
      // Setting base channels
      setChannelsState(faderChannels);
    }
    setShowFaders(false);
  };

  const applyColorPreset = (preset) => {
    if (activeTab === 'sequence') {
      // Add as step
      const stepDuration = Math.round(60000 / bpm);
      setSteps([...steps, {
        id: Date.now(),
        name: preset.name,
        channels: { ...preset.channels },
        fade_ms: Math.round(stepDuration * (fadePercent / 100)),
        hold_ms: Math.round(stepDuration * (1 - fadePercent / 100)),
      }]);
    } else {
      // Set base channels
      setChannelsState(preset.channels);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Modifier Management
  // ─────────────────────────────────────────────────────────

  const addModifier = (type) => {
    const schema = modifierSchemas?.schemas?.[type];
    if (!schema) return;

    // Create modifier with defaults
    const defaultParams = {};
    Object.entries(schema.params).forEach(([key, paramSchema]) => {
      defaultParams[key] = paramSchema.default;
    });

    const newModifier = {
      id: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      enabled: true,
      params: defaultParams,
      preset_id: null,
    };

    setModifiers([...modifiers, newModifier]);
  };

  const updateModifier = (index, updated) => {
    const newModifiers = [...modifiers];
    newModifiers[index] = updated;
    setModifiers(newModifiers);
  };

  const removeModifier = (index) => {
    setModifiers(modifiers.filter((_, i) => i !== index));
  };

  const toggleModifier = (index) => {
    const newModifiers = [...modifiers];
    newModifiers[index] = { ...newModifiers[index], enabled: !newModifiers[index].enabled };
    setModifiers(newModifiers);
  };

  // ─────────────────────────────────────────────────────────
  // Step Management
  // ─────────────────────────────────────────────────────────

  const moveStep = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const previewStep = (step) => {
    // Send step channels to DMX for preview
    const byUniverse = {};
    Object.entries(step.channels || {}).forEach(([key, value]) => {
      const [u, ch] = key.includes(':') ? key.split(':').map(Number) : [1, parseInt(key)];
      if (!byUniverse[u]) byUniverse[u] = {};
      byUniverse[u][ch] = value;
    });
    Object.entries(byUniverse).forEach(([u, chs]) => setChannels(parseInt(u), chs, 200));
  };

  // ─────────────────────────────────────────────────────────
  // Preview Control
  // ─────────────────────────────────────────────────────────

  const handleStartPreview = async () => {
    try {
      await startPreview(channels, modifiers, [1]);
      setMessage('Preview started (sandbox mode)');
    } catch (e) {
      setMessage('Failed to start preview');
    }
  };

  const handleArmToggle = async () => {
    if (previewArmed) {
      await disarmPreview();
      setMessage('Preview disarmed - sandbox mode');
    } else {
      await armPreview();
      setMessage('Preview ARMED - live output!');
    }
  };

  // ─────────────────────────────────────────────────────────
  // Save
  // ─────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!name.trim()) {
      setMessage('Please enter a name');
      return;
    }

    if (isSequence) {
      // Save as Sequence
      if (steps.length === 0) {
        setMessage('Add at least one step');
        return;
      }

      const stepDuration = Math.round(60000 / bpm);
      const fadeDur = Math.round(stepDuration * (fadePercent / 100));
      const holdDur = stepDuration - fadeDur;

      const sequenceData = {
        ...item,
        name: name.trim(),
        bpm,
        loop_mode: loopMode,
        fade_percent: fadePercent,
        steps: steps.map((s) => ({
          name: s.name,
          channels: s.channels,
          modifiers: s.modifiers || modifiers, // Use step modifiers or base modifiers
          fade_ms: fadeDur,
          hold_ms: holdDur,
        })),
      };

      onSave(sequenceData, 'sequence');
    } else {
      // Save as Look
      const lookData = {
        ...item,
        name: name.trim(),
        channels,
        modifiers,
      };

      onSave(lookData, 'look');
    }
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-[#0d0d1a] z-[9998] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[#151528]">
        <button onClick={onClose} className="p-2 rounded-lg bg-white/10 text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <span className="text-white font-bold">
            {item?.look_id || item?.sequence_id ? 'Edit' : 'New'} {isSequence ? 'Sequence' : 'Look'}
          </span>
          <div className="text-white/40 text-xs">
            {isSequence ? `${steps.length} steps` : `${Object.keys(channels).length} channels`}
            {modifiers.length > 0 && ` • ${modifiers.length} modifiers`}
          </div>
        </div>
        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[var(--theme-primary)] text-black font-bold flex items-center gap-1">
          <Save size={16} /> Save
        </button>
      </div>

      {/* Name Input */}
      <div className="p-3 border-b border-white/5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isSequence ? "Sequence name..." : "Look name..."}
          className="w-full bg-white/5 rounded-xl px-4 py-3 text-white text-lg font-medium border border-white/10 focus:border-[var(--theme-primary)] outline-none"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-2 border-b border-white/5">
        <button
          onClick={() => setActiveTab('base')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'base'
              ? 'bg-[var(--theme-primary)] text-black'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Base Channels
        </button>
        <button
          onClick={() => setActiveTab('modifiers')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'modifiers'
              ? 'bg-[var(--theme-primary)] text-black'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Modifiers {modifiers.length > 0 && `(${modifiers.length})`}
        </button>
        <button
          onClick={() => setActiveTab('sequence')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'sequence'
              ? 'bg-[var(--theme-primary)] text-black'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Sequence {steps.length > 0 && `(${steps.length})`}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-3">
        {/* Message */}
        {message && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] text-sm">
            {message}
          </div>
        )}

        {/* Base Channels Tab */}
        {activeTab === 'base' && (
          <div className="space-y-4">
            {/* Channel Summary */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-xs uppercase">Base Channels</span>
                <button
                  onClick={() => { setEditingStepIndex(null); setShowFaders(true); }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] text-sm font-medium flex items-center gap-1"
                >
                  <Sliders size={14} /> Edit Faders
                </button>
              </div>

              {Object.keys(channels).length === 0 ? (
                <div className="text-center py-8 text-white/30">
                  No channels set. Use faders or color presets below.
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(channels).slice(0, 12).map(([ch, val]) => (
                    <div key={ch} className="text-center">
                      <div className="text-white/40 text-xs mb-1">Ch {ch}</div>
                      <div className="h-8 bg-white/10 rounded relative overflow-hidden">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-[var(--theme-primary)]"
                          style={{ height: `${(val / 255) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          {val}
                        </span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(channels).length > 12 && (
                    <div className="col-span-6 text-white/30 text-xs text-center">
                      +{Object.keys(channels).length - 12} more channels
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Color Presets */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <span className="text-white/50 text-xs uppercase block mb-3">Quick Colors</span>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="p-3 rounded-lg border border-white/10 flex flex-col items-center gap-1 hover:border-white/30 transition-colors"
                    style={{ backgroundColor: preset.color + '40' }}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-white/80 text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modifiers Tab */}
        {activeTab === 'modifiers' && (
          <div className="space-y-4">
            {/* Modifier List */}
            <div className="space-y-2">
              {modifiers.length === 0 ? (
                <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
                  <div className="text-white/30 mb-3">No modifiers added</div>
                  <button
                    onClick={() => setShowAddModifier(true)}
                    className="px-4 py-2 rounded-lg bg-[var(--theme-primary)] text-black font-medium flex items-center gap-2 mx-auto"
                  >
                    <Plus size={16} /> Add Modifier
                  </button>
                </div>
              ) : (
                modifiers.map((mod, index) => (
                  <ModifierCard
                    key={mod.id}
                    modifier={mod}
                    schema={modifierSchemas?.schemas?.[mod.type]}
                    onUpdate={(updated) => updateModifier(index, updated)}
                    onRemove={() => removeModifier(index)}
                    onToggle={() => toggleModifier(index)}
                  />
                ))
              )}
            </div>

            {modifiers.length > 0 && (
              <button
                onClick={() => setShowAddModifier(true)}
                className="w-full py-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-white/40 font-medium flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white/60 transition-colors"
              >
                <Plus size={16} /> Add Another Modifier
              </button>
            )}
          </div>
        )}

        {/* Sequence Tab */}
        {activeTab === 'sequence' && (
          <div className="space-y-4">
            {/* BPM Controls */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Music size={16} className="text-[var(--theme-primary)]" />
                <span className="text-white/50 text-xs uppercase flex-1">Timing</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setBpm(Math.max(30, bpm - 10))} className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold">-</button>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-white">{bpm}</div>
                  <div className="text-white/40 text-xs">BPM</div>
                </div>
                <button onClick={() => setBpm(Math.min(300, bpm + 10))} className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold">+</button>
                <TapTempo onBpmChange={setBpm} />
              </div>

              <div className="flex gap-1 mb-3">
                {[60, 90, 120, 140, 180, 240].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBpm(b)}
                    className={`flex-1 py-1.5 rounded text-xs font-bold ${
                      bpm === b ? 'bg-[var(--theme-primary)] text-black' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Fade Rate */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs w-12">Fade</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={fadePercent}
                  onChange={(e) => setFadePercent(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-full appearance-none"
                  style={{ accentColor: 'var(--theme-primary)' }}
                />
                <span className="text-white text-xs font-bold w-10 text-right">{fadePercent}%</span>
              </div>

              {/* Loop Mode */}
              <div className="flex gap-2 mt-3">
                {['loop', 'one_shot', 'bounce'].map((lm) => (
                  <button
                    key={lm}
                    onClick={() => setLoopMode(lm)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                      loopMode === lm
                        ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]/30'
                        : 'bg-white/5 text-white/50 border border-white/10'
                    }`}
                  >
                    {lm === 'loop' && <Repeat size={12} />}
                    {lm === 'bounce' && <RotateCcw size={12} />}
                    {lm.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Steps List */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-xs uppercase">Steps ({steps.length})</span>
                <button
                  onClick={() => { setEditingStepIndex(null); setShowFaders(true); }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={14} /> Custom Step
                </button>
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-6 text-white/30">
                  Add steps using colors below or custom faders
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {steps.map((step, idx) => (
                    <StepCard
                      key={step.id || idx}
                      step={step}
                      index={idx}
                      isFirst={idx === 0}
                      isLast={idx === steps.length - 1}
                      onEdit={(i) => { setEditingStepIndex(i); setShowFaders(true); }}
                      onRemove={(i) => setSteps(steps.filter((_, j) => j !== i))}
                      onMove={moveStep}
                      onPreview={previewStep}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Color Steps */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <span className="text-white/50 text-xs uppercase block mb-3">Quick Add Step</span>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="p-2 rounded-lg border border-white/10 flex flex-col items-center gap-1 hover:border-white/30 transition-colors"
                    style={{ backgroundColor: preset.color + '40' }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-white/80 text-[10px] font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Panel (Fixed Bottom) */}
      <div className="border-t border-white/10 bg-[#151528] p-3">
        <div className="flex items-center gap-2">
          {!previewSession ? (
            <button
              onClick={handleStartPreview}
              disabled={Object.keys(channels).length === 0 && modifiers.length === 0}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <Eye size={18} /> Start Preview (Safe)
            </button>
          ) : (
            <>
              <button
                onClick={stopPreview}
                className="px-4 py-3 rounded-xl bg-white/10 text-white font-medium flex items-center gap-2"
              >
                <Square size={16} /> Stop
              </button>
              <button
                onClick={handleArmToggle}
                className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                  previewArmed
                    ? 'bg-red-500 text-white'
                    : 'bg-white/10 text-white border border-orange-500/30'
                }`}
              >
                {previewArmed ? (
                  <>
                    <Radio size={16} className="animate-pulse" /> ARMED - Live Output
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} /> Arm for Live Output
                  </>
                )}
              </button>
            </>
          )}
        </div>
        {previewSession && (
          <div className={`mt-2 text-center text-xs ${previewArmed ? 'text-red-400' : 'text-green-400'}`}>
            {previewArmed
              ? 'Changes are being sent to live output!'
              : 'Sandbox mode - preview only, no live output'}
          </div>
        )}
      </div>

      {/* Fader Modal */}
      <FaderModal
        isOpen={showFaders}
        onClose={() => { setShowFaders(false); setEditingStepIndex(null); }}
        onApply={handleFaderApply}
        initialChannels={
          editingStepIndex !== null
            ? steps[editingStepIndex]?.channels || {}
            : activeTab === 'base'
            ? channels
            : {}
        }
        availableUniverses={[1, 2, 3]}
      />

      {/* Add Modifier Modal */}
      <AddModifierModal
        isOpen={showAddModifier}
        onClose={() => setShowAddModifier(false)}
        onAdd={addModifier}
        schemas={modifierSchemas}
      />
    </div>
  );
}

// ============================================================
// Modal Wrapper
// ============================================================
export default function LookSequenceEditor({ item, mode, isOpen, onClose, onSave }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <LookSequenceEditorContent
      item={item}
      mode={mode}
      onClose={onClose}
      onSave={onSave}
    />,
    document.body
  );
}
