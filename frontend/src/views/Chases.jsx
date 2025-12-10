import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Play, Square, Trash2, Plus, X, Lightbulb, Users, Hash } from 'lucide-react';
import useChaseStore from '../store/chaseStore';
import { useFixtureStore } from '../store/fixtureStore';
import useGroupStore from '../store/groupStore';
import useDMXStore from '../store/dmxStore';
import usePlaybackStore from '../store/playbackStore';

export default function Chases() {
  const navigate = useNavigate();
  const { chases, fetchChases, startChase, stopChase, deleteChase } = useChaseStore();
  const { fixtures, fetchFixtures, getFixtureChannelRange } = useFixtureStore();
  const { groups } = useGroupStore();
  const { currentUniverse } = useDMXStore();
  const { playback, syncStatus } = usePlaybackStore();

  const [targetModal, setTargetModal] = useState(null);
  const [targetMode, setTargetMode] = useState('all');
  const [selectedFixtures, setSelectedFixtures] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);

  useEffect(() => {
    fetchChases();
    fetchFixtures();
    syncStatus(); // Sync playback state from SSOT
  }, [fetchChases, fetchFixtures, syncStatus]);

  // Check if chase is active using SSOT playback store
  const isActive = (chase) => {
    const chaseId = chase.chase_id || chase.id;
    const universe = chase.universe || 1;
    const current = playback[universe];
    return current?.type === 'chase' && current?.id === chaseId;
  };

  const openTargetModal = (chase) => {
    setTargetModal(chase);
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

  const handleStart = () => {
    if (!targetModal) return;
    const targetChannels = getTargetChannels();
    const chaseId = targetModal.chase_id || targetModal.id;
    if (targetChannels === null) {
      startChase(chaseId);
    } else if (targetChannels.length > 0) {
      startChase(chaseId, { targetChannels });
    }
    setTargetModal(null);
  };

  const canStart = () => {
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
            <Zap className="w-5 h-5 text-green-400" /> Chases
          </h1>
          <button onClick={() => navigate('/chase-creator')} className="btn btn-success btn-sm">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {/* Grid - Fixed height, no scroll */}
        <div className="flex-1 overflow-hidden">
          {chases.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Zap className="w-12 h-12 text-white/10 mb-3" />
              <p className="text-white/40 mb-3 text-sm">No chases created yet</p>
              <button onClick={() => navigate('/chase-creator')} className="btn btn-success btn-sm">
                Create Your First Chase
              </button>
            </div>
          ) : (
            <div className="grid gap-2 h-full w-full overflow-y-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(70px, 15vw, 90px), 1fr))', gridAutoRows: 'minmax(clamp(70px, 15vw, 90px), auto)' }}>
              {chases.map((chase) => (
                <button
                  key={chase.chase_id || chase.id}
                  onClick={() => isActive(chase) ? stopChase(chase.chase_id || chase.id) : openTargetModal(chase)}
                  className={`card aspect-square p-2 flex flex-col items-center justify-center hover:ring-2 hover:ring-white/30 active:scale-95 transition-all overflow-hidden ${isActive(chase) ? 'ring-2 ring-green-400' : ''}`}
                  style={isActive(chase) ? { background: 'rgba(34, 197, 94, 0.15)' } : {}}
                >
                  <Zap className={`w-5 h-5 mb-1 flex-shrink-0 ${isActive(chase) ? 'text-green-400 animate-pulse' : 'text-green-400'}`} />
                  <span className="font-semibold text-white text-[10px] leading-tight text-center line-clamp-2 w-full">{chase.name}</span>
                  {isActive(chase) && <span className="text-[8px] text-green-400 mt-0.5">PLAYING</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Target Selection Modal */}
      {targetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-bold">Run: {targetModal.name}</h3>
              <button onClick={() => setTargetModal(null)} className="p-1 rounded hover:bg-white/10">
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Mode Selection */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'all', label: 'All', icon: Zap },
                  { id: 'fixtures', label: 'Fixtures', icon: Lightbulb },
                  { id: 'groups', label: 'Groups', icon: Users },
                  { id: 'channels', label: 'Channels', icon: Hash }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setTargetMode(mode.id)}
                    className="py-2 px-1 rounded-lg border text-xs font-bold text-white flex flex-col items-center gap-1"
                    style={{
                      borderColor: targetMode === mode.id ? '#22c55e' : 'rgba(255,255,255,0.2)',
                      backgroundColor: targetMode === mode.id ? 'rgba(34, 197, 94, 0.2)' : 'transparent'
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
                  <Zap size={32} className="text-green-400/30 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">Apply to all original channels</p>
                  <p className="text-white/40 text-xs mt-1">
                    {targetModal.steps?.length || 0} steps in chase
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
                              borderColor: isSelected ? (fixture.color || '#22c55e') : 'rgba(255,255,255,0.2)',
                              backgroundColor: isSelected ? `${fixture.color || '#22c55e'}30` : 'rgba(255,255,255,0.05)'
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <Lightbulb size={12} style={{ color: fixture.color || '#22c55e' }} fill={isSelected ? (fixture.color || '#22c55e') : 'transparent'} />
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
                        style={{ backgroundColor: selectedChannels.includes(ch) ? '#22c55e' : 'rgba(255,255,255,0.1)', color: 'white' }}>
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
              <button onClick={handleStart} disabled={!canStart()}
                className="flex-1 py-2 rounded-lg border text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{
                  background: canStart() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.1)',
                  borderColor: canStart() ? '#22c55e' : 'rgba(255,255,255,0.2)'
                }}>
                <Play size={14} /> Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const ChasesHeaderExtension = () => null;
