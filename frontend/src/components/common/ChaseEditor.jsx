import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, Play, ChevronLeft, ChevronRight, Plus, Trash2, Repeat, ChevronUp, ChevronDown, Palette } from 'lucide-react';
import useToastStore from '../../store/toastStore';
import useDMXStore from '../../store/dmxStore';
import TapTempo from '../shared/TapTempo';

// Color presets for quick step creation (compact for 800x480)
const COLOR_PRESETS = [
  { name: 'R', rgb: [255, 0, 0], color: '#ff0000' },
  { name: 'O', rgb: [255, 128, 0], color: '#ff8000' },
  { name: 'Y', rgb: [255, 255, 0], color: '#ffff00' },
  { name: 'G', rgb: [0, 255, 0], color: '#00ff00' },
  { name: 'C', rgb: [0, 255, 255], color: '#00ffff' },
  { name: 'B', rgb: [0, 0, 255], color: '#3b82f6' },
  { name: 'P', rgb: [128, 0, 255], color: '#8b5cf6' },
  { name: 'M', rgb: [255, 0, 255], color: '#ec4899' },
  { name: 'W', rgb: [255, 255, 255], color: '#ffffff' },
];

const BPM_PRESETS = [60, 90, 120, 140, 180, 240];

// Step item with color swatch
function StepItem({ step, index, onPreview, onRemove, onMove, totalSteps }) {
  // Get color from channels
  const getStepColor = () => {
    const ch = step.channels || {};
    const r = ch['1:1'] ?? ch[1] ?? 0;
    const g = ch['1:2'] ?? ch[2] ?? 0;
    const b = ch['1:3'] ?? ch[3] ?? 0;
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg"
      onClick={() => onPreview(step)}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: getStepColor(), color: 'black', textShadow: '0 0 2px rgba(255,255,255,0.5)' }}
      >
        {index + 1}
      </div>
      <span className="flex-1 text-white text-xs truncate">{step.name || 'Step'}</span>
      <button onClick={(e) => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0}
        className="p-1 text-white/30 hover:text-white disabled:opacity-30">
        <ChevronUp size={12} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onMove(index, 1); }} disabled={index === totalSteps - 1}
        className="p-1 text-white/30 hover:text-white disabled:opacity-30">
        <ChevronDown size={12} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onRemove(index); }}
        className="p-1 text-red-400/60 hover:text-red-400">
        <X size={12} />
      </button>
    </div>
  );
}

// TapTempo imported from ../shared/TapTempo

