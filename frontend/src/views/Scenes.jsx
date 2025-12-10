import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, Trash2, Plus, X, Lightbulb, Users, Hash } from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import { useFixtureStore } from '../store/fixtureStore';
import useGroupStore from '../store/groupStore';
import useDMXStore from '../store/dmxStore';
import usePlaybackStore from '../store/playbackStore';

export default function Scenes() {
  const navigate = useNavigate();
  const { scenes, fetchScenes, playScene, deleteScene } = useSceneStore();
  const { fixtures, fetchFixtures, getFixtureChannelRange } = useFixtureStore();
  const { groups } = useGroupStore();
  const { currentUniverse } = useDMXStore();
  const { playback, stopAll, syncStatus } = usePlaybackStore();

  // Check if a scene is active (from SSOT)
  const isSceneActive = (scene) => {
    const sceneId = scene.scene_id || scene.id;
    const universe = scene.universe || 1;
    const current = playback[universe];
    return current?.type === 'scene' && current?.id === sceneId;
  };

  const [targetModal, setTargetModal] = useState(null);
  const [targetMode, setTargetMode] = useState('all');
  const [selectedFixtures, setSelectedFixtures] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);

  useEffect(() => {
    fetchScenes();
    fetchFixtures();
    syncStatus(); // Sync playback state from SSOT
  }, [fetchScenes, fetchFixtures, syncStatus]);

  const openTargetModal = (scene) => {
    setTargetModal(scene);
    setTargetMode('all');
    setSelectedFixtures([]);
    setSelectedGroups([]);
    setSelectedChannels([]);
  };

  const toggleFixture = (id) => {
    setSelectedFixtures(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleGroup = (id) => {
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleChannel = (ch) => {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(x => x !== ch) : [...prev, ch]);
  };

  const getTargetChannels = () => {
    if (targetMode === 'all') return null;
    const channels = new Set();
    if (targetMode === 'fixtures') {
      selectedFixtures.forEach(fid => {
        const fixture = fixtures.find(f => (f.fixture_id || f.id) === fid);
        if (fixture) {
          const range = getFixtureChannelRange(fixture);
          range.channels.forEach(ch => channels.add(ch));
        }
      });
    } else if (targetMode === 'groups') {
      selectedGroups.forEach(gid => {
        const group = groups.find(g => g.id === gid);
        if (group) group.channels.forEach(ch => channels.add(ch));
      });
    } else if (targetMode === 'channels') {
      selectedChannels.forEach(ch => channels.add(ch));
    }
    return Array.from(channels);
  };

  const handlePlay = () => {
    if (!targetModal) return;
    const targetChannels = getTargetChannels();
    const sceneId = targetModal.scene_id || targetModal.id;
    if (targetChannels === null) {
      playScene(sceneId, 1000);
    } else if (targetChannels.length > 0) {
      playScene(sceneId, 1000, { targetChannels });
    }
    setTargetModal(null);
  };

  const canPlay = () => {
    if (targetMode === 'all') return true;
    if (targetMode === 'fixtures') return selectedFixtures.length > 0;
    if (targetMode === 'groups') return selectedGroups.length > 0;
    if (targetMode === 'channels') return selectedChannels.length > 0;
    return false;
  };

  return (
    <div className="page-container" style={{ overflow: 'hidden' }}>
      <div className="flex-1 flex flex-col p-3 gap-3 h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 theme-text" /> Scenes
          </h1>
          <button onClick={() => navigate('/scene-creator')} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {/* Grid - Fixed height, no scroll */}
        <div className="flex-1 overflow-hidden">
          {scenes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Sparkles className="w-12 h-12 text-white/10 mb-3" />
              <p className="text-white/40 mb-3 text-sm">No scenes created yet</p>
              <button onClick={() => navigate('/scene-creator')} className="btn btn-primary btn-sm">
                Create Your First Scene
              </button>
            </div>
          ) : (
            <div className="grid gap-2 h-full w-full overflow-y-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(70px, 15vw, 90px), 1fr))', gridAutoRows: 'minmax(clamp(70px, 15vw, 90px), auto)' }}>
              {scenes.map((scene) => {
                const isActive = isSceneActive(scene);
                return (
                  <button
                    key={scene.scene_id || scene.id}
                    onClick={() => openTargetModal(scene)}
                    className={`card aspect-square p-2 flex flex-col items-center justify-center hover:ring-2 hover:ring-white/30 active:scale-95 transition-all overflow-hidden ${isActive ? 'ring-2 ring-[var(--theme-primary)]' : ''}`}
                    style={isActive ? { background: 'rgba(var(--theme-primary-rgb), 0.15)' } : {}}
                  >
                    <Sparkles className={`w-5 h-5 mb-1 flex-shrink-0 ${isActive ? 'theme-text animate-pulse' : 'theme-text'}`} />
                    <span className="font-semibold text-white text-[10px] leading-tight text-center line-clamp-2 w-full">{scene.name}</span>
                    {isActive && <span className="text-[8px] theme-text mt-0.5">ACTIVE</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Target Selection Modal */}
      {targetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-bold">Play: {targetModal.name}</h3>
              <button onClick={() => setTargetModal(null)} className="p-1 rounded hover:bg-white/10">
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Mode Selection */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'all', label: 'All', icon: Sparkles },
                  { id: 'fixtures', label: 'Fixtures', icon: Lightbulb },
                  { id: 'groups', label: 'Groups', icon: Users },
                  { id: 'channels', label: 'Channels', icon: Hash }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setTargetMode(mode.id)}
                    className="py-2 px-1 rounded-lg border text-xs font-bold text-white flex flex-col items-center gap-1"
                    style={{
                      borderColor: targetMode === mode.id ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)',
                      backgroundColor: targetMode === mode.id ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'transparent'
                    }}
                  >
                    <mode.icon size={14} />
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* All Mode */}
              {targetMode === 'all' && (
                <div className="text-center py-6">
                  <Sparkles size={32} className="text-white/30 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">Apply to all original channels</p>
                  <p className="text-white/40 text-xs mt-1">
                    {Object.keys(targetModal.channels || {}).length} channels in scene
                  </p>
                </div>
              )}

              {/* Fixtures Mode */}
              {targetMode === 'fixtures' && (
                <div>
                  {fixtures.filter(f => f.universe === currentUniverse).length === 0 ? (
                    <p className="text-white/60 text-xs text-center py-4">No fixtures in universe {currentUniverse}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {fixtures.filter(f => f.universe === currentUniverse).map(fixture => {
                        const fixtureId = fixture.fixture_id || fixture.id;
                        const isSelected = selectedFixtures.includes(fixtureId);
                        const range = getFixtureChannelRange(fixture);
                        return (
                          <button
                            key={fixtureId}
                            onClick={() => toggleFixture(fixtureId)}
                            className="p-2 rounded-lg border transition-all text-left"
                            style={{
                              borderColor: isSelected ? (fixture.color || 'var(--theme-primary)') : 'rgba(255,255,255,0.2)',
                              backgroundColor: isSelected ? `${fixture.color || 'var(--theme-primary)'}30` : 'rgba(255,255,255,0.05)'
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <Lightbulb size={12} style={{ color: fixture.color || 'var(--theme-primary)' }} fill={isSelected ? (fixture.color || 'var(--theme-primary)') : 'transparent'} />
                              <p className="font-bold text-white text-xs truncate">{fixture.name}</p>
                            </div>
                            <p className="text-[10px] text-white/60 mt-0.5">Ch {range.start}-{range.end}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Groups Mode */}
              {targetMode === 'groups' && (
                <div>
                  {groups.length === 0 ? (
                    <p className="text-white/60 text-xs text-center py-4">No groups created</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {groups.map(group => {
                        const isSelected = selectedGroups.includes(group.id);
                        return (
                          <button
                            key={group.id}
                            onClick={() => toggleGroup(group.id)}
                            className="p-2 rounded-lg border transition-all text-left"
                            style={{
                              borderColor: isSelected ? group.color : 'rgba(255,255,255,0.2)',
                              backgroundColor: isSelected ? `${group.color}30` : 'rgba(255,255,255,0.05)'
                            }}
                          >
                            <p className="font-bold text-white text-xs">{group.name}</p>
                            <p className="text-[10px] text-white/60">{group.channels?.length || 0} ch</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Channels Mode */}
              {targetMode === 'channels' && (
                <div>
                  <div className="flex gap-1 mb-2">
                    <button onClick={() => setSelectedChannels([...Array(10)].map((_, i) => i + 1))} className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">1-10</button>
                    <button onClick={() => setSelectedChannels([...Array(50)].map((_, i) => i + 1))} className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">1-50</button>
                    <button onClick={() => setSelectedChannels([])} className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">Clear</button>
                  </div>
                  <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto">
                    {Array.from({ length: 100 }, (_, i) => i + 1).map(ch => (
                      <button key={ch} onClick={() => toggleChannel(ch)} className="aspect-square rounded text-[10px] font-bold"
                        style={{ backgroundColor: selectedChannels.includes(ch) ? 'var(--theme-primary)' : 'rgba(255,255,255,0.1)', color: 'white' }}>
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/10 flex gap-2">
              <button onClick={() => setTargetModal(null)} className="flex-1 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold">
                Cancel
              </button>
              <button onClick={handlePlay} disabled={!canPlay()}
                className="flex-1 py-2 rounded-lg border text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{
                  background: canPlay() ? 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))' : 'rgba(255,255,255,0.1)',
                  borderColor: canPlay() ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)'
                }}>
                <Play size={14} /> Play
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const ScenesHeaderExtension = () => null;
