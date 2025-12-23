import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, X, Layers, Lightbulb, Cpu, AlertTriangle, Wifi, WifiOff, Save, ChevronRight } from 'lucide-react';
import useFixtureStore from '../store/fixtureStore';
import useNodeStore from '../store/nodeStore';
import { useKeyboard } from '../context/KeyboardContext';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3000`;

// Common fixture presets - these match real-world fixtures
const FIXTURE_PRESETS = [
  { id: 'dimmer-1ch', name: 'Dimmer (1ch)', channels: 1, icon: '💡', description: 'Single channel dimmer' },
  { id: 'rgb-3ch', name: 'RGB Light (3ch)', channels: 3, icon: '🔴🟢🔵', description: 'Red, Green, Blue' },
  { id: 'rgbw-4ch', name: 'RGBW Light (4ch)', channels: 4, icon: '🌈', description: 'RGB + White' },
  { id: 'par-7ch', name: 'LED PAR (7ch)', channels: 7, icon: '🎭', description: 'Dim, RGB, Strobe, Mode, Speed' },
  { id: 'moving-16ch', name: 'Moving Head (16ch)', channels: 16, icon: '🔦', description: 'Pan, Tilt, Color, Gobo, etc.' },
  { id: 'custom', name: 'Custom', channels: 1, icon: '⚙️', description: 'Define your own' },
];

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

// Simplified fixture card showing what matters
function FixtureCard({ fixture, onEdit, isConflict }) {
  return (
    <div
      onClick={() => onEdit(fixture)}
      className={`p-4 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
        isConflict ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg"
          style={{ background: fixture.color || '#8b5cf6' }}
        >
          {fixture.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-base truncate">{fixture.name}</div>
          <div className="text-sm text-white/50 mt-0.5">
            Universe {fixture.universe} • Channel {fixture.start_channel}
            {fixture.channel_count > 1 && `-${fixture.start_channel + fixture.channel_count - 1}`}
          </div>
        </div>
        {isConflict && <AlertTriangle size={20} className="text-red-400 shrink-0" />}
        <ChevronRight size={20} className="text-white/30 shrink-0" />
      </div>
    </div>
  );
}

