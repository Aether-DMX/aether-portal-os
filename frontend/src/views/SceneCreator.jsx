import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, AlertCircle, Check, Lightbulb } from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import useGroupStore from '../store/groupStore';
import useDMXStore from '../store/dmxStore';
import { useFixtureStore } from '../store/fixtureStore';

const STEPS = ['Name', 'Channels', 'Color', 'Review'];

export default function SceneCreator() {
  const navigate = useNavigate();
  const { createScene } = useSceneStore();
  const { groups } = useGroupStore();
  const { currentUniverse } = useDMXStore();
  const { fixtures, fetchFixtures, getFixtureChannelRange } = useFixtureStore();

  const [step, setStep] = useState(0);
  const [sceneName, setSceneName] = useState('');
  const [description, setDescription] = useState('');
  const [fadeTime, setFadeTime] = useState(2000);
  const [selectionMode, setSelectionMode] = useState('fixtures');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [selectedFixtures, setSelectedFixtures] = useState([]);
  const [color, setColor] = useState({ r: 255, g: 255, b: 255 });
  const [intensity, setIntensity] = useState(100);

  useEffect(() => {
    fetchFixtures();
  }, []);

  const toggleGroup = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleFixture = (fixtureId) => {
    setSelectedFixtures(prev =>
      prev.includes(fixtureId)
        ? prev.filter(id => id !== fixtureId)
        : [...prev, fixtureId]
    );
  };

  const toggleChannel = (ch) => {
    setSelectedChannels(prev =>
      prev.includes(ch)
        ? prev.filter(c => c !== ch)
        : [...prev, ch]
    );
  };

  const selectChannelRange = (start, end) => {
    const range = [];
    for (let i = start; i <= end; i++) range.push(i);
    setSelectedChannels(range);
  };

  const getAffectedChannels = () => {
    const channels = new Set();

    if (selectionMode === 'fixtures') {
      selectedFixtures.forEach(fid => {
        const fixture = fixtures.find(f => (f.fixture_id || f.id) === fid);
        if (fixture) {
          const range = getFixtureChannelRange(fixture);
          range.channels.forEach(ch => channels.add(ch));
        }
      });
      return Array.from(channels).sort((a, b) => a - b);
    }

    if (selectionMode === 'groups') {
      selectedGroups.forEach(gid => {
        const group = groups.find(g => g.id === gid);
        if (group) group.channels.forEach(ch => channels.add(ch));
      });
      return Array.from(channels).sort((a, b) => a - b);
    }

    return selectedChannels.sort((a, b) => a - b);
  };

  const handleSave = () => {
    const affected = getAffectedChannels();
    if (affected.length === 0) {
      alert('Please select at least one channel or group');
      return;
    }

    const channels = {};
    const scaledIntensity = Math.round((intensity / 100) * 255);

    affected.forEach(ch => {
      const offset = (ch - 1) % 3;
      if (offset === 0) channels[ch] = Math.round((color.r / 255) * scaledIntensity);
      else if (offset === 1) channels[ch] = Math.round((color.g / 255) * scaledIntensity);
      else channels[ch] = Math.round((color.b / 255) * scaledIntensity);
    });

    createScene({
      name: sceneName,
      description,
      universe: currentUniverse,
      channels,
      fadeTime,
      color: 'blue'
    });

    navigate('/scenes');
  };

  const canProceed = () => {
    if (step === 0) return sceneName.trim() !== '';
    if (step === 1) return getAffectedChannels().length > 0;
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
          {/* STEP 1 */}
          {step === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md space-y-3">
                <h2 className="text-xl font-bold text-white text-center mb-4">Name Your Scene</h2>
                
                <div>
                  <label className="text-xs font-bold text-white/80 mb-1 block">Scene Name *</label>
                  <input
                    type="text"
                    value={sceneName}
                    onChange={(e) => setSceneName(e.target.value)}
                    placeholder="e.g., Warm Welcome"
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
                    placeholder="e.g., Cozy amber lighting"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:border-white/40 outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-white/80 mb-1">
                    <span>Fade Time</span>
                    <span>{(fadeTime / 1000).toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={fadeTime}
                    onChange={(e) => setFadeTime(Number(e.target.value))}
                    className="w-full h-2 rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--theme-primary) 0%, var(--theme-primary) ${(fadeTime/5000)*100}%, rgba(255,255,255,0.2) ${(fadeTime/5000)*100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-bold text-white text-center mb-3">Select Target</h2>

              <div className="flex gap-1 mb-3">
                <button
                  onClick={() => setSelectionMode('fixtures')}
                  className="flex-1 py-2 rounded-lg border font-bold text-xs text-white transition-all"
                  style={{
                    borderColor: selectionMode === 'fixtures' ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)',
                    backgroundColor: selectionMode === 'fixtures' ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'transparent'
                  }}
                >
                  Fixtures
                </button>
                <button
                  onClick={() => setSelectionMode('groups')}
                  className="flex-1 py-2 rounded-lg border font-bold text-xs text-white transition-all"
                  style={{
                    borderColor: selectionMode === 'groups' ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)',
                    backgroundColor: selectionMode === 'groups' ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'transparent'
                  }}
                >
                  Groups
                </button>
                <button
                  onClick={() => setSelectionMode('channels')}
                  className="flex-1 py-2 rounded-lg border font-bold text-xs text-white transition-all"
                  style={{
                    borderColor: selectionMode === 'channels' ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)',
                    backgroundColor: selectionMode === 'channels' ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'transparent'
                  }}
                >
                  Channels
                </button>
              </div>

              {selectionMode === 'fixtures' && (
                <div className="flex-1 overflow-y-auto">
                  {fixtures.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Lightbulb size={40} className="text-yellow-400 mx-auto mb-2" />
                        <p className="text-white font-bold text-sm mb-1">No Fixtures Yet</p>
                        <p className="text-white/60 text-xs mb-3">Add fixtures first to use them in scenes</p>
                        <button
                          onClick={() => navigate('/patch')}
                          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-semibold"
                        >
                          Go to Patch
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-1 mb-2">
                        <button
                          onClick={() => setSelectedFixtures(fixtures.map(f => f.fixture_id || f.id))}
                          className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedFixtures([])}
                          className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {fixtures.filter(f => f.universe === currentUniverse).map(fixture => {
                          const fixtureId = fixture.fixture_id || fixture.id;
                          const isSelected = selectedFixtures.includes(fixtureId);
                          const range = getFixtureChannelRange(fixture);
                          return (
                            <button
                              key={fixtureId}
                              onClick={() => toggleFixture(fixtureId)}
                              className="p-3 rounded-lg border transition-all text-left"
                              style={{
                                borderColor: isSelected ? (fixture.color || 'var(--theme-primary)') : 'rgba(255,255,255,0.2)',
                                backgroundColor: isSelected ? `${fixture.color || 'var(--theme-primary)'}30` : 'rgba(255,255,255,0.05)'
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Lightbulb
                                  size={14}
                                  style={{ color: fixture.color || 'var(--theme-primary)' }}
                                  fill={isSelected ? (fixture.color || 'var(--theme-primary)') : 'transparent'}
                                />
                                <p className="font-bold text-white text-sm truncate">{fixture.name}</p>
                              </div>
                              <p className="text-xs text-white/60">
                                Ch {range.start}-{range.end} ({range.channels.length} ch)
                              </p>
                              {fixture.type && fixture.type !== 'generic' && (
                                <p className="text-[10px] text-white/40 mt-0.5">{fixture.type}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {fixtures.filter(f => f.universe !== currentUniverse).length > 0 && (
                        <p className="text-xs text-white/40 text-center mt-2">
                          {fixtures.filter(f => f.universe !== currentUniverse).length} fixtures in other universes
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectionMode === 'groups' && (
                <div className="flex-1 overflow-y-auto">
                  {groups.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <AlertCircle size={40} className="text-yellow-400 mx-auto mb-2" />
                        <p className="text-white font-bold text-sm mb-1">No Groups Yet</p>
                        <p className="text-white/60 text-xs mb-3">Create groups first</p>
                        <button
                          onClick={() => navigate('/group-fixtures')}
                          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-semibold"
                        >
                          Go to Group Fixtures
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {groups.map(group => (
                        <button
                          key={group.id}
                          onClick={() => toggleGroup(group.id)}
                          className="p-3 rounded-lg border transition-all text-left"
                          style={{
                            borderColor: selectedGroups.includes(group.id) ? group.color : 'rgba(255,255,255,0.2)',
                            backgroundColor: selectedGroups.includes(group.id) ? `${group.color}30` : 'rgba(255,255,255,0.05)'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 rounded border"
                              style={{
                                borderColor: group.color,
                                backgroundColor: selectedGroups.includes(group.id) ? group.color : 'transparent'
                              }}
                            />
                            <p className="font-bold text-white text-sm">{group.name}</p>
                          </div>
                          <p className="text-xs text-white/60">{group.channels.length} ch</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectionMode === 'channels' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex gap-1 mb-2">
                    <button onClick={() => selectChannelRange(1, 10)} className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">1-10</button>
                    <button onClick={() => selectChannelRange(1, 50)} className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">1-50</button>
                    <button onClick={() => selectChannelRange(1, 100)} className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">1-100</button>
                    <button onClick={() => setSelectedChannels([])} className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">Clear</button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({ length: 100 }, (_, i) => i + 1).map(ch => (
                        <button
                          key={ch}
                          onClick={() => toggleChannel(ch)}
                          className="aspect-square rounded text-xs font-bold transition-all"
                          style={{
                            backgroundColor: selectedChannels.includes(ch) ? 'var(--theme-primary)' : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: selectedChannels.includes(ch) ? '1px solid var(--theme-primary)' : '1px solid rgba(255,255,255,0.2)'
                          }}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {getAffectedChannels().length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-white/10 border border-white/20">
                  <p className="text-xs text-white/80">
                    <strong>{getAffectedChannels().length}</strong> channels selected
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md space-y-3">
                <h2 className="text-xl font-bold text-white text-center mb-3">Set Color</h2>

                <div
                  className="w-full h-16 rounded-lg border-2"
                  style={{
                    backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                    borderColor: 'rgba(255,255,255,0.3)'
                  }}
                />

                <div className="space-y-2">
                  {['r', 'g', 'b'].map((ch) => (
                    <div key={ch}>
                      <div className="flex justify-between text-xs font-bold text-white/80 mb-1">
                        <span>{ch.toUpperCase()}</span>
                        <span>{color[ch]}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={color[ch]}
                        onChange={(e) => setColor({ ...color, [ch]: Number(e.target.value) })}
                        className="w-full h-2 rounded-full"
                        style={{
                          background: `linear-gradient(to right, 
                            ${ch === 'r' ? `rgb(0, ${color.g}, ${color.b})` : ch === 'g' ? `rgb(${color.r}, 0, ${color.b})` : `rgb(${color.r}, ${color.g}, 0)`} 0%, 
                            ${ch === 'r' ? `rgb(255, ${color.g}, ${color.b})` : ch === 'g' ? `rgb(${color.r}, 255, ${color.b})` : `rgb(${color.r}, ${color.g}, 255)`} 100%)`
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-white/80 mb-1">
                    <span>Intensity</span>
                    <span>{intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full h-2 rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--theme-primary) 0%, var(--theme-primary) ${intensity}%, rgba(255,255,255,0.2) ${intensity}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>

                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[
                    { name: 'Red', r: 255, g: 0, b: 0 },
                    { name: 'Orange', r: 255, g: 128, b: 0 },
                    { name: 'Yellow', r: 255, g: 255, b: 0 },
                    { name: 'Green', r: 0, g: 255, b: 0 },
                    { name: 'Cyan', r: 0, g: 255, b: 255 },
                    { name: 'Blue', r: 0, g: 0, b: 255 },
                    { name: 'Purple', r: 128, g: 0, b: 255 },
                    { name: 'Magenta', r: 255, g: 0, b: 255 },
                    { name: 'White', r: 255, g: 255, b: 255 },
                    { name: 'Warm', r: 255, g: 200, b: 150 }
                  ].map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => setColor({ r: preset.r, g: preset.g, b: preset.b })}
                      className="aspect-square rounded-lg border border-white/30"
                      style={{ backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})` }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 3 && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md">
                <h2 className="text-xl font-bold text-white text-center mb-4">Review</h2>

                <div className="glass-panel rounded-lg border p-4 space-y-3"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Name</p>
                    <p className="text-base font-bold text-white">{sceneName}</p>
                  </div>

                  {description && (
                    <div>
                      <p className="text-xs text-white/60 mb-0.5">Description</p>
                      <p className="text-sm text-white">{description}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Channels</p>
                    <p className="text-sm text-white">{getAffectedChannels().length} selected</p>
                  </div>

                  <div>
                    <p className="text-xs text-white/60 mb-1">Color</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded border"
                        style={{
                          backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                          borderColor: 'rgba(255,255,255,0.3)'
                        }}
                      />
                      <p className="text-sm text-white">
                        RGB({color.r}, {color.g}, {color.b}) @ {intensity}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-white/60 mb-0.5">Fade</p>
                    <p className="text-sm text-white">{(fadeTime / 1000).toFixed(1)}s</p>
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

export const SceneCreatorHeaderExtension = () => null;
