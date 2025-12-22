import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Layers, Hash, Cpu, Sparkles, ChevronRight, AlertTriangle, Wifi, WifiOff, Save } from 'lucide-react';
import useFixtureStore from '../store/fixtureStore';
import useNodeStore from '../store/nodeStore';

const FIXTURE_LIBRARY = [
  { id: 'dimmer', name: 'Dimmer', channels: 1, map: ['Intensity'] },
  { id: 'par-rgb', name: 'RGB PAR', channels: 3, map: ['Red', 'Green', 'Blue'] },
  { id: 'par-rgbw', name: 'RGBW PAR', channels: 4, map: ['Red', 'Green', 'Blue', 'White'] },
  { id: 'par-rgba', name: 'RGBA PAR', channels: 4, map: ['Red', 'Green', 'Blue', 'Amber'] },
  { id: 'cct', name: 'CCT Fixture', channels: 2, map: ['Warm', 'Cool'] },
  { id: 'led-bar', name: 'LED Bar', channels: 4, map: ['Red', 'Green', 'Blue', 'White'] },
  { id: 'moving-head', name: 'Moving Head', channels: 16, map: ['Pan', 'PanF', 'Tilt', 'TiltF', 'Speed', 'Dim', 'Shutter', 'Color', 'Gobo', 'GoboRot', 'Prism', 'Focus', 'Zoom', 'Frost', 'R', 'G'] },
  { id: 'custom', name: 'Custom', channels: 1, map: ['Ch1'] },
];

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

function AddressGrid({ fixtures, universe, onSelect, conflicts }) {
  const cells = [];
  const fixtureMap = {};
  
  fixtures.forEach(f => {
    for (let ch = f.start_channel; ch < f.start_channel + f.channel_count; ch++) {
      fixtureMap[ch] = f;
    }
  });

  for (let i = 1; i <= 512; i++) {
    const fixture = fixtureMap[i];
    const isConflict = conflicts.has(i);
    const isStart = fixture && fixture.start_channel === i;
    
    cells.push(
      <div
        key={i}
        onClick={() => fixture && onSelect(fixture)}
        className={`w-4 h-4 text-[6px] flex items-center justify-center rounded-sm cursor-pointer transition-all
          ${fixture ? 'text-white font-bold' : 'bg-white/5 text-white/20'}
          ${isConflict ? 'ring-1 ring-red-500' : ''}
          ${isStart ? 'ring-1 ring-white/50' : ''}`}
        style={{ background: fixture ? fixture.color || '#8b5cf6' : undefined }}
        title={fixture ? `${fixture.name} (${i})` : `Ch ${i}`}
      >
        {isStart ? fixture.name.charAt(0) : (i % 50 === 0 ? i : '')}
      </div>
    );
  }

  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(32, 1fr)' }}>
      {cells}
    </div>
  );
}

