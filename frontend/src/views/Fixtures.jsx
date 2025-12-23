import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, X, Layers, Lightbulb, Cpu, AlertTriangle, Wifi, WifiOff, Save, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useFixtureStore } from '../store/fixtureStore';
import useNodeStore from '../store/nodeStore';
import { useKeyboard } from '../context/KeyboardContext';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3000`;

// Safe array helper - ensures we always have an array
const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

const FIXTURE_PRESETS = [
  { id: 'dimmer-1ch', name: 'Dimmer', channels: 1, icon: '💡' },
  { id: 'rgb-3ch', name: 'RGB', channels: 3, icon: '🔴' },
  { id: 'rgbw-4ch', name: 'RGBW', channels: 4, icon: '🌈' },
  { id: 'par-7ch', name: 'PAR', channels: 7, icon: '🎭' },
  { id: 'moving-16ch', name: 'Mover', channels: 16, icon: '🔦' },
  { id: 'custom', name: 'Custom', channels: 1, icon: '⚙️' },
];

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

// Compact fixture tile for grid
function FixtureTile({ fixture, onTap, isConflict }) {
  return (
    <button
      onClick={() => onTap(fixture)}
      className={`p-2 rounded-xl border transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${
        isConflict ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/5'
      }`}
      style={{ minHeight: '70px' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
        style={{ background: fixture.color || '#8b5cf6' }}
      >
        {fixture.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="text-xs text-white truncate w-full text-center px-1">{fixture.name}</div>
      <div className="text-[10px] text-white/40">U{fixture.universe} Ch{fixture.start_channel}</div>
    </button>
  );
}

// Compact group tile
function GroupTile({ group, count, onTap }) {
  return (
    <button
      onClick={() => onTap(group)}
      className="p-2 rounded-xl border border-white/10 bg-white/5 transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
      style={{ minHeight: '70px' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: group.color || '#8b5cf6' }}>
        <Layers size={16} className="text-white" />
      </div>
      <div className="text-xs text-white truncate w-full text-center px-1">{group.name}</div>
      <div className="text-[10px] text-white/40">{count} fixtures</div>
    </button>
  );
}

// Compact node tile
function NodeTile({ node, fixtures }) {
  const safeFixtures = safeArray(fixtures);
  const nodeFixtures = safeFixtures.filter(f => f.node_id === node.node_id || (f.universe === node.universe && !f.node_id));
  const utilization = nodeFixtures.length > 0 ? Math.min(100, (nodeFixtures.reduce((sum, f) => sum + (f.channel_count || 0), 0) / 512) * 100) : 0;
  const barColor = utilization > 90 ? '#ef4444' : utilization > 70 ? '#eab308' : '#22c55e';

  return (
    <div className="p-2 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1" style={{ minHeight: '70px' }}>
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-white font-medium">{node.name}</span>
      </div>
      <div className="text-[10px] text-white/40">U{node.universe}</div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${utilization}%`, background: barColor }} />
      </div>
    </div>
  );
}

