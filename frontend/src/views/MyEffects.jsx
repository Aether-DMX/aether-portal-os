import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Play, Trash2, Plus, X, Lightbulb, Users, Hash, Square } from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import { useFixtureStore } from '../store/fixtureStore';
import useGroupStore from '../store/groupStore';
import useDMXStore from '../store/dmxStore';

export default function MyEffects() {
  const navigate = useNavigate();
  const { scenes, fetchScenes, playScene, deleteScene } = useSceneStore();
  const { chases, activeChase, fetchChases, startChase, stopChase, deleteChase } = useChaseStore();
  const { fixtures, fetchFixtures, getFixtureChannelRange } = useFixtureStore();
  const { groups } = useGroupStore();
  const { currentUniverse } = useDMXStore();

  const [activeTab, setActiveTab] = useState('scenes');
  const [targetModal, setTargetModal] = useState(null);
  const [targetMode, setTargetMode] = useState('all');
  const [selectedFixtures, setSelectedFixtures] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);

  useEffect(() => {
    fetchScenes();
    fetchChases();
    fetchFixtures();
  }, [fetchScenes, fetchChases, fetchFixtures]);

  const items = activeTab === 'scenes' ? scenes : chases;

  const openTargetModal = (item) => {
    setTargetModal({ item, type: activeTab });
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
    const { item, type } = targetModal;

    if (type === 'scenes') {
      const sceneId = item.scene_id || item.id;
      if (targetChannels === null) {
        playScene(sceneId, 1000);
      } else if (targetChannels.length > 0) {
        playScene(sceneId, 1000, { targetChannels });
      }
    } else {
      const chaseId = item.chase_id || item.id;
      if (targetChannels === null) {
        startChase(chaseId);
      } else if (targetChannels.length > 0) {
        startChase(chaseId, { targetChannels });
      }
    }
    setTargetModal(null);
  };

  const handleStop = (item) => {
    stopChase(item.chase_id || item.id);
  };

  const handleDelete = (item) => {
    if (activeTab === 'scenes') {
      deleteScene(item.scene_id || item.id);
    } else {
      deleteChase(item.chase_id || item.id);
    }
  };

  const isChaseActive = (chase) => activeChase?.chase_id === chase.chase_id || activeChase?.id === chase.id;

  const canPlay = () => {
    if (targetMode === 'all') return true;
    if (targetMode === 'fixtures') return selectedFixtures.length > 0;
    if (targetMode === 'groups') return selectedGroups.length > 0;
    if (targetMode === 'channels') return selectedChannels.length > 0;
    return false;
  };

  return (
    <div className="page-container">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">

        {/* Header with tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5">
            <button
              onClick={() => setActiveTab('scenes')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'scenes' ? 'theme-bg text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Scenes ({scenes.length})
            </button>
            <button
              onClick={() => setActiveTab('chases')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'chases' ? 'bg-green-500 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Zap className="w-4 h-4" /> Chases ({chases.length})
            </button>
          </div>

          <button
            onClick={() => navigate(activeTab === 'scenes' ? '/scene-creator' : '/chase-creator')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              {activeTab === 'scenes' ? (
                <Sparkles className="w-16 h-16 text-white/10 mb-4" />
              ) : (
                <Zap className="w-16 h-16 text-white/10 mb-4" />
              )}
              <p className="text-white/40 mb-4">No {activeTab} saved yet</p>
              <button
                onClick={() => navigate(activeTab === 'scenes' ? '/scene-creator' : '/chase-creator')}
                className={`btn ${activeTab === 'scenes' ? 'btn-primary' : 'btn-success'}`}
              >
                Create Your First {activeTab === 'scenes' ? 'Scene' : 'Chase'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {items.map((item) => {
                const isActive = activeTab === 'chases' && isChaseActive(item);
                return (
                  <div
                    key={item.scene_id || item.chase_id || item.id}
                    className={`card p-3 ${isActive ? 'ring-2 ring-green-400' : ''}`}
                    style={isActive ? { background: 'rgba(34, 197, 94, 0.15)' } : {}}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {activeTab === 'scenes' ? (
                          <Sparkles className="w-4 h-4 theme-text" />
                        ) : (
                          <Zap className={`w-4 h-4 ${isActive ? 'text-green-400 animate-pulse' : 'text-green-400'}`} />
                        )}
                        <span className="font-semibold text-white text-sm truncate">{item.name}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <p className="text-[10px] text-white/40 mb-2">
                      {activeTab === 'scenes'
                        ? `${Object.keys(item.channels || {}).length} channels`
                        : `${item.steps?.length || 0} steps`}
                    </p>

                    <div className="flex gap-2">
                      {activeTab === 'chases' && isActive ? (
                        <button
                          onClick={() => handleStop(item)}
                          className="flex-1 btn btn-sm btn-danger"
                        >
                          <Square className="w-3 h-3" /> Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => openTargetModal(item)}
                          className={`flex-1 btn btn-sm ${activeTab === 'scenes' ? 'btn-primary' : 'btn-success'}`}
                        >
                          <Play className="w-3 h-3" /> Play
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        className="btn btn-sm btn-danger"
                        disabled={isActive}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
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
              <h3 className="text-white font-bold flex items-center gap-2">
                {targetModal.type === 'scenes' ? <Sparkles size={16} className="theme-text" /> : <Zap size={16} className="text-green-400" />}
                {targetModal.item.name}
              </h3>
              <button onClick={() => setTargetModal(null)} className="p-1 rounded hover:bg-white/10">
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Mode Selection */}
              <p className="text-xs text-white/60 text-center">Apply to:</p>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'all', label: 'All', icon: targetModal.type === 'scenes' ? Sparkles : Zap },
                  { id: 'fixtures', label: 'Fixtures', icon: Lightbulb },
                  { id: 'groups', label: 'Groups', icon: Users },
                  { id: 'channels', label: 'Channels', icon: Hash }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setTargetMode(mode.id)}
                    className="py-2 px-1 rounded-lg border text-xs font-bold text-white flex flex-col items-center gap-1"
                    style={{
                      borderColor: targetMode === mode.id ? (targetModal.type === 'scenes' ? 'var(--theme-primary)' : '#22c55e') : 'rgba(255,255,255,0.2)',
                      backgroundColor: targetMode === mode.id ? (targetModal.type === 'scenes' ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'rgba(34, 197, 94, 0.2)') : 'transparent'
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
                  {targetModal.type === 'scenes' ? (
                    <Sparkles size={32} className="text-white/30 mx-auto mb-2" />
                  ) : (
                    <Zap size={32} className="text-green-400/30 mx-auto mb-2" />
                  )}
                  <p className="text-white/60 text-sm">Apply to all original channels</p>
                  <p className="text-white/40 text-xs mt-1">
                    {targetModal.type === 'scenes'
                      ? `${Object.keys(targetModal.item.channels || {}).length} channels in scene`
                      : `${targetModal.item.steps?.length || 0} steps in chase`}
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
                    <button onClick={() => setSelectedChannels([...Array(100)].map((_, i) => i + 1))} className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">1-100</button>
                    <button onClick={() => setSelectedChannels([])} className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold">Clear</button>
                  </div>
                  <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto">
                    {Array.from({ length: 512 }, (_, i) => i + 1).map(ch => (
                      <button key={ch} onClick={() => toggleChannel(ch)} className="aspect-square rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: selectedChannels.includes(ch) ? (targetModal.type === 'scenes' ? 'var(--theme-primary)' : '#22c55e') : 'rgba(255,255,255,0.1)',
                          color: 'white'
                        }}>
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
                  background: canPlay()
                    ? (targetModal.type === 'scenes' ? 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))' : 'linear-gradient(135deg, #22c55e, #16a34a)')
                    : 'rgba(255,255,255,0.1)',
                  borderColor: canPlay() ? (targetModal.type === 'scenes' ? 'var(--theme-primary)' : '#22c55e') : 'rgba(255,255,255,0.2)'
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

export const MyEffectsHeaderExtension = () => null;