export default function ChaseEditor({ chase, scenes = [], onSave, onClose }) {
  const toast = useToastStore();
  const { setChannels } = useDMXStore();

  const [name, setName] = useState(chase?.name || '');
  const [steps, setSteps] = useState(chase?.steps || []);
  const [bpm, setBpm] = useState(chase?.bpm || 120);
  const [loop, setLoop] = useState(chase?.loop !== false);
  const [fadePercent, setFadePercent] = useState(chase?.fade_percent || 30);
  const [showScenes, setShowScenes] = useState(false);
  const [currentStepPage, setCurrentStepPage] = useState(0);

  const STEPS_PER_PAGE = 4;
  const totalStepPages = Math.max(1, Math.ceil(steps.length / STEPS_PER_PAGE));
  const visibleSteps = steps.slice(currentStepPage * STEPS_PER_PAGE, (currentStepPage + 1) * STEPS_PER_PAGE);

  // Calculate step timing from BPM
  const stepDuration = Math.round(60000 / bpm);

  // Add step from color preset
  const addColorStep = (preset) => {
    const channels = {
      '1:1': preset.rgb[0],
      '1:2': preset.rgb[1],
      '1:3': preset.rgb[2],
    };
    setSteps([...steps, {
      id: Date.now(),
      name: preset.name === 'W' ? 'White' : preset.name === 'R' ? 'Red' : preset.name === 'G' ? 'Green' :
            preset.name === 'B' ? 'Blue' : preset.name === 'C' ? 'Cyan' : preset.name === 'M' ? 'Magenta' :
            preset.name === 'Y' ? 'Yellow' : preset.name === 'O' ? 'Orange' : preset.name === 'P' ? 'Purple' : 'Custom',
      channels,
      fade_ms: Math.round(stepDuration * (fadePercent / 100)),
      hold_ms: Math.round(stepDuration * (1 - fadePercent / 100)),
    }]);
    // Navigate to last page
    const newTotal = Math.ceil((steps.length + 1) / STEPS_PER_PAGE);
    setCurrentStepPage(newTotal - 1);
  };

  // Add step from scene
  const addSceneStep = (scene) => {
    setSteps([...steps, {
      id: Date.now(),
      name: scene.name,
      scene_id: scene.scene_id || scene.id,
      channels: scene.channels || {},
      fade_ms: Math.round(stepDuration * (fadePercent / 100)),
      hold_ms: Math.round(stepDuration * (1 - fadePercent / 100)),
    }]);
    setShowScenes(false);
    const newTotal = Math.ceil((steps.length + 1) / STEPS_PER_PAGE);
    setCurrentStepPage(newTotal - 1);
  };

  // Step management
  const removeStep = (index) => {
    const actualIndex = currentStepPage * STEPS_PER_PAGE + index;
    setSteps(steps.filter((_, i) => i !== actualIndex));
  };

  const moveStep = (index, dir) => {
    const actualIndex = currentStepPage * STEPS_PER_PAGE + index;
    const newIndex = actualIndex + dir;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[actualIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[actualIndex]];
    setSteps(newSteps);
  };

  // Preview step on DMX
  const previewStep = (step) => {
    const byUniverse = {};
    Object.entries(step.channels || {}).forEach(([key, value]) => {
      const [u, ch] = key.includes(':') ? key.split(':').map(Number) : [1, parseInt(key)];
      if (!byUniverse[u]) byUniverse[u] = {};
      byUniverse[u][ch] = value;
    });
    Object.entries(byUniverse).forEach(([u, chs]) => setChannels(parseInt(u), chs, 200));
  };

  // Quick patterns
  const createRainbow = () => {
    const rainbowColors = COLOR_PRESETS.slice(0, 6);
    const rainbowSteps = rainbowColors.map((preset, idx) => ({
      id: Date.now() + idx,
      name: preset.name === 'R' ? 'Red' : preset.name === 'G' ? 'Green' : preset.name === 'B' ? 'Blue' :
            preset.name === 'C' ? 'Cyan' : preset.name === 'M' ? 'Magenta' : preset.name === 'Y' ? 'Yellow' : 'Color',
      channels: { '1:1': preset.rgb[0], '1:2': preset.rgb[1], '1:3': preset.rgb[2] },
      fade_ms: Math.round(stepDuration * 0.3),
      hold_ms: Math.round(stepDuration * 0.7),
    }));
    setSteps(rainbowSteps);
    toast.success('Rainbow chase created!');
  };

  const createStrobe = () => {
    setSteps([
      { id: Date.now(), name: 'On', channels: { '1:1': 255, '1:2': 255, '1:3': 255 }, fade_ms: 0, hold_ms: 50 },
      { id: Date.now() + 1, name: 'Off', channels: { '1:1': 0, '1:2': 0, '1:3': 0 }, fade_ms: 0, hold_ms: 50 },
    ]);
    setBpm(240);
    toast.success('Strobe chase @ 240 BPM');
  };

  const reverseSteps = () => {
    setSteps([...steps].reverse());
    toast.success('Steps reversed');
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.warning('Chase name is required');
      return;
    }
    if (steps.length === 0) {
      toast.warning('Add at least one step');
      return;
    }

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

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
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
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 shrink-0">
        <button onClick={onClose} className="p-2 rounded-lg bg-white/10">
          <X size={18} className="text-white" />
        </button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-transparent text-lg font-bold text-white outline-none border-b border-transparent focus:border-[var(--accent)]"
          placeholder="Chase Name..."
          maxLength={50}
        />
        <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-bold flex items-center gap-2">
          <Save size={16} /> Save
        </button>
      </div>

      {/* Main content - horizontal layout for 800x480 */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column - Settings */}
        <div className="w-[280px] border-r border-white/10 p-3 flex flex-col gap-3 shrink-0 overflow-y-auto">
          {/* BPM Control */}
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">TEMPO</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setBpm(Math.max(30, bpm - 10))} className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold">-</button>
                <span className="text-2xl font-bold text-white w-14 text-center">{bpm}</span>
                <button onClick={() => setBpm(Math.min(300, bpm + 10))} className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold">+</button>
                <TapTempo onBpmChange={setBpm} />
              </div>
            </div>
            <div className="flex gap-1">
              {BPM_PRESETS.map(b => (
                <button key={b} onClick={() => setBpm(b)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                    bpm === b ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/60'
                  }`}
                >{b}</button>
              ))}
            </div>
          </div>

          {/* Fade Control */}
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">FADE</span>
              <span className="text-sm font-bold text-white">{fadePercent}%</span>
            </div>
            <input type="range" min="0" max="100" value={fadePercent}
              onChange={(e) => setFadePercent(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-white/10 accent-[var(--accent)]"
            />
            <div className="flex gap-1 mt-2">
              {[{ v: 0, l: 'Snap' }, { v: 30, l: 'Smooth' }, { v: 50, l: 'Half' }, { v: 100, l: 'Full' }].map(p => (
                <button key={p.v} onClick={() => setFadePercent(p.v)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${
                    fadePercent === p.v ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/60'
                  }`}
                >{p.l}</button>
              ))}
            </div>
          </div>

          {/* Loop + Quick Patterns */}
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setLoop(!loop)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 ${
                  loop ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-white/10 text-white/50'
                }`}
              >
                <Repeat size={14} /> {loop ? 'Loop On' : 'Loop Off'}
              </button>
            </div>
            <div className="flex gap-1">
              <button onClick={createRainbow} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white text-[10px] font-bold">
                Rainbow
              </button>
              <button onClick={createStrobe} className="flex-1 py-2 rounded-lg bg-white text-black text-[10px] font-bold">
                Strobe
              </button>
              <button onClick={reverseSteps} className="flex-1 py-2 rounded-lg bg-white/10 text-white text-[10px] font-bold">
                Reverse
              </button>
            </div>
          </div>

          {/* Quick Color Add */}
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">ADD STEP</span>
              <button onClick={() => setShowScenes(true)} className="text-xs text-[var(--accent)] font-bold flex items-center gap-1">
                <Plus size={12} /> Scene
              </button>
            </div>
            <div className="grid grid-cols-9 gap-1">
              {COLOR_PRESETS.map(preset => (
                <button key={preset.name} onClick={() => addColorStep(preset)}
                  className="aspect-square rounded-lg border border-white/20 hover:scale-110 transition-transform"
                  style={{ background: preset.color }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Steps */}
        <div className="flex-1 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50">STEPS ({steps.length})</span>
            {steps.length > 0 && (
              <button onClick={() => setSteps([])} className="text-xs text-red-400/60 hover:text-red-400">
                Clear All
              </button>
            )}
          </div>

          {steps.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-2">🎬</div>
              <h3 className="text-sm font-semibold text-white mb-1">No Steps Yet</h3>
              <p className="text-white/40 text-xs mb-3">Add colors or scenes to build your chase</p>
              <div className="flex gap-2">
                <button onClick={createRainbow} className="px-3 py-2 rounded-lg bg-[var(--accent)] text-black font-bold text-xs">
                  Quick Rainbow
                </button>
                <button onClick={() => setShowScenes(true)} className="px-3 py-2 rounded-lg bg-white/10 text-white font-semibold text-xs">
                  Add Scene
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Steps list */}
              <div className="flex-1 flex flex-col gap-2">
                {visibleSteps.map((step, idx) => (
                  <StepItem
                    key={step.id || idx}
                    step={step}
                    index={idx}
                    totalSteps={visibleSteps.length}
                    onPreview={previewStep}
                    onRemove={removeStep}
                    onMove={moveStep}
                  />
                ))}
              </div>

              {/* Step pagination */}
              {totalStepPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-white/10">
                  <button onClick={() => setCurrentStepPage(p => Math.max(0, p - 1))} disabled={currentStepPage === 0}
                    className="p-2 rounded-lg bg-white/10 disabled:opacity-30">
                    <ChevronLeft size={16} className="text-white" />
                  </button>
                  <span className="text-xs text-white/50">
                    {currentStepPage + 1} / {totalStepPages}
                  </span>
                  <button onClick={() => setCurrentStepPage(p => Math.min(totalStepPages - 1, p + 1))} disabled={currentStepPage >= totalStepPages - 1}
                    className="p-2 rounded-lg bg-white/10 disabled:opacity-30">
                    <ChevronRight size={16} className="text-white" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10 shrink-0 flex items-center justify-between text-xs text-white/40">
        <span>{bpm} BPM • {steps.length} steps • {loop ? 'Loop' : 'Once'} • {fadePercent}% fade</span>
        <span>Tap step to preview</span>
      </div>

      {/* Scene picker modal */}
      {showScenes && (
        <div className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4" onClick={() => setShowScenes(false)}>
          <div className="bg-gray-900 rounded-2xl w-80 max-h-[60vh] border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="text-white font-bold">Add Scene as Step</span>
              <button onClick={() => setShowScenes(false)} className="p-1.5 rounded-lg bg-white/10">
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="p-2 max-h-[40vh] overflow-y-auto">
              {scenes.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">No scenes created yet</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {scenes.map(scene => (
                    <button key={scene.scene_id || scene.id} onClick={() => addSceneStep(scene)}
                      className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left text-white text-sm font-medium transition-colors">
                      {scene.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
