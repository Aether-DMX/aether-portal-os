import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Square, Trash2, Edit3, X, Save, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Repeat, Music, Zap, MessageSquare, Sliders, Palette } from 'lucide-react';
import usePlaybackStore from '../store/playbackStore';
import useChaseStore from '../store/chaseStore';
import useSceneStore from '../store/sceneStore';
import useDMXStore from '../store/dmxStore';
import FaderModal from '../components/FaderModal';
import ApplyTargetModal from '../components/ApplyTargetModal';

// Color presets for quick step creation
const COLOR_PRESETS = [
  { name: 'Red', channels: { '1:1': 255, '1:2': 0, '1:3': 0 }, color: '#ff0000' },
  { name: 'Orange', channels: { '1:1': 255, '1:2': 128, '1:3': 0 }, color: '#ff8000' },
  { name: 'Yellow', channels: { '1:1': 255, '1:2': 255, '1:3': 0 }, color: '#ffff00' },
  { name: 'Green', channels: { '1:1': 0, '1:2': 255, '1:3': 0 }, color: '#00ff00' },
  { name: 'Cyan', channels: { '1:1': 0, '1:2': 255, '1:3': 255 }, color: '#00ffff' },
  { name: 'Blue', channels: { '1:1': 0, '1:2': 0, '1:3': 255 }, color: '#0000ff' },
  { name: 'Purple', channels: { '1:1': 128, '1:2': 0, '1:3': 255 }, color: '#8000ff' },
  { name: 'Magenta', channels: { '1:1': 255, '1:2': 0, '1:3': 255 }, color: '#ff00ff' },
  { name: 'White', channels: { '1:1': 255, '1:2': 255, '1:3': 255 }, color: '#ffffff' },
  { name: 'Off', channels: { '1:1': 0, '1:2': 0, '1:3': 0 }, color: '#333333' },
];

// Helper to get colors from chase steps
function getChaseColors(chase) {
  const steps = chase.steps || [];
  if (steps.length === 0) return null;

  // Get colors from first few steps
  const colors = steps.slice(0, 4).map(step => {
    // Step might have a color property or channels
    if (step.color) return step.color;
    const ch = step.channels || {};
    const r = ch['1:1'] ?? ch['1'] ?? ch[1] ?? 0;
    const g = ch['1:2'] ?? ch['2'] ?? ch[2] ?? 0;
    const b = ch['1:3'] ?? ch['3'] ?? ch[3] ?? 0;
    if (r + g + b < 30) return null;
    return `rgb(${r}, ${g}, ${b})`;
  }).filter(Boolean);

  if (colors.length === 0) return null;
  if (colors.length === 1) return { gradient: colors[0], primary: colors[0] };

  // Create gradient from step colors
  const gradient = `linear-gradient(90deg, ${colors.join(', ')})`;
  return { gradient, primary: colors[0] };
}

// Chase Card - Tap to Play, Long Press for Menu (matches SceneCard structure)
function ChaseCard({ chase, isActive, onPlay, onStop, onLongPress }) {
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const stepCount = chase.steps?.length || 0;
  const bpm = chase.bpm || 120;
  const chaseColors = getChaseColors(chase);

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => { didLongPress.current = true; onLongPress(chase); }, 500);
  };
  const handleEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(pressTimer.current);
    // Always open play modal on tap (even if active) - user can reapply or change settings
    if (!didLongPress.current) { onPlay(chase); }
  };
  const handleCancel = () => clearTimeout(pressTimer.current);

  return (
    <div
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchMove={handleCancel}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      style={{
        touchAction: 'manipulation',
        '--card-color': chaseColors?.primary || 'var(--theme-primary)',
      }}
      className={`control-card ${isActive ? 'active playing' : ''} ${chaseColors ? 'has-color' : ''}`}
    >
      {/* Multi-color gradient bar for chase steps */}
      {chaseColors && (
        <div
          className="card-color-bar"
          style={{ background: chaseColors.gradient }}
        />
      )}
      <div className="card-icon" style={chaseColors ? {
        background: `linear-gradient(145deg, ${chaseColors.primary}33, ${chaseColors.primary}15)`,
        color: chaseColors.primary
      } : undefined}>
        {isActive ? <Square size={18} /> : <Play size={20} className="ml-0.5" />}
      </div>
      <div className="card-info">
        <div className="card-title">{chase.name}</div>
        <div className="card-meta">
          <span>{stepCount} steps</span>
          <span>•</span>
          <span>{bpm} BPM</span>
          {chase.loop !== false && <Repeat size={10} />}
        </div>
      </div>
    </div>
  );
}


