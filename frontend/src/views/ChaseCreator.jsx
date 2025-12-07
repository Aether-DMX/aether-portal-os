import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, Play, Check } from 'lucide-react';
import useChaseStore from '../store/chaseStore';
import useSceneStore from '../store/sceneStore';

const STEPS = ['Name', 'Steps', 'Timing', 'Review'];

export default function ChaseCreator() {
  const navigate = useNavigate();
  const { createChase } = useChaseStore();
  const { scenes } = useSceneStore();

  const [step, setStep] = useState(0);
  const [chaseName, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([]);
  const [speed, setSpeed] = useState(1000);
  const [fadeTime, setFadeTime] = useState(200);
  const [loop, setLoop] = useState(true);

  const addSceneStep = (sceneId) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
      setSteps([...steps, { type: 'scene', name: scene.name, channels: scene.channels }]);
    }
  };

  const addManualStep = () => {
    setSteps([...steps, { type: 'manual', name: `Step ${steps.length + 1}`, channels: {} }]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index, direction) => {
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + direction];
    newSteps[index + direction] = temp;
    setSteps(newSteps);
  };

  const handleSave = () => {
    if (!chaseName.trim()) {
      alert('Please enter a chase name');
      return;
    }

    if (steps.length < 2) {
      alert('Chase needs at least 2 steps');
      return;
    }

    createChase({
      name: chaseName,
      description,
      steps,
      speed,
      fadeTime,
      loop,
      color: 'blue'
    });

    navigate('/chases');
  };

  const canProceed = () => {
    if (step === 0) return chaseName.trim() !== '';
    if (step === 1) return steps.length >= 2;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-gradient-primary pt-[60px] pb-2 px-3">
      <div className="h-[calc(100vh-66px)] flex flex-col">
        {/* Compact Progress */}
        <div className="flex items-center justify-center gap-1 py-3">
          {STEPS.map((s, idx) => (
            <div key={idx} className="flex items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: idx === step ? 'var(--theme-primary)' : idx < step ? 'rgba(var(--theme-primary-rgb), 0.5)' : 'rgba(255,255,255,0.1)',
                  color: 'white'
                }}
              >
                {idx < step ? <Check size={14} /> : idx + 1}
              </div>
              {idx < STEPS.length - 1 && (
                <div className="w-8 h-0.5 mx-0.5" style={{ backgroundColor: idx < step ? 'rgba(var(--theme-primary-rgb), 0.5)' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-2">
          {/* STEP 1: Name */}
          {step === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md space-y-3">
                <h2 className="text-xl font-bold text-white text-center mb-4">Name Your Chase</h2>
                
                <div>
                  <label className="text-xs font-bold text-white/80 mb-1 block">Chase Name *</label>
                  <input
                    type="text"
                    value={chaseName}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Rainbow Fade"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-white/40 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white/80 mb-1 block">Description (optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Smooth color transitions"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:border-white/40 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/10 border border-white/20">
                  <input
                    type="checkbox"
                    id="loop"
                    checked={loop}
                    onChange={(e) => setLoop(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="loop" className="text-white text-sm font-semibold cursor-pointer">
                    Loop continuously
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Add Steps */}
          {step === 1 && (
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-bold text-white text-center mb-3">Build Steps</h2>

              <div className="flex-1 overflow-y-auto mb-2">
                {steps.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Play size={40} className="text-white/30 mx-auto mb-2" />
                      <p className="text-white/60 text-sm">No steps yet. Add below.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="glass-panel rounded-lg border p-2 flex items-center gap-2"
                        style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                      >
                        <div className="flex-1">
                          <p className="text-white font-bold text-sm">Step {idx + 1}: {st.name}</p>
                          <p className="text-xs text-white/60">
                            {Object.keys(st.channels).length} channels
                          </p>
                        </div>

                        <div className="flex gap-1">
                          {idx > 0 && (
                            <button
                              onClick={() => moveStep(idx, -1)}
                              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs"
                            >
                              ↑
                            </button>
                          )}
                          {idx < steps.length - 1 && (
                            <button
                              onClick={() => moveStep(idx, 1)}
                              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs"
                            >
                              ↓
                            </button>
                          )}
                          <button
                            onClick={() => removeStep(idx)}
                            className="p-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Step Buttons */}
              <div className="space-y-2">
                <button
                  onClick={addManualStep}
                  className="w-full py-2 rounded-lg border border-white/20 bg-white/5 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  <Plus size={16} />
                  Add Blank Step
                </button>

                {scenes.length > 0 && (
                  <details className="glass-panel rounded-lg border p-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                    <summary className="text-white text-sm font-bold cursor-pointer">
                      Add From Scenes ({scenes.length})
                    </summary>
                    <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                      {scenes.map(scene => (
                        <button
                          key={scene.id}
                          onClick={() => addSceneStep(scene.id)}
                          className="w-full text-left px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white text-xs"
                        >
                          {scene.name}
                        </button>
                      ))}
                    </div>
                  </details>
                )}

                {steps.length > 0 && steps.length < 2 && (
                  <p className="text-center text-yellow-400 text-xs">
                    ⚠️ Add at least 2 steps
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Timing */}
          {step === 2 && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-white text-center mb-3">Set Timing</h2>

                <div>
                  <div className="flex justify-between text-xs font-bold text-white/80 mb-1">
                    <span>Step Duration</span>
                    <span>{(speed / 1000).toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full h-2 rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--theme-primary) 0%, var(--theme-primary) ${(speed/5000)*100}%, rgba(255,255,255,0.2) ${(speed/5000)*100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>Fast (0.1s)</span>
                    <span>Slow (5s)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-white/80 mb-1">
                    <span>Fade Time</span>
                    <span>{fadeTime}ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={fadeTime}
                    onChange={(e) => setFadeTime(Number(e.target.value))}
                    className="w-full h-2 rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--theme-primary) 0%, var(--theme-primary) ${(fadeTime/2000)*100}%, rgba(255,255,255,0.2) ${(fadeTime/2000)*100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>Snap (0ms)</span>
                    <span>Smooth (2s)</span>
                  </div>
                </div>

                <div className="glass-panel rounded-lg border p-3" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <p className="text-sm text-white/80 mb-1">
                    Total Duration: <strong>{((speed * steps.length) / 1000).toFixed(1)}s</strong>
                  </p>
                  <p className="text-xs text-white/60">
                    {steps.length} steps × {(speed / 1000).toFixed(1)}s each
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === 3 && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md">
                <h2 className="text-xl font-bold text-white text-center mb-4">Review</h2>

                <div className="glass-panel rounded-lg border p-4 space-y-3"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Name</p>
                    <p className="text-base font-bold text-white">{chaseName}</p>
                  </div>

                  {description && (
                    <div>
                      <p className="text-xs text-white/60 mb-0.5">Description</p>
                      <p className="text-sm text-white">{description}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Steps</p>
                    <p className="text-sm text-white">{steps.length} steps</p>
                  </div>

                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Timing</p>
                    <p className="text-sm text-white">
                      {(speed / 1000).toFixed(1)}s per step, {fadeTime}ms fade
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Playback</p>
                    <p className="text-sm text-white">{loop ? 'Loop continuously' : 'Play once'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Navigation */}
        <div className="flex gap-2 mt-3 px-2">
          <button
            onClick={() => step === 0 ? navigate('/dmx-effects') : setStep(step - 1)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 px-4 py-2.5 rounded-lg border text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: canProceed() ? 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))' : 'rgba(255,255,255,0.1)',
                borderColor: canProceed() ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)'
              }}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 rounded-lg border text-white text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))',
                borderColor: 'var(--theme-primary)'
              }}
            >
              <Save size={16} />
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const ChaseCreatorHeaderExtension = () => null;
