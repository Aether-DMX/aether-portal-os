import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Play, Square, Trash2, Plus, X, Lightbulb, Users, Hash, Globe } from 'lucide-react';
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
  const { configuredUniverses, fetchConfiguredUniverses } = useDMXStore();
  const { playback, syncStatus } = usePlaybackStore();

  const [optionsModal, setOptionsModal] = useState(null);
  const [targetMode, setTargetMode] = useState('all');
  const [selectedUniverse, setSelectedUniverse] = useState('all');
  const [selectedFixtures, setSelectedFixtures] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);

  useEffect(() => {
    fetchChases();
    fetchFixtures();
    fetchConfiguredUniverses();
    syncStatus();
  }, [fetchChases, fetchFixtures, fetchConfiguredUniverses, syncStatus]);

  // Check if chase is playing (on any universe)
  const isChasePlaying = (chase) => {
    const chaseId = chase.chase_id || chase.id;
    return Object.values(playback).some(p => p?.type === 'chase' && p?.id === chaseId);
  };

  // Toggle chase - play if not playing, stop if playing
  const toggleChase = (chase) => {
    const chaseId = chase.chase_id || chase.id;
    if (isChasePlaying(chase)) {
      // Stop
      fetch(`http://${window.location.hostname}:8891/api/playback/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(() => syncStatus());
    } else {
      // Play on all universes (default behavior)
      startChase(chaseId, {});
      syncStatus();
    }
  };

  // Long press to open options modal
  const openOptionsModal = (chase, e) => {
    e.preventDefault();
    setOptionsModal(chase);
    setTargetMode('all');
    setSelectedUniverse('all');
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

  const handleStartWithOptions = () => {
    if (!optionsModal) return;
    const targetChannels = getTargetChannels();
    const chaseId = optionsModal.chase_id || optionsModal.id;
    const options = {};

    if (targetChannels && targetChannels.length > 0) {
      options.targetChannels = targetChannels;
    }
    if (selectedUniverse !== 'all') {
      options.universe = parseInt(selectedUniverse);
    }

    startChase(chaseId, options);
    setOptionsModal(null);
    syncStatus();
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

        {/* Chase Grid - Small rectangles */}
        <div className="flex-1 overflow-y-auto">
          {chases.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Zap className="w-12 h-12 text-white/10 mb-3" />
              <p className="text-white/40 mb-3 text-sm">No chases created yet</p>
              <button onClick={() => navigate('/chase-creator')} className="btn btn-success btn-sm">
                Create Your First Chase
              </button>
            </div>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {chases.map((chase) => {
                const isActive = isChasePlaying(chase);
                return (
                  <button
                    key={chase.chase_id || chase.id}
                    onClick={() => toggleChase(chase)}
                    onContextMenu={(e) => openOptionsModal(chase, e)}
                    onTouchStart={(e) => {
                      const timer = setTimeout(() => openOptionsModal(chase, e), 500);
                      e.target._longPressTimer = timer;
                    }}
                    onTouchEnd={(e) => clearTimeout(e.target._longPressTimer)}
                    onTouchMove={(e) => clearTimeout(e.target._longPressTimer)}
                    className={`p-3 rounded-lg border transition-all flex items-center gap-3 ${
                      isActive
                        ? 'border-green-400 bg-green-500/15'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {isActive ? (
                      <Square className="w-5 h-5 text-green-400 flex-shrink-0" fill="#22c55e" />
                    ) : (
                      <Play className="w-5 h-5 text-white/60 flex-shrink-0" />
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{chase.name}</p>
                      <p className="text-[10px] text-white/40">
                        {chase.steps?.length || 0} steps • {chase.bpm || 120} BPM
                        {isActive && <span className="ml-2 text-green-400 font-bold">● RUNNING</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Options Modal */}
      {optionsModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">{optionsModal.name}</h2>
              <p className="text-white/50 text-sm">{optionsModal.steps?.length || 0} steps • {optionsModal.bpm || 120} BPM</p>
            </div>
            <button onClick={() => setOptionsModal(null)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
              <X size={24} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* Universe Selection */}
            <div>
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Globe size={18} className="text-green-400" /> Target Universe
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setSelectedUniverse('all')}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedUniverse === 'all'
                      ? 'border-green-400 bg-green-500/20'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  <p className="font-bold text-white">ALL</p>
                  <p className="text-[10px] text-white/50">All Universes</p>
                </button>
                {configuredUniverses.map(univ => (
                  <button
                    key={univ}
                    onClick={() => setSelectedUniverse(univ.toString())}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedUniverse === univ.toString()
                        ? 'border-green-400 bg-green-500/20'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    <p className="font-bold text-white">U{univ}</p>
                    <p className="text-[10px] text-white/50">Universe {univ}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Mode Selection */}
            <div>
              <h3 className="text-white font-bold mb-3">Target Channels</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All', icon: Zap, desc: 'All channels' },
                  { id: 'fixtures', label: 'Fixtures', icon: Lightbulb, desc: 'By fixture' },
                  { id: 'groups', label: 'Groups', icon: Users, desc: 'By group' },
                  { id: 'channels', label: 'Channels', icon: Hash, desc: 'Individual' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setTargetMode(mode.id)}
                    className={`p-3 rounded-lg border transition-all ${
                      targetMode === mode.id
                        ? 'border-green-400 bg-green-500/20'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    <mode.icon size={20} className={targetMode === mode.id ? 'text-green-400 mx-auto mb-1' : 'text-white/60 mx-auto mb-1'} />
                    <p className="font-bold text-white text-sm">{mode.label}</p>
                    <p className="text-[10px] text-white/50">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Selection Content */}
            {targetMode === 'all' && (
              <div className="text-center py-8 bg-white/5 rounded-lg">
                <Zap size={40} className="text-green-400/30 mx-auto mb-3" />
                <p className="text-white/60">Run chase on all channels</p>
                <p className="text-white/40 text-sm mt-1">{optionsModal.steps?.length || 0} steps</p>
              </div>
            )}

            {targetMode === 'fixtures' && (
              <div className="grid grid-cols-3 gap-3">
                {fixtures.length === 0 ? (
                  <p className="col-span-3 text-white/60 text-center py-8">No fixtures configured</p>
                ) : fixtures.map(fixture => {
                  const fixtureId = fixture.fixture_id || fixture.id;
                  const isSelected = selectedFixtures.includes(fixtureId);
                  const range = getFixtureChannelRange(fixture);
                  return (
                    <button
                      key={fixtureId}
                      onClick={() => toggleFixture(fixtureId)}
                      className={`p-4 rounded-lg border transition-all text-left ${
                        isSelected
                          ? 'border-green-400 bg-green-500/20'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      <Lightbulb size={24} className={isSelected ? 'text-green-400 mb-2' : 'text-white/40 mb-2'}
                        fill={isSelected ? '#22c55e' : 'transparent'} />
                      <p className="font-bold text-white">{fixture.name}</p>
                      <p className="text-xs text-white/50">Ch {range.start}-{range.end}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {targetMode === 'groups' && (
              <div className="grid grid-cols-3 gap-3">
                {groups.length === 0 ? (
                  <p className="col-span-3 text-white/60 text-center py-8">No groups configured</p>
                ) : groups.map(group => {
                  const isSelected = selectedGroups.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => toggleGroup(group.id)}
                      className={`p-4 rounded-lg border transition-all text-left ${
                        isSelected
                          ? 'border-green-400 bg-green-500/20'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      <Users size={24} className={isSelected ? 'text-green-400 mb-2' : 'text-white/40 mb-2'} />
                      <p className="font-bold text-white">{group.name}</p>
                      <p className="text-xs text-white/50">{group.channels?.length || 0} channels</p>
                    </button>
                  );
                })}
              </div>
            )}

            {targetMode === 'channels' && (
              <div>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setSelectedChannels([...Array(12)].map((_, i) => i + 1))}
                    className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-bold">1-12</button>
                  <button onClick={() => setSelectedChannels([...Array(24)].map((_, i) => i + 1))}
                    className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-bold">1-24</button>
                  <button onClick={() => setSelectedChannels([...Array(48)].map((_, i) => i + 1))}
                    className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-bold">1-48</button>
                  <button onClick={() => setSelectedChannels([])}
                    className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-bold">Clear</button>
                </div>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 96 }, (_, i) => i + 1).map(ch => (
                    <button
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`aspect-square rounded text-xs font-bold transition-all ${
                        selectedChannels.includes(ch)
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex gap-3 flex-shrink-0">
            <button
              onClick={() => {
                const chaseId = optionsModal.chase_id || optionsModal.id;
                if (confirm(`Delete chase "${optionsModal.name}"?`)) {
                  deleteChase(chaseId);
                  setOptionsModal(null);
                }
              }}
              className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => setOptionsModal(null)}
              className="flex-1 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleStartWithOptions}
              disabled={!canStart()}
              className="flex-1 py-3 rounded-lg border font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: canStart() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.1)',
                borderColor: canStart() ? '#22c55e' : 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            >
              <Play size={18} /> Run Chase
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ChasesHeaderExtension = () => null;