// Context Menu for Long Press
function CardContextMenu({ item, type, onEdit, onDelete, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-72 border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-bold truncate">{item.name}</h3>
          <p className="text-white/50 text-sm">{type}</p>
        </div>
        <div className="p-2">
          <button onClick={() => { onEdit(item); onClose(); }} 
            className="w-full p-3 rounded-xl text-left text-white flex items-center gap-3 hover:bg-white/10">
            <Edit3 size={20} /> Edit {type}
          </button>
          <button onClick={() => { onDelete(item); onClose(); }} 
            className="w-full p-3 rounded-xl text-left text-red-400 flex items-center gap-3 hover:bg-red-500/10">
            <Trash2 size={20} /> Delete {type}
          </button>
        </div>
        <div className="p-2 border-t border-white/10">
          <button onClick={onClose} className="w-full p-3 rounded-xl text-white/50 hover:bg-white/5">Cancel</button>
        </div>
      </div>
    </div>
  );
}
// Tap Tempo Component
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
        for (let i = 1; i < newTaps.length; i++) intervals.push(newTaps[i] - newTaps[i-1]);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        onBpmChange(Math.min(300, Math.max(30, Math.round(60000 / avgInterval))));
      }
    }
    setLastTap(now);
  };

  return (
    <button
      onClick={handleTap}
      style={{
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: 'pointer',
        background: flash ? 'var(--theme-primary)' : 'rgba(255,255,255,0.1)',
        color: flash ? 'black' : 'white',
        transform: flash ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.1s',
      }}
    >
      🎵 TAP
    </button>
  );
}

