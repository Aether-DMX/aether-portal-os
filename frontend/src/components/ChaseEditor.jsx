import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Play } from 'lucide-react';

export default function ChaseEditor({ chase, onSave, onClose }) {
  const [name, setName] = useState(chase?.name || '');
  const [speed, setSpeed] = useState(chase?.speed || 1);
  const [steps, setSteps] = useState(chase?.chaseSteps || [
    { id: 1, channels: {}, duration: 1, color: '#ff0000' }
  ]);

  const availableScenes = [
    { id: 1, name: 'Warm White', channels: { 1: 255, 2: 200, 3: 150 } },
    { id: 2, name: 'Cool Blue', channels: { 1: 100, 2: 150, 3: 255 } },
    { id: 3, name: 'Red Alert', channels: { 1: 255, 2: 0, 3: 0 } },
  ];

  const addStep = () => {
    setSteps([...steps, {
      id: Date.now(),
      channels: {},
      duration: 1,
      color: '#ffffff'
    }]);
  };

  const removeStep = (id) => {
    if (steps.length > 1) {
      setSteps(steps.filter(s => s.id !== id));
    }
  };

  const moveStep = (index, direction) => {
    const newSteps = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < steps.length) {
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      setSteps(newSteps);
    }
  };

  const updateStep = (id, field, value) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updateStepChannel = (stepId, channel, value) => {
    setSteps(steps.map(s => {
      if (s.id === stepId) {
        return { ...s, channels: { ...s.channels, [channel]: value } };
      }
      return s;
    }));
  };

  const applySceneToStep = (stepId, scene) => {
    setSteps(steps.map(s => {
      if (s.id === stepId) {
        return { ...s, channels: scene.channels, sceneName: scene.name };
      }
      return s;
    }));
  };

  const handleSave = () => {
    onSave({
      id: chase?.id || Date.now(),
      name,
      speed,
      steps: steps.length,
      chaseSteps: steps,
      scenes: steps.map(s => s.sceneName || 'Custom').filter((v, i, a) => a.indexOf(v) === i)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header - Full Width */}
      <div className="flex items-center justify-between px-6 py-3 glass-panel border-b border-white/10">
        <h2 className="text-xl font-bold text-white">
          {chase ? 'Edit Chase' : 'New Chase'}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2 bg-[var(--theme-primary)] text-black rounded-xl font-bold hover:opacity-80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Save Chase
          </button>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl bg-black/60 border-2 border-white/20 hover:border-red-500 text-white hover:text-red-500 transition-all flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content - Full Screen */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Basic Settings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-white/60 block mb-2">Chase Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter chase name..."
              className="w-full bg-black/60 border-2 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--theme-primary)]"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Base Speed (seconds per step)</label>
            <input
              type="number"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
              className="w-full bg-black/60 border-2 border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--theme-primary)]"
            />
          </div>
        </div>

        {/* Steps Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Chase Steps ({steps.length})</h3>
          <button
            onClick={addStep}
            className="px-4 py-2 bg-[var(--theme-primary)]/20 border-2 border-[var(--theme-primary)] rounded-xl text-white hover:bg-[var(--theme-primary)]/30 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add Step
          </button>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-2 gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="glass-panel rounded-xl p-4 border-2 border-white/10">
              <div className="flex items-start gap-3">
                {/* Step Controls */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-[var(--theme-primary)]/20 border-2 border-[var(--theme-primary)] flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <button
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                    className="w-8 h-8 rounded bg-black/60 border border-white/20 hover:border-[var(--theme-primary)] text-white disabled:opacity-30 flex items-center justify-center"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === steps.length - 1}
                    className="w-8 h-8 rounded bg-black/60 border border-white/20 hover:border-[var(--theme-primary)] text-white disabled:opacity-30 flex items-center justify-center"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => removeStep(step.id)}
                    disabled={steps.length === 1}
                    className="w-8 h-8 rounded bg-black/60 border border-red-500/50 hover:border-red-500 text-red-500 disabled:opacity-30 flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Step Content */}
                <div className="flex-1 space-y-3">
                  {/* Scene Selector */}
                  <select
                    onChange={(e) => {
                      const scene = availableScenes.find(s => s.id === parseInt(e.target.value));
                      if (scene) applySceneToStep(step.id, scene);
                    }}
                    className="w-full bg-black/60 border-2 border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--theme-primary)]"
                  >
                    <option value="">Load from Scene...</option>
                    {availableScenes.map(scene => (
                      <option key={scene.id} value={scene.id}>{scene.name}</option>
                    ))}
                  </select>

                  {/* Channel Values */}
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(ch => (
                      <div key={ch}>
                        <label className="text-xs text-white/40 block mb-1">Ch {ch}</label>
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={step.channels[ch] || 0}
                          onChange={(e) => updateStepChannel(step.id, ch, parseInt(e.target.value) || 0)}
                          className="w-full bg-black/60 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-[var(--theme-primary)]"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Duration & Color */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-white/60 block mb-1">Duration (s)</label>
                      <input
                        type="number"
                        value={step.duration}
                        onChange={(e) => updateStep(step.id, 'duration', parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                        className="w-full bg-black/60 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-[var(--theme-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/60 block mb-1">Color</label>
                      <input
                        type="color"
                        value={step.color}
                        onChange={(e) => updateStep(step.id, 'color', e.target.value)}
                        className="w-full h-8 bg-black/60 border border-white/20 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {step.sceneName && (
                    <div className="text-xs text-[var(--theme-primary)]">
                      Loaded: {step.sceneName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