// Add/Edit fixture modal - compact for 800x480
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

  const selectedPreset = FIXTURE_PRESETS.find(p => p.id === preset);

  useEffect(() => {
    if (selectedPreset && preset !== 'custom') {
      setChannelCount(selectedPreset.channels);
    }
  }, [preset, selectedPreset]);

  const findNextFreeSlot = (univ, chCount, count = 1) => {
    const univFixtures = existingFixtures.filter(f => f.universe === univ && f.fixture_id !== fixture?.fixture_id);
    const occupied = new Set();
    univFixtures.forEach(f => {
      for (let ch = f.start_channel; ch < f.start_channel + f.channel_count; ch++) occupied.add(ch);
    });
    const slots = [];
    let ch = 1;
    while (slots.length < count && ch <= 512) {
      let fits = true;
      for (let i = 0; i < chCount; i++) {
        if (occupied.has(ch + i) || ch + i > 512) { fits = false; break; }
      }
      if (fits) {
        slots.push(ch);
        for (let i = 0; i < chCount; i++) occupied.add(ch + i);
        ch += chCount;
      } else ch++;
    }
    return slots;
  };

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
      const fixtures = freeSlots.slice(0, quantity).map((slot, idx) => ({
        name: `${name.trim()} ${idx + 1}`, type: preset, universe, start_channel: slot, channel_count: channelCount, color,
      }));
      onSave(fixtures, true);
    } else {
      onSave({ fixture_id: fixture?.fixture_id, name: name.trim(), type: preset, universe, start_channel: startChannel, channel_count: channelCount, color });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#0d0d12] rounded-2xl w-[95%] max-w-[700px] border border-white/10" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{isEditing ? 'Edit Fixture' : 'Add Fixture'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10"><X size={18} className="text-white" /></button>
        </div>

        {/* Body - 2 column layout */}
        <div className="p-3 grid grid-cols-2 gap-3">
          {/* Left column */}
          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="text-[11px] text-white/50 mb-1 block">NAME</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={e => { e.target.blur(); openKeyboard(name, setName, 'text'); }}
                placeholder="e.g., Front Wash"
                className="w-full p-2 rounded-lg bg-white/10 text-white text-sm border border-white/10"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-[11px] text-white/50 mb-1 block">TYPE</label>
              <div className="grid grid-cols-3 gap-1">
                {FIXTURE_PRESETS.map(p => (
                  <button key={p.id} onClick={() => setPreset(p.id)}
                    className={`p-2 rounded-lg text-center transition-all ${preset === p.id ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/70'}`}>
                    <span className="text-base">{p.icon}</span>
                    <div className="text-[10px] mt-0.5">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            {!isEditing && (
              <div>
                <label className="text-[11px] text-white/50 mb-1 block">QTY</label>
                <div className="flex gap-1">
                  {[1, 2, 4, 8].map(n => (
                    <button key={n} onClick={() => setQuantity(n)}
                      className={`flex-1 p-2 rounded-lg text-sm font-bold ${quantity === n ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/70'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-3">
            {/* Universe + Channel */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-white/50 mb-1 block">UNIVERSE</label>
                <div className="flex gap-1">
                  {[1, 2, 3].map(u => (
                    <button key={u} onClick={() => setUniverse(u)}
                      className={`flex-1 p-2 rounded-lg text-sm font-bold ${universe === u ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/70'}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-white/50 mb-1 block">START CH</label>
                <input type="text" inputMode="numeric" value={startChannel}
                  onChange={e => setStartChannel(Math.max(1, Math.min(512, Number(e.target.value) || 1)))}
                  onFocus={e => { e.target.blur(); openKeyboard(String(startChannel), v => setStartChannel(Math.max(1, Math.min(512, Number(v) || 1))), 'number'); }}
                  className="w-full p-2 rounded-lg bg-white/10 text-white text-center text-sm font-bold border border-white/10" />
              </div>
            </div>

            {/* Channels (custom only) */}
            {preset === 'custom' && (
              <div>
                <label className="text-[11px] text-white/50 mb-1 block">CHANNELS</label>
                <input type="text" inputMode="numeric" value={channelCount}
                  onChange={e => setChannelCount(Math.max(1, Math.min(512, Number(e.target.value) || 1)))}
                  onFocus={e => { e.target.blur(); openKeyboard(String(channelCount), v => setChannelCount(Math.max(1, Math.min(512, Number(v) || 1))), 'number'); }}
                  className="w-full p-2 rounded-lg bg-white/10 text-white text-center text-sm font-bold border border-white/10" />
              </div>
            )}

            {/* Color */}
            <div>
              <label className="text-[11px] text-white/50 mb-1 block">COLOR</label>
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-lg transition-all ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className={`p-2 rounded-lg text-xs ${endChannel > 512 || !canFitAll ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-white/60'}`}>
              {quantity > 1 ? `${quantity}x ${channelCount}ch = ${quantity * channelCount} channels` : `Ch ${startChannel}-${endChannel} (${channelCount}ch)`}
              {(endChannel > 512 || !canFitAll) && <span className="ml-2 text-red-400">Invalid!</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex gap-2">
          {isEditing && onDelete && (
            <button onClick={() => onDelete(fixture.fixture_id)} className="p-3 rounded-xl bg-red-500/20 text-red-400">
              <Trash2 size={18} />
            </button>
          )}
          <button onClick={onClose} className="flex-1 p-3 rounded-xl bg-white/10 text-white/60 font-semibold text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!isValid}
            className="flex-1 p-3 rounded-xl bg-[var(--accent)] text-black font-bold text-sm disabled:opacity-50">
            {quantity > 1 ? `Add ${quantity}` : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Group editor modal - compact
function GroupEditor({ group, fixtures, onSave, onClose, onDelete }) {
  const { openKeyboard } = useKeyboard();
  const isEditing = !!group?.id;
  const [name, setName] = useState(group?.name || '');
  const [selectedIds, setSelectedIds] = useState(safeArray(group?.fixture_ids));
  const [color, setColor] = useState(group?.color || COLORS[0]);
  const [page, setPage] = useState(0);
  const perPage = 8;

  // Defensive: ensure fixtures is always an array
  const safeFixtures = safeArray(fixtures);

  const toggleFixture = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSave = () => { if (name.trim()) onSave({ id: group?.id, name: name.trim(), fixture_ids: selectedIds, color }); };

  const pageFixtures = safeFixtures.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(safeFixtures.length / perPage);

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#0d0d12] rounded-2xl w-[95%] max-w-[500px] border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{isEditing ? 'Edit Group' : 'Create Group'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10"><X size={18} className="text-white" /></button>
        </div>

        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/50 mb-1 block">NAME</label>
              <input value={name} onChange={e => setName(e.target.value)}
                onFocus={e => { e.target.blur(); openKeyboard(name, setName, 'text'); }}
                className="w-full p-2 rounded-lg bg-white/10 text-white text-sm border border-white/10" />
            </div>
            <div>
              <label className="text-[11px] text-white/50 mb-1 block">COLOR</label>
              <div className="flex gap-1">
                {COLORS.slice(0, 6).map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-lg ${color === c ? 'ring-2 ring-white' : ''}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/50 mb-1 block">FIXTURES ({selectedIds.length} selected)</label>
            <div className="grid grid-cols-4 gap-1">
              {pageFixtures.map(f => f && (
                <button key={f.fixture_id || f.id} onClick={() => toggleFixture(f.fixture_id || f.id)}
                  className={`p-2 rounded-lg text-xs transition-all ${selectedIds.includes(f.fixture_id || f.id) ? 'bg-[var(--accent)]/30 border border-[var(--accent)]' : 'bg-white/5 border border-transparent'}`}>
                  <div className="w-5 h-5 rounded mx-auto mb-1" style={{ background: f.color || '#8b5cf6' }}>{(f.name || '?').charAt(0)}</div>
                  <div className="truncate">{f.name || 'Unknown'}</div>
                </button>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 rounded bg-white/10 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-xs text-white/50">{page + 1}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 rounded bg-white/10 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-white/10 flex gap-2">
          {isEditing && onDelete && <button onClick={() => onDelete(group.id)} className="p-3 rounded-xl bg-red-500/20 text-red-400"><Trash2 size={18} /></button>}
          <button onClick={onClose} className="flex-1 p-3 rounded-xl bg-white/10 text-white/60 font-semibold text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 p-3 rounded-xl bg-[var(--accent)] text-black font-bold text-sm disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}

// Confirm modal
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60]" onClick={onCancel}>
      <div className="bg-[#0d0d12] rounded-2xl w-80 border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10"><h2 className="text-lg font-bold text-white">{title}</h2></div>
        <div className="p-4"><p className="text-white/70 text-sm">{message}</p></div>
        <div className="p-3 border-t border-white/10 flex gap-2">
          <button onClick={onCancel} className="flex-1 p-3 rounded-xl bg-white/10 text-white/60 font-semibold">Cancel</button>
          <button onClick={onConfirm} className="flex-1 p-3 rounded-xl bg-red-500 text-white font-bold">Delete</button>
        </div>
      </div>
    </div>
  );
}

// Main component - grid with pagination, no scroll needed
export default function Fixtures() {
  const navigate = useNavigate();
  const { fixtures: rawFixtures, fetchFixtures, addFixture, updateFixture, removeFixture, loading: fixturesLoading } = useFixtureStore();
  const { nodes: rawNodes } = useNodeStore();

  // Defensive: ensure arrays
  const fixtures = safeArray(rawFixtures);
  const nodes = safeArray(rawNodes);

  const [activeTab, setActiveTab] = useState('fixtures');
  const [page, setPage] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [editingFixture, setEditingFixture] = useState(null);
  const [showGroupEditor, setShowGroupEditor] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState(null);

  // Grid config for 800x480 - fits without scrolling
  const ITEMS_PER_PAGE = 10; // 5 columns x 2 rows
  const COLS = 5;

  useEffect(() => { fetchFixtures(); }, [fetchFixtures]);

  useEffect(() => {
    const loadGroups = async () => {
      setGroupsLoading(true);
      setGroupsError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/groups`);
        // Validate response is an array
        const data = Array.isArray(res.data) ? res.data : [];
        // Validate each group has required fields
        const validGroups = data.filter(g => g && typeof g === 'object' && g.id && g.name).map(g => ({
          id: g.id,
          name: g.name || 'Unnamed',
          fixture_ids: Array.isArray(g.fixture_ids) ? g.fixture_ids : [],
          color: g.color || '#8b5cf6'
        }));
        setGroups(validGroups);
      } catch (e) {
        console.error('Failed to load groups:', e);
        setGroupsError(e.message);
        // Fallback to localStorage
        try {
          const saved = localStorage.getItem('aether-fixture-groups-v2');
          if (saved) {
            const parsed = JSON.parse(saved);
            setGroups(Array.isArray(parsed) ? parsed : []);
          }
        } catch {
          setGroups([]);
        }
      } finally {
        setGroupsLoading(false);
      }
    };
    loadGroups();
  }, []);

  // Reset page when tab changes
  useEffect(() => { setPage(0); }, [activeTab]);

  const conflicts = useMemo(() => {
    const c = new Set();
    const universes = {};
    fixtures.forEach(f => {
      if (!f || !f.universe || !f.start_channel) return;
      if (!universes[f.universe]) universes[f.universe] = {};
      const channelCount = f.channel_count || 1;
      for (let ch = f.start_channel; ch < f.start_channel + channelCount; ch++) {
        if (universes[f.universe][ch]) { c.add(f.fixture_id); c.add(universes[f.universe][ch]); }
        universes[f.universe][ch] = f.fixture_id;
      }
    });
    return c;
  }, [fixtures]);

  // Safe groups array
  const safeGroups = safeArray(groups);
  const safeNodes = nodes.filter(n => n && (n.is_paired || n.is_builtin));
  const currentItems = activeTab === 'fixtures' ? fixtures : activeTab === 'groups' ? safeGroups : safeNodes;
  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
  const pageItems = currentItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handleSaveFixture = async (data, isBulk = false) => {
    if (isBulk && Array.isArray(data)) { for (const f of data) await addFixture(f); }
    else if (data.fixture_id) await updateFixture(data.fixture_id, data);
    else await addFixture(data);
    setShowEditor(false);
    setEditingFixture(null);
  };

  const handleDeleteFixture = async (id) => { await removeFixture(id); setConfirmDelete(null); setShowEditor(false); setEditingFixture(null); };
  const handleSaveGroup = async (data) => {
    try {
      let savedGroup;
      const isUpdate = data.id && groups.some(g => g.id === data.id);

      if (isUpdate) {
        // Update existing group
        const res = await axios.put(`${API_BASE}/api/groups/${data.id}`, data);
        savedGroup = res.data;
      } else {
        // Create new group
        const res = await axios.post(`${API_BASE}/api/groups`, data);
        savedGroup = res.data;
      }

      // Ensure savedGroup has all required fields
      const validGroup = {
        id: savedGroup.id || data.id,
        name: savedGroup.name || data.name,
        fixture_ids: Array.isArray(savedGroup.fixture_ids) ? savedGroup.fixture_ids : (data.fixture_ids || []),
        color: savedGroup.color || data.color || '#8b5cf6'
      };

      // Update local state with the server response
      setGroups(prev => {
        const exists = prev.find(g => g.id === validGroup.id);
        if (exists) {
          return prev.map(g => g.id === validGroup.id ? validGroup : g);
        }
        return [...prev, validGroup];
      });

      console.log('✅ Group saved:', validGroup);
    } catch (e) {
      console.error('Failed to save group:', e);
      // Show error to user - don't silently fail
      alert('Failed to save group: ' + (e.response?.data?.error || e.message));
      return; // Don't close modal on error
    }
    setShowGroupEditor(false);
    setEditingGroup(null);
  };
  const handleDeleteGroup = async (id) => {
    try { await axios.delete(`${API_BASE}/api/groups/${id}`); setGroups(prev => prev.filter(g => g.id !== id)); }
    catch (e) { console.error('Failed to delete group:', e); }
    setConfirmDelete(null); setShowGroupEditor(false); setEditingGroup(null);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col">
      {/* Header - compact */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/10 active:scale-95">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-lg font-bold text-white flex-1">Lighting Setup</h1>
        {conflicts.size > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs">
            <AlertTriangle size={14} /> {conflicts.size}
          </div>
        )}
        <button
          onClick={() => {
            if (activeTab === 'fixtures') { setEditingFixture(null); setShowEditor(true); }
            else if (activeTab === 'groups') { setEditingGroup(null); setShowGroupEditor(true); }
          }}
          className={`p-2 rounded-lg bg-[var(--accent)] text-black ${activeTab === 'nodes' ? 'hidden' : ''}`}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Tabs - compact */}
      <div className="flex border-b border-white/10 shrink-0">
        {[
          { id: 'fixtures', label: 'Fixtures', icon: Lightbulb, count: fixtures.length },
          { id: 'groups', label: 'Groups', icon: Layers, count: safeGroups.length },
          { id: 'nodes', label: 'Nodes', icon: Cpu, count: safeNodes.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 flex items-center justify-center gap-1 text-sm transition-all ${
              activeTab === tab.id ? 'bg-white/10 text-white border-b-2 border-[var(--accent)]' : 'text-white/50'
            }`}>
            <tab.icon size={16} />
            {tab.label}
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content - grid, no scroll */}
      <div className="flex-1 p-3 flex flex-col">
        {/* Loading state for groups */}
        {activeTab === 'groups' && groupsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Loader2 size={40} className="text-white/40 mb-3 animate-spin" />
            <p className="text-white/50 text-sm">Loading groups...</p>
          </div>
        ) : activeTab === 'groups' && groupsError && safeGroups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={40} className="text-red-400/60 mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">Failed to load groups</h3>
            <p className="text-white/50 text-sm mb-4">{groupsError}</p>
            <button
              onClick={() => { setEditingGroup(null); setShowGroupEditor(true); }}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-bold text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Create New Group
            </button>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {activeTab === 'fixtures' && <Lightbulb size={40} className="text-white/20 mb-3" />}
            {activeTab === 'groups' && <Layers size={40} className="text-white/20 mb-3" />}
            {activeTab === 'nodes' && <Cpu size={40} className="text-white/20 mb-3" />}
            <h3 className="text-base font-semibold text-white mb-1">
              {activeTab === 'fixtures' ? 'No Fixtures' : activeTab === 'groups' ? 'No Groups' : 'No Nodes'}
            </h3>
            <p className="text-white/50 text-sm mb-4">
              {activeTab === 'fixtures' ? 'Add your first fixture' : activeTab === 'groups' ? 'Create a group' : 'Connect a node'}
            </p>
            {activeTab !== 'nodes' && (
              <button
                onClick={() => activeTab === 'fixtures' ? setShowEditor(true) : setShowGroupEditor(true)}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-bold text-sm flex items-center gap-2"
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: 'repeat(2, 1fr)' }}>
              {pageItems.map((item, idx) => (
                activeTab === 'fixtures' ? (
                  <FixtureTile key={item.fixture_id} fixture={item} onTap={f => { setEditingFixture(f); setShowEditor(true); }} isConflict={conflicts.has(item.fixture_id)} />
                ) : activeTab === 'groups' ? (
                  <GroupTile key={item.id} group={item} count={fixtures.filter(f => item.fixture_ids?.includes(f.fixture_id)).length} onTap={g => { setEditingGroup(g); setShowGroupEditor(true); }} />
                ) : (
                  <NodeTile key={item.node_id} node={item} fixtures={fixtures} />
                )
              ))}
              {/* Fill empty slots */}
              {Array(Math.max(0, ITEMS_PER_PAGE - pageItems.length)).fill(0).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-xl border border-white/5" />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2 shrink-0">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="p-2 rounded-lg bg-white/10 disabled:opacity-30 active:scale-95">
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <span className="text-sm text-white/60 min-w-[60px] text-center">{page + 1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg bg-white/10 disabled:opacity-30 active:scale-95">
                  <ChevronRight size={20} className="text-white" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showEditor && <FixtureEditor fixture={editingFixture} existingFixtures={fixtures} onSave={handleSaveFixture} onClose={() => { setShowEditor(false); setEditingFixture(null); }} onDelete={id => setConfirmDelete({ type: 'fixture', id, name: editingFixture?.name })} />}
      {showGroupEditor && <GroupEditor group={editingGroup} fixtures={fixtures} onSave={handleSaveGroup} onClose={() => { setShowGroupEditor(false); setEditingGroup(null); }} onDelete={id => setConfirmDelete({ type: 'group', id, name: editingGroup?.name })} />}
      {confirmDelete && <ConfirmModal title={`Delete ${confirmDelete.type === 'fixture' ? 'Fixture' : 'Group'}?`} message={`Delete "${confirmDelete.name}"?`} onConfirm={() => confirmDelete.type === 'fixture' ? handleDeleteFixture(confirmDelete.id) : handleDeleteGroup(confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