// Chase Creator Modal Content
function ChaseCreatorContent({ chase, onClose, onSave, scenes }) {
  const { setChannels } = useDMXStore();
  
  const [name, setName] = useState('');
  const [steps, setSteps] = useState([]);
  const [bpm, setBpm] = useState(120);
  const [loop, setLoop] = useState(true);
  const [fadePercent, setFadePercent] = useState(30);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [showFaders, setShowFaders] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [showScenePicker, setShowScenePicker] = useState(false);

  useEffect(() => {
    setName(chase?.name || '');
    setSteps(chase?.steps || []);
    setBpm(chase?.bpm || 120);
    setLoop(chase?.loop !== false);
    if (chase?.fade_percent) setFadePercent(chase.fade_percent);
    else if (chase?.steps?.[0]?.fade_ms && chase?.bpm) {
      const stepDur = 60000 / (chase.bpm || 120);
      const pct = Math.round((chase.steps[0].fade_ms / stepDur) * 100);
      setFadePercent(Math.min(100, Math.max(0, pct)));
    }
    setAiMessage('');
  }, [chase]);

  // Calculate step timing from BPM
  const stepDuration = Math.round(60000 / bpm);

  // AI Command Processing
  const handleAiCommand = () => {
    const p = aiPrompt.toLowerCase().trim();
    
    if (p.includes('fast') || p.includes('faster') || p.includes('speed up')) {
      setBpm(Math.min(300, bpm + 20));
      setAiMessage(`🚀 Tempo: ${Math.min(300, bpm + 20)} BPM`);
    } else if (p.includes('slow') || p.includes('slower') || p.includes('chill')) {
      setBpm(Math.max(30, bpm - 20));
      setAiMessage(`🐢 Tempo: ${Math.max(30, bpm - 20)} BPM`);
    } else if (p.includes('double')) {
      setBpm(Math.min(300, bpm * 2));
      setAiMessage(`⚡ Doubled: ${Math.min(300, bpm * 2)} BPM`);
    } else if (p.includes('half')) {
      setBpm(Math.max(30, Math.round(bpm / 2)));
      setAiMessage(`🔽 Halved: ${Math.max(30, Math.round(bpm / 2))} BPM`);
    } else if (p.includes('loop off') || p.includes('no loop') || p.includes('once')) {
      setLoop(false);
      setAiMessage('➡️ Play once mode');
    } else if (p.includes('loop')) {
      setLoop(true);
      setAiMessage('🔁 Loop enabled');
    } else if (p.includes('reverse')) {
      setSteps([...steps].reverse());
      setAiMessage('🔄 Steps reversed');
    } else if (p.includes('clear') || p.includes('reset')) {
      setSteps([]);
      setAiMessage('🗑️ Steps cleared');
    } else if (p.includes('rainbow') || p.includes('color cycle')) {
      const rainbowSteps = COLOR_PRESETS.slice(0, 6).map((preset, idx) => ({
        id: Date.now() + idx,
        name: preset.name,
        channels: preset.channels,
        fade_ms: Math.round(stepDuration * 0.3),
        hold_ms: Math.round(stepDuration * 0.7),
      }));
      setSteps(rainbowSteps);
      setAiMessage('🌈 Rainbow chase created!');
    } else if (p.includes('strobe') || p.includes('flash')) {
      const strobeSteps = [
        { id: Date.now(), name: 'On', channels: { '1:1': 255, '1:2': 255, '1:3': 255 }, fade_ms: 0, hold_ms: 50 },
        { id: Date.now() + 1, name: 'Off', channels: { '1:1': 0, '1:2': 0, '1:3': 0 }, fade_ms: 0, hold_ms: 50 },
      ];
      setSteps(strobeSteps);
      setBpm(240);
      setAiMessage('⚡ Strobe chase @ 240 BPM');
    } else {
      const bpmMatch = p.match(/(\d+)\s*bpm/);
      if (bpmMatch) {
        const newBpm = Math.max(30, Math.min(300, parseInt(bpmMatch[1])));
        setBpm(newBpm);
        setAiMessage(`🎵 Tempo: ${newBpm} BPM`);
      } else {
        setAiMessage("💡 Try: 'faster', '120 bpm', 'rainbow', 'strobe', 'reverse'");
      }
    }
    setAiPrompt('');
  };

  // Add step from color preset
  const addColorStep = (preset) => {
    setSteps([...steps, {
      id: Date.now(),
      name: preset.name,
      channels: { ...preset.channels },
      fade_ms: Math.round(stepDuration * 0.3),
      hold_ms: Math.round(stepDuration * 0.7),
    }]);
  };

  // Add step from scene
  const addSceneStep = (scene) => {
    setSteps([...steps, {
      id: Date.now(),
      name: scene.name,
      scene_id: scene.scene_id || scene.id,
      channels: scene.channels || {},
      fade_ms: Math.round(stepDuration * 0.3),
      hold_ms: Math.round(stepDuration * 0.7),
    }]);
    setShowScenePicker(false);
  };

  // Add custom step from faders
  const handleFaderApply = (channels) => {
    if (editingStepIndex !== null) {
      // Editing existing step
      const newSteps = [...steps];
      newSteps[editingStepIndex] = {
        ...newSteps[editingStepIndex],
        channels,
        name: 'Custom',
      };
      setSteps(newSteps);
      setEditingStepIndex(null);
    } else {
      // Adding new step
      setSteps([...steps, {
        id: Date.now(),
        name: 'Custom',
        channels,
        fade_ms: Math.round(stepDuration * 0.3),
        hold_ms: Math.round(stepDuration * 0.7),
      }]);
    }
  };

  // Step management
  const removeStep = (index) => setSteps(steps.filter((_, i) => i !== index));
  
  const moveStep = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const editStep = (index) => {
    setEditingStepIndex(index);
    setShowFaders(true);
  };

  // Preview step
  const previewStep = (step) => {
    const byUniverse = {};
    Object.entries(step.channels || {}).forEach(([key, value]) => {
      const [u, ch] = key.includes(':') ? key.split(':').map(Number) : [1, parseInt(key)];
      if (!byUniverse[u]) byUniverse[u] = {};
      byUniverse[u][ch] = value;
    });
    Object.entries(byUniverse).forEach(([u, chs]) => setChannels(parseInt(u), chs, 200));
  };

  // Save
  const handleSave = () => {
    if (!name.trim()) { setAiMessage('⚠️ Enter a name'); return; }
    if (steps.length === 0) { setAiMessage('⚠️ Add at least one step'); return; }
    const stepDur = Math.round(60000 / bpm);
    const fadeDur = Math.round(stepDur * (fadePercent / 100));
    const holdDur = stepDur - fadeDur;
    onSave({
      ...chase,
      name: name.trim(),
      steps: steps.map(s => ({
        scene_id: s.scene_id,
        name: s.name,
        channels: s.channels,
        fade_ms: fadeDur,
        hold_ms: holdDur,
      })),
      bpm,
      loop,
      fade_percent: fadePercent,
    });
  };


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
      zIndex: 9998,
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
          display: 'flex',
          alignItems: 'center',
        }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
          {chase?.chase_id ? 'Edit Chase' : 'New Chase'}
        </span>
        <button onClick={handleSave} style={{
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
          <Save size={16} /> Save
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        
        {/* Name Input */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px',
        }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chase name..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              outline: 'none',
            }}
          />
        </div>

        {/* AI Command + BPM Row */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
        }}>
          {/* AI Input */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <MessageSquare size={16} style={{ color: 'var(--theme-primary)' }} />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
              placeholder="'faster' 'rainbow' '120 bpm'..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
          
          {/* BPM Control */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
          }}>
            <button onClick={() => setBpm(Math.max(30, bpm - 10))} style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
              fontWeight: 'bold', cursor: 'pointer',
            }}>-</button>
            <div style={{ textAlign: 'center', width: '50px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', lineHeight: 1 }}>{bpm}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>BPM</div>
            </div>
            <button onClick={() => setBpm(Math.min(300, bpm + 10))} style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
              fontWeight: 'bold', cursor: 'pointer',
            }}>+</button>
          </div>
          
          <TapTempo onBpmChange={setBpm} />
        </div>

        {aiMessage && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(var(--theme-primary-rgb),0.1)',
            borderRadius: '8px',
            color: 'var(--theme-primary)',
            fontSize: '13px',
            marginBottom: '12px',
          }}>{aiMessage}</div>
        )}

        {/* BPM Presets + Loop Toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          alignItems: 'center',
        }}>
          {[60, 90, 120, 140, 180, 240].map(b => (
            <button key={b} onClick={() => setBpm(b)} style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              background: bpm === b ? 'var(--theme-primary)' : 'rgba(255,255,255,0.05)',
              color: bpm === b ? 'black' : 'rgba(255,255,255,0.5)',
            }}>{b}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => setLoop(!loop)} style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: loop ? 'rgba(var(--theme-primary-rgb),0.2)' : 'rgba(255,255,255,0.05)',
            color: loop ? 'var(--theme-primary)' : 'rgba(255,255,255,0.5)',
          }}>
            <Repeat size={14} /> {loop ? 'Loop' : 'Once'}
          </button>
        </div>

        {/* Fade Rate Control */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginBottom: "12px",
          alignItems: "center",
          padding: "8px 12px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "12px",
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: "bold", minWidth: "50px" }}>FADE</span>
          <input
            type="range"
            min="0"
            max="100"
            value={fadePercent}
            onChange={(e) => setFadePercent(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: "var(--theme-primary)" }}
          />
          <span style={{ color: "white", fontSize: "14px", fontWeight: "bold", minWidth: "45px", textAlign: "right" }}>{fadePercent}%</span>
          <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
            {[{ v: 0, l: "Snap" }, { v: 30, l: "Smooth" }, { v: 50, l: "Half" }, { v: 100, l: "Full" }].map(p => (
              <button key={p.v} onClick={() => setFadePercent(p.v)} style={{
                padding: "6px 10px", borderRadius: "6px", border: "none", fontSize: "10px", fontWeight: "bold",
                cursor: "pointer",
                background: fadePercent === p.v ? "var(--theme-primary)" : "rgba(255,255,255,0.1)",
                color: fadePercent === p.v ? "black" : "rgba(255,255,255,0.6)",
              }}>{p.l}</button>
            ))}
          </div>
        </div>


        {/* Steps Section */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase' }}>
              Steps ({steps.length})
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setShowScenePicker(true)} style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <Plus size={12} /> Scene
              </button>
              <button onClick={() => { setEditingStepIndex(null); setShowFaders(true); }} style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: 'rgba(var(--theme-primary-rgb),0.2)',
                color: 'var(--theme-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <Sliders size={12} /> Custom
              </button>
            </div>
          </div>

          {steps.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '24px',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '13px',
            }}>
              Add steps using colors below, scenes, or custom faders
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
              {steps.map((step, idx) => (
                <div key={step.id || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                }}>
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: 'rgba(var(--theme-primary-rgb),0.2)',
                    color: 'var(--theme-primary)',
                    fontSize: '11px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{idx + 1}</span>
                  <span 
                    onClick={() => previewStep(step)}
                    style={{ flex: 1, color: 'white', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {step.name || 'Step'}
                  </span>
                  <button onClick={() => editStep(idx)} style={{
                    padding: '4px', background: 'rgba(255,255,255,0.1)', border: 'none',
                    borderRadius: '4px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  }}><Edit3 size={12} /></button>
                  <button onClick={() => moveStep(idx, -1)} disabled={idx === 0} style={{
                    padding: '4px', background: 'transparent', border: 'none',
                    color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  }}><ChevronUp size={14} /></button>
                  <button onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1} style={{
                    padding: '4px', background: 'transparent', border: 'none',
                    color: idx === steps.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  }}><ChevronDown size={14} /></button>
                  <button onClick={() => removeStep(idx)} style={{
                    padding: '4px', background: 'transparent', border: 'none',
                    color: 'rgba(255,100,100,0.6)', cursor: 'pointer',
                  }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Color Steps */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '12px',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Quick Add Colors
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {COLOR_PRESETS.map(preset => (
              <button key={preset.name} onClick={() => addColorStep(preset)} style={{
                padding: '12px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: preset.color,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: preset.name === 'Off' || preset.name === 'Blue' || preset.name === 'Purple' ? 'white' : 'black',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scene Picker Modal */}
      {showScenePicker && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }} onClick={() => setShowScenePicker(false)}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '16px',
            padding: '16px',
            maxWidth: '400px',
            width: '100%',
            maxHeight: '60vh',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>Add Scene as Step</span>
              <button onClick={() => setShowScenePicker(false)} style={{
                padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)',
                border: 'none', color: 'white', cursor: 'pointer',
              }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {scenes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)' }}>
                  No scenes created yet
                </div>
              ) : scenes.map(scene => (
                <button key={scene.scene_id || scene.id} onClick={() => addSceneStep(scene)} style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '500',
                }}>
                  {scene.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fader Modal */}
      <FaderModal
        isOpen={showFaders}
        onClose={() => { setShowFaders(false); setEditingStepIndex(null); }}
        onApply={handleFaderApply}
        initialChannels={editingStepIndex !== null ? steps[editingStepIndex]?.channels || {} : {}}
        availableUniverses={[1, 2, 3]}
      />
    </div>
  );
}

// Chase Creator Modal (Portal)
function ChaseCreatorModal({ chase, isOpen, onClose, onSave, scenes }) {
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <ChaseCreatorContent chase={chase} onClose={onClose} onSave={onSave} scenes={scenes} />,
    document.body
  );
}

// Main Chases Component
export default function Chases() {
  const navigate = useNavigate();
  const { chases, fetchChases, isChasePlaying, playChase, stopChase, createChase, updateChase, deleteChase } = useChaseStore();
  const { scenes, fetchScenes } = useSceneStore();
  const [editingChase, setEditingChase] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [playModalChase, setPlayModalChase] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const CHASES_PER_PAGE = 15;
  const totalPages = Math.ceil(chases.length / CHASES_PER_PAGE);
  const paginatedChases = chases.slice(currentPage * CHASES_PER_PAGE, (currentPage + 1) * CHASES_PER_PAGE);

  useEffect(() => { 
    fetchChases(); 
    fetchScenes(); 
  }, [fetchChases, fetchScenes]);

  const handleEdit = (chase) => { setEditingChase(chase); setIsCreating(true); };
  const handleCreate = () => { setEditingChase({ name: '', steps: [], bpm: 120, loop: true }); setIsCreating(true); };

  const handleSave = async (chaseData) => {
    try {
      if (chaseData.chase_id) await updateChase(chaseData.chase_id, chaseData);
      else await createChase(chaseData);
      setIsCreating(false);
      setEditingChase(null);
      fetchChases();
    } catch (err) { console.error('Failed to save chase:', err); }
  };

  const handlePlayWithOptions = async (chase, options) => {
    const chaseId = chase.chase_id || chase.id;
    setPlayModalChase(null);

    // Send single API call with universes array (backend handles all universes at once)
    await playChase(chaseId, {
      universes: options.universes,  // Send array of universes
      fade_ms: options.fadeMs
    });
  };

  const handleDelete = async (chase) => {
    if (confirm(`Delete "${chase.name}"?`)) {
      await deleteChase(chase.chase_id || chase.id);
      fetchChases();
    }
  };


  return (
    <div className="fullscreen-view">
      {/* Header */}
      <div className="view-header">
        <div className="flex items-center gap-2">
          <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-lg font-bold text-white">Chases</h1>
          <p className="text-[10px] text-white/50">{chases.length} saved</p>
          </div>
        </div>
        <button
          onTouchEnd={(e) => { e.preventDefault(); handleCreate(); }}
          onClick={handleCreate}
          className="px-3 py-2 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-1 text-sm"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Chase Grid */}
      <div className="view-content">
        {chases.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Zap size={32} className="text-white/30" />
            </div>
            <p className="text-white/50 text-sm mb-1">No chases yet</p>
            <p className="text-white/30 text-xs mb-4">Create animated lighting sequences</p>
            <button
              onTouchEnd={(e) => { e.preventDefault(); handleCreate(); }}
              onClick={handleCreate}
              className="px-5 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-2 text-sm"
            >
              <Plus size={18} /> Create Chase
            </button>
          </div>
        ) : (
          <>
            <div className="control-grid">
              {paginatedChases.map(chase => (
                <ChaseCard
                  key={chase.chase_id || chase.id}
                  chase={chase}
                  isActive={isChasePlaying(chase.chase_id || chase.id)}
                  onPlay={(c) => setPlayModalChase(c)}
                  onStop={stopChase}
                  onLongPress={(c) => setContextMenu(c)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="w-11 h-11 rounded-xl bg-white/10 text-white disabled:opacity-30 flex items-center justify-center"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        currentPage === i
                          ? 'bg-[var(--theme-primary)] text-black scale-105'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="w-11 h-11 rounded-xl bg-white/10 text-white disabled:opacity-30 flex items-center justify-center"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chase Creator Modal */}
      <ChaseCreatorModal
        chase={editingChase}
        isOpen={isCreating}
        onClose={() => { setIsCreating(false); setEditingChase(null); }}
        onSave={handleSave}
        scenes={scenes}
      />

      {/* Play Chase Modal - Uses unified ApplyTargetModal */}
      {playModalChase && (
        <ApplyTargetModal
          mode="chase"
          item={playModalChase}
          onConfirm={handlePlayWithOptions}
          onCancel={() => setPlayModalChase(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <CardContextMenu
          item={contextMenu}
          type="Chase"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export const ChasesHeaderExtension = () => null;