// Add/Edit fixture modal - simplified and guided
function FixtureEditor({ fixture, onSave, onClose, onDelete, existingFixtures }) {
  const { openKeyboard } = useKeyboard();
  const isEditing = !!fixture?.fixture_id;

  const [name, setName] = useState(fixture?.name || '');
  const [preset, setPreset] = useState(fixture?.type || 'rgb-3ch');
  const [universe, setUniverse] = useState(fixture?.universe || 1);
  const [startChannel, setStartChannel] = useState(fixture?.start_channel || 1);
  const [channelCount, setChannelCount] = useState(fixture?.channel_count || 3);
  const [color, setColor] = useState(fixture?.color || COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState(isEditing ? 2 : 1); // Step 1: Choose type, Step 2: Configure

  const selectedPreset = FIXTURE_PRESETS.find(p => p.id === preset);

  // When preset changes, update channel count
  useEffect(() => {
    if (selectedPreset && preset !== 'custom') {
      setChannelCount(selectedPreset.channels);
    }
  }, [preset, selectedPreset]);

  // Auto-assign: find next free slot
  const findNextFreeSlot = (univ, chCount, count = 1) => {
    const univFixtures = existingFixtures.filter(f => f.universe === univ && f.fixture_id !== fixture?.fixture_id);
    const occupied = new Set();
    univFixtures.forEach(f => {
      for (let ch = f.start_channel; ch < f.start_channel + f.channel_count; ch++) {
        occupied.add(ch);
      }
    });

    const slots = [];
    let ch = 1;
    while (slots.length < count && ch <= 512) {
      let fits = true;
      for (let i = 0; i < chCount; i++) {
        if (occupied.has(ch + i) || ch + i > 512) {
          fits = false;
          break;
        }
      }
      if (fits) {
        slots.push(ch);
        for (let i = 0; i < chCount; i++) occupied.add(ch + i);
        ch += chCount;
      } else {
        ch++;
      }
    }
    return slots;
  };

  // Auto-set start channel when universe or channel count changes
  useEffect(() => {
    if (!isEditing) {
      const slots = findNextFreeSlot(universe, channelCount, 1);
      if (slots.length > 0) setStartChannel(slots[0]);
    }
  }, [universe, channelCount, isEditing]);

  const endChannel = startChannel + channelCount - 1;
  const freeSlots = findNextFreeSlot(universe, channelCount, quantity);
  const canFitAll = freeSlots.length >= quantity;
  const isValid = name.trim() && endChannel <= 512 && (quantity === 1 || canFitAll);

  const handleSave = () => {
    if (!isValid) return;

    if (quantity > 1 && !isEditing) {
      // Bulk add
      const fixtures = freeSlots.slice(0, quantity).map((slot, idx) => ({
        name: `${name.trim()} ${idx + 1}`,
        type: preset,
        universe,
        start_channel: slot,
        channel_count: channelCount,
        color,
      }));
      onSave(fixtures, true);
    } else {
      onSave({
        fixture_id: fixture?.fixture_id,
        name: name.trim(),
        type: preset,
        universe,
        start_channel: startChannel,
        channel_count: channelCount,
        color,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#12121a] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-auto border border-white/10" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#12121a] p-4 border-b border-white/10 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Edit Fixture' : step === 1 ? 'What type of light?' : 'Configure Fixture'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Step 1: Choose fixture type */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-white/60 text-sm">Select the type of fixture you're adding:</p>
              {FIXTURE_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPreset(p.id); setStep(2); }}
                  className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center gap-4 text-left"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-sm text-white/50">{p.description}</div>
                  </div>
                  <ChevronRight size={20} className="text-white/30" />
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && (
            <>
              {/* Name */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Fixture Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={e => {
                    e.target.blur();
                    openKeyboard(name, setName, 'text');
                  }}
                  placeholder="e.g., Front Wash, Stage Left PAR"
                  className="w-full p-4 rounded-xl bg-white/10 text-white text-lg border border-white/10 focus:border-[var(--accent)] outline-none"
                />
              </div>

              {/* Quantity (only for new fixtures) */}
              {!isEditing && (
                <div>
                  <label className="text-sm text-white/60 mb-2 block">How many?</label>
                  <div className="flex gap-2">
                    {[1, 2, 4, 6, 8].map(n => (
                      <button
                        key={n}
                        onClick={() => setQuantity(n)}
                        className={`flex-1 p-3 rounded-xl font-bold transition-all ${
                          quantity === n
                            ? 'bg-[var(--accent)] text-black'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Universe & Channel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Universe</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(u => (
                      <button
                        key={u}
                        onClick={() => setUniverse(u)}
                        className={`flex-1 p-3 rounded-xl font-bold transition-all ${
                          universe === u
                            ? 'bg-[var(--accent)] text-black'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Start Channel</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={startChannel}
                    onChange={e => setStartChannel(Math.max(1, Math.min(512, Number(e.target.value) || 1)))}
                    onFocus={e => {
                      e.target.blur();
                      openKeyboard(String(startChannel), v => setStartChannel(Math.max(1, Math.min(512, Number(v) || 1))), 'number');
                    }}
                    className="w-full p-3 rounded-xl bg-white/10 text-white text-center text-lg font-bold border border-white/10"
                  />
                </div>
              </div>

              {/* Channel count (only for custom) */}
              {preset === 'custom' && (
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Number of Channels</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={channelCount}
                    onChange={e => setChannelCount(Math.max(1, Math.min(512, Number(e.target.value) || 1)))}
                    onFocus={e => {
                      e.target.blur();
                      openKeyboard(String(channelCount), v => setChannelCount(Math.max(1, Math.min(512, Number(v) || 1))), 'number');
                    }}
                    className="w-full p-3 rounded-xl bg-white/10 text-white text-center text-lg font-bold border border-white/10"
                  />
                </div>
              )}

              {/* Summary */}
              <div className={`p-4 rounded-xl ${endChannel > 512 || !canFitAll ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 border border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Channel Range:</span>
                  <span className="font-bold text-white">
                    {quantity > 1 ? `${quantity} fixtures, ${channelCount} ch each` : `${startChannel} - ${endChannel}`}
                  </span>
                </div>
                {(endChannel > 512 || !canFitAll) && (
                  <div className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {endChannel > 512 ? 'Exceeds 512 channels' : `Not enough space for ${quantity} fixtures`}
                  </div>
                )}
              </div>

              {/* Color picker */}
              <div>
                <label className="text-sm text-white/60 mb-2 block">Color Tag</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#12121a] scale-110' : ''
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#12121a] p-4 border-t border-white/10 flex gap-3">
          {step === 2 && !isEditing && (
            <button onClick={() => setStep(1)} className="p-4 rounded-xl bg-white/10 text-white/60 font-semibold">
              <ArrowLeft size={20} />
            </button>
          )}
          {isEditing && onDelete && (
            <button
              onClick={() => onDelete(fixture.fixture_id)}
              className="p-4 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={onClose} className="flex-1 p-4 rounded-xl bg-white/10 text-white/60 font-semibold">
            Cancel
          </button>
          {step === 2 && (
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex-1 p-4 rounded-xl bg-[var(--accent)] text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {quantity > 1 ? `Add ${quantity} Fixtures` : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Group card
function GroupCard({ group, fixtures, onEdit }) {
  const groupFixtures = fixtures.filter(f => group.fixture_ids?.includes(f.fixture_id));

  return (
    <div
      onClick={() => onEdit(group)}
      className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: group.color || '#8b5cf6' }}>
          <Layers size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white">{group.name}</div>
          <div className="text-sm text-white/50">{groupFixtures.length} fixtures</div>
        </div>
        <ChevronRight size={20} className="text-white/30" />
      </div>
      {groupFixtures.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {groupFixtures.slice(0, 5).map(f => (
            <span key={f.fixture_id} className="px-2 py-1 rounded-lg text-xs bg-white/10 text-white/70">{f.name}</span>
          ))}
          {groupFixtures.length > 5 && (
            <span className="px-2 py-1 rounded-lg text-xs bg-white/10 text-white/50">+{groupFixtures.length - 5} more</span>
          )}
        </div>
      )}
    </div>
  );
}

// Group editor modal
function GroupEditor({ group, fixtures, onSave, onClose, onDelete }) {
  const { openKeyboard } = useKeyboard();
  const isEditing = !!group?.id;

  const [name, setName] = useState(group?.name || '');
  const [selectedIds, setSelectedIds] = useState(group?.fixture_ids || []);
  const [color, setColor] = useState(group?.color || COLORS[0]);

  const toggleFixture = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: group?.id, name: name.trim(), fixture_ids: selectedIds, color });
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#12121a] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-auto border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#12121a] p-4 border-b border-white/10 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">{isEditing ? 'Edit Group' : 'Create Group'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10"><X size={20} className="text-white" /></button>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <label className="text-sm text-white/60 mb-2 block">Group Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => {
                e.target.blur();
                openKeyboard(name, setName, 'text');
              }}
              placeholder="e.g., Front Wash, Back Lights"
              className="w-full p-4 rounded-xl bg-white/10 text-white text-lg border border-white/10"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#12121a] scale-110' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">Select Fixtures ({selectedIds.length} selected)</label>
            <div className="space-y-2 max-h-60 overflow-auto">
              {fixtures.length === 0 ? (
                <div className="text-center text-white/30 py-8">No fixtures patched yet</div>
              ) : (
                fixtures.map(f => (
                  <button
                    key={f.fixture_id}
                    onClick={() => toggleFixture(f.fixture_id)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                      selectedIds.includes(f.fixture_id)
                        ? 'bg-[var(--accent)]/20 border-2 border-[var(--accent)]'
                        : 'bg-white/5 border-2 border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: f.color }}>
                      {f.name.charAt(0)}
                    </div>
                    <span className="text-white flex-1 text-left">{f.name}</span>
                    {selectedIds.includes(f.fixture_id) && <Check size={18} className="text-[var(--accent)]" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#12121a] p-4 border-t border-white/10 flex gap-3">
          {isEditing && onDelete && (
            <button onClick={() => onDelete(group.id)} className="p-4 rounded-xl bg-red-500/20 text-red-400">
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={onClose} className="flex-1 p-4 rounded-xl bg-white/10 text-white/60 font-semibold">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 p-4 rounded-xl bg-[var(--accent)] text-black font-bold disabled:opacity-50">
            <Save size={18} className="inline mr-2" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Node card with utilization
function NodeCard({ node, fixtures }) {
  const nodeFixtures = fixtures.filter(f => f.node_id === node.node_id || (f.universe === node.universe && !f.node_id));
  const channelStart = node.channel_start || 1;
  const channelEnd = node.channel_end || 512;
  const totalChannels = channelEnd - channelStart + 1;

  let usedChannels = 0;
  nodeFixtures.forEach(f => {
    const fStart = Math.max(f.start_channel, channelStart);
    const fEnd = Math.min(f.start_channel + f.channel_count - 1, channelEnd);
    if (fEnd >= fStart) usedChannels += fEnd - fStart + 1;
  });

  const utilization = totalChannels > 0 ? (usedChannels / totalChannels) * 100 : 0;
  const barColor = utilization > 90 ? '#ef4444' : utilization > 70 ? '#eab308' : '#22c55e';

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-3 h-3 rounded-full ${node.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <div className="flex-1">
          <div className="font-semibold text-white">{node.name}</div>
          <div className="text-sm text-white/50">Universe {node.universe} • Ch {channelStart}-{channelEnd}</div>
        </div>
        {node.status === 'online' ? <Wifi size={18} className="text-green-400" /> : <WifiOff size={18} className="text-red-400" />}
      </div>

      <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${utilization}%`, background: barColor }} />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-white/50">{usedChannels} / {totalChannels} channels</span>
        <span style={{ color: barColor }}>{utilization.toFixed(0)}%</span>
      </div>

      {nodeFixtures.length > 0 && (
        <div className="mt-3 text-sm text-white/40">
          {nodeFixtures.map(f => f.name).join(', ')}
        </div>
      )}
    </div>
  );
}

// Confirm modal
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4" onClick={onCancel}>
      <div className="bg-[#12121a] rounded-2xl w-full max-w-sm border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        <div className="p-4">
          <p className="text-white/70">{message}</p>
        </div>
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button onClick={onCancel} className="flex-1 p-4 rounded-xl bg-white/10 text-white/60 font-semibold">Cancel</button>
          <button onClick={onConfirm} className="flex-1 p-4 rounded-xl bg-red-500 text-white font-bold">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function Fixtures() {
  const navigate = useNavigate();
  const { fixtures, fetchFixtures, addFixture, updateFixture, removeFixture } = useFixtureStore();
  const { nodes } = useNodeStore();

  const [activeTab, setActiveTab] = useState('fixtures');
  const [showEditor, setShowEditor] = useState(false);
  const [editingFixture, setEditingFixture] = useState(null);
  const [showGroupEditor, setShowGroupEditor] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [groups, setGroups] = useState([]);

  // Load fixtures and groups
  useEffect(() => { fetchFixtures(); }, [fetchFixtures]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/groups`);
        setGroups(res.data || []);
      } catch (e) {
        const saved = localStorage.getItem('aether-fixture-groups-v2');
        if (saved) setGroups(JSON.parse(saved));
      }
    };
    loadGroups();
  }, []);

  // Check for conflicts
  const conflicts = useMemo(() => {
    const c = new Set();
    const universes = {};
    fixtures.forEach(f => {
      if (!universes[f.universe]) universes[f.universe] = {};
      for (let ch = f.start_channel; ch < f.start_channel + f.channel_count; ch++) {
        if (universes[f.universe][ch]) {
          c.add(f.fixture_id);
          c.add(universes[f.universe][ch]);
        }
        universes[f.universe][ch] = f.fixture_id;
      }
    });
    return c;
  }, [fixtures]);

  const handleSaveFixture = async (data, isBulk = false) => {
    if (isBulk && Array.isArray(data)) {
      for (const f of data) await addFixture(f);
    } else if (data.fixture_id) {
      await updateFixture(data.fixture_id, data);
    } else {
      await addFixture(data);
    }
    setShowEditor(false);
    setEditingFixture(null);
  };

  const handleDeleteFixture = async (id) => {
    await removeFixture(id);
    setConfirmDelete(null);
    setShowEditor(false);
    setEditingFixture(null);
  };

  const handleSaveGroup = async (data) => {
    try {
      if (data.id && groups.some(g => g.id === data.id)) {
        await axios.put(`${API_BASE}/api/groups/${data.id}`, data);
      } else {
        const res = await axios.post(`${API_BASE}/api/groups`, data);
        data.id = res.data.id;
      }
      setGroups(prev => {
        const exists = prev.find(g => g.id === data.id);
        if (exists) return prev.map(g => g.id === data.id ? data : g);
        return [...prev, data];
      });
    } catch (e) {
      console.error('Failed to save group:', e);
    }
    setShowGroupEditor(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/groups/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (e) {
      console.error('Failed to delete group:', e);
    }
    setConfirmDelete(null);
    setShowGroupEditor(false);
    setEditingGroup(null);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-white/10 shrink-0">
        <button onClick={() => navigate(-1)} className="p-3 rounded-xl bg-white/10 active:scale-95">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">Lighting Setup</h1>
        {conflicts.size > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm">
            <AlertTriangle size={16} /> {conflicts.size} conflicts
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 shrink-0">
        {[
          { id: 'fixtures', label: 'Fixtures', icon: Lightbulb, count: fixtures.length },
          { id: 'groups', label: 'Groups', icon: Layers, count: groups.length },
          { id: 'nodes', label: 'Nodes', icon: Cpu, count: nodes.filter(n => n.is_paired || n.is_builtin).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-4 flex items-center justify-center gap-2 transition-all ${
              activeTab === tab.id ? 'bg-white/10 text-white border-b-2 border-[var(--accent)]' : 'text-white/50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'fixtures' && (
          <div className="space-y-3">
            {fixtures.length === 0 ? (
              <div className="text-center py-16">
                <Lightbulb size={48} className="mx-auto text-white/20 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Fixtures Yet</h3>
                <p className="text-white/50 mb-6">Add your first light fixture to get started</p>
                <button
                  onClick={() => { setEditingFixture(null); setShowEditor(true); }}
                  className="px-6 py-3 rounded-xl bg-[var(--accent)] text-black font-bold inline-flex items-center gap-2"
                >
                  <Plus size={20} /> Add First Fixture
                </button>
              </div>
            ) : (
              <>
                {fixtures.map(f => (
                  <FixtureCard
                    key={f.fixture_id}
                    fixture={f}
                    onEdit={f => { setEditingFixture(f); setShowEditor(true); }}
                    isConflict={conflicts.has(f.fixture_id)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-3">
            {groups.length === 0 ? (
              <div className="text-center py-16">
                <Layers size={48} className="mx-auto text-white/20 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Groups Yet</h3>
                <p className="text-white/50 mb-6">Groups let you control multiple fixtures together</p>
                <button
                  onClick={() => { setEditingGroup(null); setShowGroupEditor(true); }}
                  className="px-6 py-3 rounded-xl bg-[var(--accent)] text-black font-bold inline-flex items-center gap-2"
                >
                  <Plus size={20} /> Create First Group
                </button>
              </div>
            ) : (
              groups.map(g => (
                <GroupCard
                  key={g.id}
                  group={g}
                  fixtures={fixtures}
                  onEdit={g => { setEditingGroup(g); setShowGroupEditor(true); }}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'nodes' && (
          <div className="space-y-3">
            {nodes.filter(n => n.is_paired || n.is_builtin).length === 0 ? (
              <div className="text-center py-16">
                <Cpu size={48} className="mx-auto text-white/20 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Nodes Connected</h3>
                <p className="text-white/50">Nodes send DMX signals to your fixtures</p>
              </div>
            ) : (
              nodes.filter(n => n.is_paired || n.is_builtin).map(n => (
                <NodeCard key={n.node_id} node={n} fixtures={fixtures} />
              ))
            )}
          </div>
        )}
      </div>

      {/* FAB - Add button */}
      {((activeTab === 'fixtures' && fixtures.length > 0) || (activeTab === 'groups' && groups.length > 0)) && (
        <button
          onClick={() => {
            if (activeTab === 'fixtures') { setEditingFixture(null); setShowEditor(true); }
            else { setEditingGroup(null); setShowGroupEditor(true); }
          }}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-[var(--accent)] text-black shadow-xl flex items-center justify-center active:scale-95 z-40"
          style={{ boxShadow: '0 4px 20px rgba(var(--accent-rgb), 0.4)' }}
        >
          <Plus size={28} />
        </button>
      )}

      {/* Modals */}
      {showEditor && (
        <FixtureEditor
          fixture={editingFixture}
          existingFixtures={fixtures}
          onSave={handleSaveFixture}
          onClose={() => { setShowEditor(false); setEditingFixture(null); }}
          onDelete={id => setConfirmDelete({ type: 'fixture', id, name: editingFixture?.name })}
        />
      )}

      {showGroupEditor && (
        <GroupEditor
          group={editingGroup}
          fixtures={fixtures}
          onSave={handleSaveGroup}
          onClose={() => { setShowGroupEditor(false); setEditingGroup(null); }}
          onDelete={id => setConfirmDelete({ type: 'group', id, name: editingGroup?.name })}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${confirmDelete.type === 'fixture' ? 'Fixture' : 'Group'}?`}
          message={`Are you sure you want to delete "${confirmDelete.name}"?`}
          onConfirm={() => confirmDelete.type === 'fixture' ? handleDeleteFixture(confirmDelete.id) : handleDeleteGroup(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