function FixtureCard({ fixture, onEdit, onDelete, nodes, isConflict }) {
  const node = nodes.find(n => n.node_id === fixture.node_id);
  
  return (
    <div className={`p-3 rounded-xl border transition-all ${isConflict ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: fixture.color || '#8b5cf6' }}>
          {fixture.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{fixture.name}</div>
          <div className="text-xs text-white/50">
            U{fixture.universe} • Ch {fixture.start_channel}-{fixture.start_channel + fixture.channel_count - 1} • {fixture.channel_count}ch
          </div>
        </div>
        {isConflict && <AlertTriangle size={16} className="text-red-400" />}
        {node && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${node.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {node.status === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
            {node.name}
          </div>
        )}
        <button onClick={() => onEdit(fixture)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
          <Edit2 size={14} className="text-white/60" />
        </button>
        <button onClick={() => onDelete(fixture.fixture_id)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}

function FixtureModal({ fixture, onSave, onClose, nodes }) {
  const [name, setName] = useState(fixture?.name || '');
  const [type, setType] = useState(fixture?.type || 'par-rgb');
  const [universe, setUniverse] = useState(fixture?.universe || 1);
  const [startChannel, setStartChannel] = useState(fixture?.start_channel || 1);
  const [channelCount, setChannelCount] = useState(fixture?.channel_count || 3);
  const [nodeId, setNodeId] = useState(fixture?.node_id || '');
  const [color, setColor] = useState(fixture?.color || '#8b5cf6');

  const selectedType = FIXTURE_LIBRARY.find(t => t.id === type);
  
  useEffect(() => {
    if (selectedType && !fixture) {
      setChannelCount(selectedType.channels);
    }
  }, [type]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      fixture_id: fixture?.fixture_id,
      name: name.trim(),
      type,
      universe,
      start_channel: startChannel,
      channel_count: channelCount,
      channel_map: selectedType?.map || [],
      node_id: nodeId || null,
      color
    });
  };

  const endChannel = startChannel + channelCount - 1;
  const isValid = name.trim() && endChannel <= 512;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{fixture ? 'Edit Fixture' : 'Add Fixture'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10"><X size={18} className="text-white/60" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Fixture Type</label>
            <div className="grid grid-cols-4 gap-2">
              {FIXTURE_LIBRARY.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={`p-2 rounded-lg text-xs text-center transition-all ${type === t.id ? 'bg-[var(--accent)] text-black font-bold' : 'bg-white/10 text-white/70'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Front Wash 1"
              className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/10 focus:border-[var(--accent)] outline-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Universe</label>
              <select value={universe} onChange={e => setUniverse(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/10">
                {[1,2,3,4].map(u => <option key={u} value={u}>U{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Start Ch</label>
              <input type="number" min="1" max="512" value={startChannel} onChange={e => setStartChannel(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/10" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Channels</label>
              <input type="number" min="1" max="512" value={channelCount} onChange={e => setChannelCount(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/10" />
            </div>
          </div>

          <div className={`p-2 rounded-lg text-center text-sm ${endChannel > 512 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/50'}`}>
            Address Range: {startChannel} - {endChannel} {endChannel > 512 && '(exceeds 512!)'}
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Output Node</label>
            <select value={nodeId} onChange={e => setNodeId(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/10">
              <option value="">Auto (any node in universe)</option>
              {nodes.filter(n => n.is_paired).map(n => (
                <option key={n.node_id} value={n.node_id}>{n.name} ({n.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 p-3 rounded-xl bg-white/10 text-white/60 font-semibold">Cancel</button>
          <button onClick={handleSave} disabled={!isValid}
            className="flex-1 p-3 rounded-xl bg-[var(--accent)] text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group, fixtures, onEdit, onDelete }) {
  const groupFixtures = fixtures.filter(f => group.fixture_ids?.includes(f.fixture_id));
  
  return (
    <div className="p-3 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: group.color || '#8b5cf6' }}>
          <Layers size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white">{group.name}</div>
          <div className="text-xs text-white/50">{groupFixtures.length} fixtures</div>
        </div>
        <button onClick={() => onEdit(group)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
          <Edit2 size={14} className="text-white/60" />
        </button>
        <button onClick={() => onDelete(group.id)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
      {groupFixtures.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {groupFixtures.map(f => (
            <span key={f.fixture_id} className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/70">{f.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupModal({ group, fixtures, onSave, onClose }) {
  const [name, setName] = useState(group?.name || '');
  const [selectedIds, setSelectedIds] = useState(group?.fixture_ids || []);
  const [color, setColor] = useState(group?.color || '#8b5cf6');

  const toggleFixture = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: group?.id || Date.now().toString(), name: name.trim(), fixture_ids: selectedIds, color });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{group ? 'Edit Group' : 'Create Group'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10"><X size={18} className="text-white/60" /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Group Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Front Wash"
              className="w-full p-3 rounded-xl bg-white/10 text-white border border-white/10 focus:border-[var(--accent)] outline-none" />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-2 block">Select Fixtures ({selectedIds.length})</label>
            <div className="space-y-2 max-h-48 overflow-auto">
              {fixtures.length === 0 ? (
                <div className="text-center text-white/30 py-4">No fixtures patched yet</div>
              ) : fixtures.map(f => (
                <button key={f.fixture_id} onClick={() => toggleFixture(f.fixture_id)}
                  className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all ${selectedIds.includes(f.fixture_id) ? 'bg-[var(--accent)]/20 border border-[var(--accent)]' : 'bg-white/5 border border-white/10'}`}>
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: f.color }}>{f.name.charAt(0)}</div>
                  <span className="text-white text-sm flex-1 text-left">{f.name}</span>
                  {selectedIds.includes(f.fixture_id) && <Check size={14} className="text-[var(--accent)]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 p-3 rounded-xl bg-white/10 text-white/60 font-semibold">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 p-3 rounded-xl bg-[var(--accent)] text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Fixtures() {
  const navigate = useNavigate();
  const { fixtures, fetchFixtures, addFixture, updateFixture, removeFixture } = useFixtureStore();
  const { nodes } = useNodeStore();
  
  const [activeTab, setActiveTab] = useState('patch');
  const [showFixtureModal, setShowFixtureModal] = useState(false);
  const [editingFixture, setEditingFixture] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedUniverse, setSelectedUniverse] = useState(1);
  
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('aether-fixture-groups-v2');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { fetchFixtures(); }, []);
  useEffect(() => { localStorage.setItem('aether-fixture-groups-v2', JSON.stringify(groups)); }, [groups]);

  const universeFixtures = useMemo(() => fixtures.filter(f => f.universe === selectedUniverse), [fixtures, selectedUniverse]);
  
  const conflicts = useMemo(() => {
    const c = new Set();
    const used = {};
    universeFixtures.forEach(f => {
      for (let ch = f.start_channel; ch < f.start_channel + f.channel_count; ch++) {
        if (used[ch]) { c.add(ch); c.add(f.fixture_id); c.add(used[ch]); }
        used[ch] = f.fixture_id;
      }
    });
    return c;
  }, [universeFixtures]);

  const handleSaveFixture = async (data) => {
    if (data.fixture_id) await updateFixture(data.fixture_id, data);
    else await addFixture(data);
    setShowFixtureModal(false);
    setEditingFixture(null);
  };

  const handleSaveGroup = (data) => {
    setGroups(prev => {
      const exists = prev.find(g => g.id === data.id);
      if (exists) return prev.map(g => g.id === data.id ? data : g);
      return [...prev, data];
    });
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/10"><ArrowLeft size={18} className="text-white" /></button>
        <h1 className="text-lg font-bold text-white flex-1">Fixtures & Groups</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: 'patch', label: 'Patch', icon: Hash },
          { id: 'groups', label: 'Groups', icon: Layers },
          { id: 'nodes', label: 'Nodes', icon: Cpu },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-3 flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white/10 text-white border-b-2 border-[var(--accent)]' : 'text-white/50'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'patch' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1,2,3].map(u => (
                  <button key={u} onClick={() => setSelectedUniverse(u)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${selectedUniverse === u ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/60'}`}>
                    U{u}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <button onClick={() => { setEditingFixture(null); setShowFixtureModal(true); }}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-bold flex items-center gap-2">
                <Plus size={16} /> Add Fixture
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-2">Universe {selectedUniverse} Address Map</div>
              <AddressGrid fixtures={universeFixtures} universe={selectedUniverse} conflicts={conflicts}
                onSelect={(f) => { setEditingFixture(f); setShowFixtureModal(true); }} />
            </div>

            <div className="space-y-2">
              {universeFixtures.map(f => (
                <FixtureCard key={f.fixture_id} fixture={f} nodes={nodes} isConflict={conflicts.has(f.fixture_id)}
                  onEdit={(f) => { setEditingFixture(f); setShowFixtureModal(true); }}
                  onDelete={(id) => { if (confirm('Delete fixture?')) removeFixture(id); }} />
              ))}
              {universeFixtures.length === 0 && (
                <div className="text-center text-white/30 py-8">No fixtures in Universe {selectedUniverse}</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setEditingGroup(null); setShowGroupModal(true); }}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-black font-bold flex items-center gap-2">
                <Plus size={16} /> Create Group
              </button>
            </div>
            <div className="space-y-2">
              {groups.map(g => (
                <GroupCard key={g.id} group={g} fixtures={fixtures}
                  onEdit={(g) => { setEditingGroup(g); setShowGroupModal(true); }}
                  onDelete={(id) => { if (confirm('Delete group?')) setGroups(prev => prev.filter(g => g.id !== id)); }} />
              ))}
              {groups.length === 0 && (
                <div className="text-center text-white/30 py-8">No groups created yet</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="space-y-2">
            {nodes.filter(n => n.is_paired).map(n => (
              <div key={n.node_id} className="p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${n.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{n.name}</div>
                    <div className="text-xs text-white/50">U{n.universe} • Ch {n.channel_start}-{n.channel_end}</div>
                  </div>
                  <div className="text-xs text-white/30">{n.ip}</div>
                </div>
                <div className="mt-2 text-xs text-white/40">
                  Fixtures: {fixtures.filter(f => f.node_id === n.node_id || (f.universe === n.universe && !f.node_id)).map(f => f.name).join(', ') || 'None assigned'}
                </div>
              </div>
            ))}
            {nodes.filter(n => n.is_paired).length === 0 && (
              <div className="text-center text-white/30 py-8">No paired nodes</div>
            )}
          </div>
        )}
      </div>

      {showFixtureModal && <FixtureModal fixture={editingFixture} nodes={nodes} onSave={handleSaveFixture} onClose={() => { setShowFixtureModal(false); setEditingFixture(null); }} />}
      {showGroupModal && <GroupModal group={editingGroup} fixtures={fixtures} onSave={handleSaveGroup} onClose={() => { setShowGroupModal(false); setEditingGroup(null); }} />}
    </div>
  );
}
