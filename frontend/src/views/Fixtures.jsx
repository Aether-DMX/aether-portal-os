import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, X, Layers, Lightbulb, Cpu, AlertTriangle, Wifi, WifiOff, Save, ChevronLeft, ChevronRight, Loader2, Radio, RefreshCw, Download, Grid3X3, Flashlight } from 'lucide-react';
import { useFixtureStore } from '../store/fixtureStore';
import useNodeStore from '../store/nodeStore';
import useRDMStore from '../store/rdmStore';
import { useKeyboard } from '../context/KeyboardContext';
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:3000`;
const AETHER_CORE_URL = `http://${window.location.hostname}:8891`;

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

// Fixture tile for grid - adapts to desktop/kiosk
function FixtureTile({ fixture, onTap, isConflict, isDesktop }) {
  const preset = FIXTURE_PRESETS.find(p => p.id === fixture.type);
  const endChannel = (fixture.start_channel || 1) + (fixture.channel_count || 1) - 1;

  if (isDesktop) {
    // Desktop: Larger, more detailed card with hover effects
    return (
      <button
        onClick={() => onTap(fixture)}
        className={`group p-3 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg flex flex-col ${
          isConflict
            ? 'border-red-500/50 bg-red-500/10 hover:border-red-500/70'
            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
        }`}
        style={{ minHeight: '100px' }}
      >
        {/* Top row: Icon + Name */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 shadow-md"
            style={{ background: fixture.color || '#8b5cf6' }}
          >
            {preset?.icon || fixture.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm text-white font-semibold truncate group-hover:text-white/90">
              {fixture.name}
            </div>
            <div className="text-xs text-white/50">
              {preset?.name || 'Custom'} · {fixture.channel_count || 1}ch
            </div>
          </div>
        </div>

        {/* Bottom row: Channel info */}
        <div className="mt-auto flex items-center justify-between text-xs">
          <span className="text-white/40">Universe {fixture.universe}</span>
          <span className={`font-mono px-1.5 py-0.5 rounded ${isConflict ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'}`}>
            {fixture.start_channel}-{endChannel}
          </span>
        </div>
      </button>
    );
  }

  // Kiosk: Compact touch-friendly tile
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

// Group tile - adapts to desktop/kiosk
function GroupTile({ group, onTap, isDesktop }) {
  const channelCount = group.channels?.length || 0;
  const channelRange = channelCount > 0
    ? `${Math.min(...group.channels)}-${Math.max(...group.channels)}`
    : 'Empty';

  if (isDesktop) {
    // Desktop: Larger, more detailed card with hover effects
    return (
      <button
        onClick={() => onTap(group)}
        className="group p-3 rounded-xl border border-white/10 bg-white/5 transition-all hover:scale-[1.02] hover:shadow-lg hover:border-white/20 hover:bg-white/8 flex flex-col"
        style={{ minHeight: '100px' }}
      >
        {/* Top row: Icon + Name */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-md"
            style={{ background: group.color || '#8b5cf6' }}
          >
            <Layers size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm text-white font-semibold truncate group-hover:text-white/90">
              {group.name}
            </div>
            <div className="text-xs text-white/50">
              {channelCount} channel{channelCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Bottom row: Channel info */}
        <div className="mt-auto flex items-center justify-between text-xs">
          <span className="text-white/40">Universe {group.universe || 1}</span>
          <span className="font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
            {channelRange}
          </span>
        </div>
      </button>
    );
  }

  // Kiosk: Compact touch-friendly tile
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
      <div className="text-[10px] text-white/40">{channelCount} ch · U{group.universe || 1}</div>
    </button>
  );
}

// Node tile - adapts to desktop/kiosk
function NodeTile({ node, fixtures, isDesktop }) {
  const safeFixtures = safeArray(fixtures);
  const nodeFixtures = safeFixtures.filter(f => f.node_id === node.node_id || (f.universe === node.universe && !f.node_id));
  const usedChannels = nodeFixtures.reduce((sum, f) => sum + (f.channel_count || 0), 0);
  const utilization = nodeFixtures.length > 0 ? Math.min(100, (usedChannels / 512) * 100) : 0;
  const barColor = utilization > 90 ? '#ef4444' : utilization > 70 ? '#eab308' : '#22c55e';
  const isOnline = node.status === 'online';

  if (isDesktop) {
    // Desktop: Larger, more detailed card
    return (
      <div
        className="group p-3 rounded-xl border border-white/10 bg-white/5 transition-all hover:border-white/20 hover:bg-white/8 flex flex-col"
        style={{ minHeight: '100px' }}
      >
        {/* Top row: Status + Name */}
        <div className="flex items-start gap-3 mb-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
            isOnline ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {isOnline ? (
              <Wifi size={20} className="text-green-400" />
            ) : (
              <WifiOff size={20} className="text-red-400" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm text-white font-semibold truncate">
              {node.name}
            </div>
            <div className="text-xs text-white/50">
              {nodeFixtures.length} fixture{nodeFixtures.length !== 1 ? 's' : ''} · {usedChannels}/512 ch
            </div>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>

        {/* Bottom row: Universe + Utilization bar */}
        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-white/40">Universe {node.universe}</span>
            <span className="text-white/50">{Math.round(utilization)}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${utilization}%`, background: barColor }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Kiosk: Compact tile
  return (
    <div className="p-2 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1" style={{ minHeight: '70px' }}>
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
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

// Group editor modal - compact (uses channels for AETHER Core compatibility)
function GroupEditor({ group, fixtures, onSave, onClose, onDelete }) {
  const { openKeyboard } = useKeyboard();
  const isEditing = !!group?.id;
  const [name, setName] = useState(group?.name || '');
  const [color, setColor] = useState(group?.color || COLORS[0]);
  const [universe, setUniverse] = useState(group?.universe || 1);
  const [page, setPage] = useState(0);
  const perPage = 8;

  // Defensive: ensure fixtures is always an array
  const safeFixtures = safeArray(fixtures);

  // Filter fixtures by selected universe
  const universeFixtures = safeFixtures.filter(f => (f.universe || 1) === universe);

  // Get fixtures whose channels are in the group's channel list
  const getSelectedFixtureIds = () => {
    if (!group?.channels?.length) return [];
    const channelSet = new Set(group.channels);
    return universeFixtures
      .filter(f => {
        // Check if any of fixture's channels are in the group
        for (let ch = f.start_channel; ch < f.start_channel + (f.channel_count || 1); ch++) {
          if (channelSet.has(ch)) return true;
        }
        return false;
      })
      .map(f => f.fixture_id || f.id);
  };

  const [selectedIds, setSelectedIds] = useState(getSelectedFixtureIds);

  // Convert selected fixture IDs to channel array
  const getChannelsFromFixtures = () => {
    const channels = [];
    selectedIds.forEach(fid => {
      const fixture = safeFixtures.find(f => (f.fixture_id || f.id) === fid);
      if (fixture) {
        for (let ch = fixture.start_channel; ch < fixture.start_channel + (fixture.channel_count || 1); ch++) {
          channels.push(ch);
        }
      }
    });
    return [...new Set(channels)].sort((a, b) => a - b);
  };

  const toggleFixture = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = () => {
    if (!name.trim()) return;
    const channels = getChannelsFromFixtures();
    onSave({
      group_id: group?.id,
      name: name.trim(),
      universe,
      channels,
      color
    });
  };

  const pageFixtures = universeFixtures.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(universeFixtures.length / perPage);

  const channelCount = getChannelsFromFixtures().length;

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
              <label className="text-[11px] text-white/50 mb-1 block">UNIVERSE</label>
              <div className="flex gap-1">
                {[1, 2, 3].map(u => (
                  <button key={u} onClick={() => { setUniverse(u); setSelectedIds([]); }}
                    className={`flex-1 p-2 rounded-lg text-sm font-bold ${universe === u ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/70'}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/50 mb-1 block">COLOR</label>
            <div className="flex gap-1">
              {COLORS.slice(0, 8).map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-lg ${color === c ? 'ring-2 ring-white' : ''}`} style={{ background: c }} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-white/50 mb-1 block">FIXTURES ({selectedIds.length} selected · {channelCount} channels)</label>
            {universeFixtures.length === 0 ? (
              <div className="text-center py-4 text-white/40 text-sm">No fixtures on Universe {universe}</div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-1">
                  {pageFixtures.map(f => f && (
                    <button key={f.fixture_id || f.id} onClick={() => toggleFixture(f.fixture_id || f.id)}
                      className={`p-2 rounded-lg text-xs transition-all ${selectedIds.includes(f.fixture_id || f.id) ? 'bg-[var(--accent)]/30 border border-[var(--accent)]' : 'bg-white/5 border border-transparent'}`}>
                      <div className="w-5 h-5 rounded mx-auto mb-1 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: f.color || '#8b5cf6' }}>{(f.name || '?').charAt(0)}</div>
                      <div className="truncate">{f.name || 'Unknown'}</div>
                      <div className="text-white/40 text-[9px]">Ch{f.start_channel}</div>
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
              </>
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

// RDM Discovery Modal - Discover and import RDM fixtures
function RDMDiscoveryModal({ onClose, onImport, existingFixtures, nodes }) {
  const {
    devices,
    scanningNodes,
    fetchDevices,
    startDiscovery,
    identifyDevice,
    isNodeScanning
  } = useRDMStore();

  const [selectedDevices, setSelectedDevices] = useState([]);
  const [identifyingDevices, setIdentifyingDevices] = useState({});
  const [importLoading, setImportLoading] = useState(false);

  // Only show paired nodes
  const pairedNodes = safeArray(nodes).filter(n => n.is_paired || n.is_builtin);

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDiscoverAll = async () => {
    for (const node of pairedNodes) {
      if (!isNodeScanning(node.node_id)) {
        startDiscovery(node.node_id);
      }
    }
  };

  const handleIdentify = async (uid) => {
    const currentState = identifyingDevices[uid] || false;
    const newState = !currentState;
    setIdentifyingDevices(prev => ({ ...prev, [uid]: newState }));
    try {
      await identifyDevice(uid, newState);
      if (newState) {
        setTimeout(() => {
          setIdentifyingDevices(prev => ({ ...prev, [uid]: false }));
          identifyDevice(uid, false);
        }, 5000);
      }
    } catch (e) {
      setIdentifyingDevices(prev => ({ ...prev, [uid]: false }));
    }
  };

  const toggleDevice = (uid) => {
    setSelectedDevices(prev =>
      prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid]
    );
  };

  const handleImport = async () => {
    if (selectedDevices.length === 0) return;
    setImportLoading(true);

    // Convert selected RDM devices to fixtures
    const fixturesToAdd = selectedDevices.map(uid => {
      const device = devices.find(d => d.uid === uid);
      if (!device) return null;

      // Find next free channel
      const occupiedByUniverse = {};
      existingFixtures.forEach(f => {
        if (!occupiedByUniverse[f.universe]) occupiedByUniverse[f.universe] = new Set();
        for (let ch = f.start_channel; ch < f.start_channel + (f.channel_count || 1); ch++) {
          occupiedByUniverse[f.universe].add(ch);
        }
      });

      // Use RDM address if available, or find free slot
      const universe = device.universe || 1;
      let startChannel = device.dmx_address || 1;
      const channelCount = device.dmx_footprint || 1;

      return {
        name: device.device_label || `RDM ${device.uid.split(':')[1]?.slice(-4) || 'Device'}`,
        type: channelCount > 10 ? 'moving-16ch' : channelCount > 4 ? 'par-7ch' : channelCount > 3 ? 'rgbw-4ch' : channelCount > 1 ? 'rgb-3ch' : 'dimmer-1ch',
        universe,
        start_channel: startChannel,
        channel_count: channelCount,
        manufacturer: device.manufacturer_id || '',
        model: device.device_model_id || '',
        rdm_uid: device.uid,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    }).filter(Boolean);

    await onImport(fixturesToAdd);
    setImportLoading(false);
    onClose();
  };

  const isAnyScanning = pairedNodes.some(n => isNodeScanning(n.node_id));

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#0d0d12] rounded-2xl w-[95%] max-w-[600px] max-h-[90%] border border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-green-500" />
            <h2 className="text-lg font-bold text-white">RDM Discovery</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscoverAll}
              disabled={isAnyScanning || pairedNodes.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw size={12} className={isAnyScanning ? 'animate-spin' : ''} />
              {isAnyScanning ? 'Scanning...' : 'Scan All'}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/10">
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Device List */}
        <div className="flex-1 overflow-y-auto p-3">
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Radio size={40} className="text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">No RDM Devices Found</h3>
              <p className="text-white/50 text-sm mb-4">Click "Scan All" to discover RDM fixtures</p>
              {pairedNodes.length === 0 && (
                <p className="text-yellow-500/70 text-xs">No PULSE nodes connected</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map(device => {
                const isSelected = selectedDevices.includes(device.uid);
                const isIdentifying = identifyingDevices[device.uid] || false;
                const alreadyImported = existingFixtures.some(f => f.rdm_uid === device.uid);

                return (
                  <div
                    key={device.uid}
                    className={`p-3 rounded-xl border transition-all ${
                      alreadyImported
                        ? 'border-white/5 bg-white/2 opacity-50'
                        : isSelected
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => !alreadyImported && toggleDevice(device.uid)}
                          disabled={alreadyImported}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            alreadyImported
                              ? 'border-white/20 bg-white/5'
                              : isSelected
                              ? 'border-green-500 bg-green-500'
                              : 'border-white/30 bg-transparent'
                          }`}
                        >
                          {(isSelected || alreadyImported) && <Check size={12} className="text-white" />}
                        </button>
                        <div>
                          <div className="text-white text-sm font-semibold">
                            {device.device_label || `Device ${device.uid.split(':')[1]?.slice(-4) || device.uid}`}
                          </div>
                          <div className="text-white/40 text-xs">
                            Ch {device.dmx_address || '?'} · {device.dmx_footprint || '?'}ch · UID: {device.uid}
                          </div>
                          {alreadyImported && (
                            <div className="text-green-400/70 text-xs mt-0.5">Already imported</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleIdentify(device.uid)}
                        className={`p-2 rounded-lg transition-all ${
                          isIdentifying ? 'bg-yellow-500/20' : 'bg-white/10'
                        }`}
                        title="Identify (flash LED)"
                      >
                        <Flashlight size={14} className={isIdentifying ? 'text-yellow-400' : 'text-white/60'} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 p-3 rounded-xl bg-white/10 text-white/60 font-semibold text-sm">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={selectedDevices.length === 0 || importLoading}
            className="flex-1 p-3 rounded-xl bg-green-500 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Download size={16} />
                Import {selectedDevices.length > 0 ? `(${selectedDevices.length})` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Universe Channel Grid - Visual overview of channel usage
function UniverseGrid({ fixtures, universe, conflicts, onFixtureClick }) {
  const universeFixtures = safeArray(fixtures).filter(f => f.universe === universe);

  // Build channel map
  const channelMap = {};
  universeFixtures.forEach(f => {
    for (let ch = f.start_channel; ch < f.start_channel + (f.channel_count || 1); ch++) {
      if (!channelMap[ch]) channelMap[ch] = [];
      channelMap[ch].push(f);
    }
  });

  // Grid of 32 columns x 16 rows = 512 channels
  const COLS = 32;
  const ROWS = 16;

  return (
    <div className="bg-[#0d0d12] rounded-xl border border-white/10 p-2">
      <div className="text-xs text-white/50 mb-2">Universe {universe} · Channel Grid</div>
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {Array.from({ length: 512 }, (_, i) => {
          const ch = i + 1;
          const fixtures = channelMap[ch] || [];
          const hasConflict = fixtures.length > 1;
          const fixture = fixtures[0];

          return (
            <button
              key={ch}
              onClick={() => fixture && onFixtureClick(fixture)}
              className={`aspect-square text-[6px] rounded-sm transition-all ${
                hasConflict
                  ? 'bg-red-500/80 text-white'
                  : fixture
                  ? 'text-white/80 hover:scale-110'
                  : 'bg-white/5 text-white/20'
              }`}
              style={fixture && !hasConflict ? { background: fixture.color || '#8b5cf6' } : {}}
              title={fixture ? `${fixture.name} (Ch ${ch})` : `Ch ${ch}`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-white/40">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-white/5" /> Empty
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-purple-500" /> Used
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-500" /> Conflict
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
  const [showRDMModal, setShowRDMModal] = useState(false);
  const [showChannelGrid, setShowChannelGrid] = useState(false);
  const [gridUniverse, setGridUniverse] = useState(1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 800);

  // Responsive grid config - adapts to screen size
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamic columns and items based on screen width
  const getGridConfig = () => {
    if (windowWidth >= 1920) return { cols: 8, rows: 3, itemsPerPage: 24 };
    if (windowWidth >= 1440) return { cols: 6, rows: 3, itemsPerPage: 18 };
    if (windowWidth >= 1024) return { cols: 5, rows: 3, itemsPerPage: 15 };
    if (windowWidth >= 768) return { cols: 4, rows: 2, itemsPerPage: 8 };
    return { cols: 5, rows: 2, itemsPerPage: 10 }; // Default kiosk (800x480)
  };

  const { cols: COLS, rows: ROWS, itemsPerPage: ITEMS_PER_PAGE } = getGridConfig();
  const isDesktop = windowWidth >= 1024;

  useEffect(() => { fetchFixtures(); }, [fetchFixtures]);

  useEffect(() => {
    const loadGroups = async () => {
      setGroupsLoading(true);
      setGroupsError(null);
      try {
        // Fetch from AETHER Core (SSOT for groups)
        const res = await axios.get(`${AETHER_CORE_URL}/api/groups`);
        // Validate response is an array
        const data = Array.isArray(res.data) ? res.data : [];
        // Normalize Core's group_id to id for consistency
        const validGroups = data.filter(g => g && typeof g === 'object' && (g.group_id || g.id) && g.name).map(g => ({
          id: g.group_id || g.id,
          name: g.name || 'Unnamed',
          channels: Array.isArray(g.channels) ? g.channels : [],
          universe: g.universe || 1,
          color: g.color || '#8b5cf6'
        }));
        setGroups(validGroups);
      } catch (e) {
        console.error('Failed to load groups from AETHER Core:', e);
        setGroupsError(e.message);
        setGroups([]);
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

  const handleImportRDM = async (fixturesToAdd) => {
    for (const f of fixturesToAdd) {
      await addFixture(f);
    }
    console.log('✅ Imported', fixturesToAdd.length, 'fixtures from RDM');
  };

  const handleSaveGroup = async (data) => {
    try {
      // Save to AETHER Core (SSOT)
      const isUpdate = data.group_id && groups.some(g => g.id === data.group_id);
      const payload = {
        group_id: data.group_id,
        name: data.name,
        universe: data.universe || 1,
        channels: data.channels || [],
        color: data.color || '#8b5cf6'
      };

      let responseGroupId;
      if (isUpdate) {
        await axios.put(`${AETHER_CORE_URL}/api/groups/${data.group_id}`, payload);
        responseGroupId = data.group_id;
      } else {
        const res = await axios.post(`${AETHER_CORE_URL}/api/groups`, payload);
        // Core returns { success: true, group_id: "..." }
        responseGroupId = res.data.group_id;
      }

      // Build local group object from our payload data (Core doesn't return full object)
      const validGroup = {
        id: responseGroupId,
        name: data.name,
        channels: data.channels || [],
        universe: data.universe || 1,
        color: data.color || '#8b5cf6'
      };

      // Update local state
      setGroups(prev => {
        const exists = prev.find(g => g.id === validGroup.id);
        if (exists) {
          return prev.map(g => g.id === validGroup.id ? validGroup : g);
        }
        return [...prev, validGroup];
      });

      console.log('✅ Group saved to AETHER Core:', validGroup);
    } catch (e) {
      console.error('Failed to save group to AETHER Core:', e);
      alert('Failed to save group: ' + (e.response?.data?.error || e.message));
      return;
    }
    setShowGroupEditor(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = async (id) => {
    try {
      await axios.delete(`${AETHER_CORE_URL}/api/groups/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
      console.log('✅ Group deleted from AETHER Core:', id);
    } catch (e) {
      console.error('Failed to delete group from AETHER Core:', e);
      alert('Failed to delete group: ' + (e.response?.data?.error || e.message));
    }
    setConfirmDelete(null);
    setShowGroupEditor(false);
    setEditingGroup(null);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col">
      {/* Header - adapts to desktop/kiosk */}
      <div className={`flex items-center gap-2 border-b border-white/10 shrink-0 ${isDesktop ? 'px-6 py-3' : 'px-3 py-2'}`}>
        <button
          onClick={() => navigate(-1)}
          className={`rounded-lg bg-white/10 transition-all ${isDesktop ? 'p-2.5 hover:bg-white/15' : 'p-2 active:scale-95'}`}
        >
          <ArrowLeft size={isDesktop ? 20 : 18} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className={`font-bold text-white ${isDesktop ? 'text-xl' : 'text-lg'}`}>Lighting Setup</h1>
          {isDesktop && (
            <p className="text-xs text-white/40 mt-0.5">Configure fixtures, groups, and PULSE nodes</p>
          )}
        </div>
        {conflicts.size > 0 && (
          <div className={`flex items-center gap-1 rounded-lg bg-red-500/20 text-red-400 ${isDesktop ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'}`}>
            <AlertTriangle size={isDesktop ? 16 : 14} />
            <span>{conflicts.size} conflict{conflicts.size !== 1 ? 's' : ''}</span>
          </div>
        )}
        {/* Channel Grid toggle - fixtures tab only */}
        {activeTab === 'fixtures' && (
          <button
            onClick={() => setShowChannelGrid(!showChannelGrid)}
            className={`rounded-lg transition-all ${showChannelGrid ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white'} ${isDesktop ? 'p-2.5 hover:scale-105' : 'p-2'}`}
            title="Toggle Channel Grid"
          >
            <Grid3X3 size={isDesktop ? 20 : 18} />
          </button>
        )}
        {/* RDM Discovery button - fixtures tab only */}
        {activeTab === 'fixtures' && (
          <button
            onClick={() => setShowRDMModal(true)}
            className={`rounded-lg bg-green-500/20 text-green-400 transition-all ${isDesktop ? 'p-2.5 hover:bg-green-500/30 hover:scale-105' : 'p-2 active:scale-95'}`}
            title="RDM Discovery"
          >
            <Radio size={isDesktop ? 20 : 18} />
          </button>
        )}
        {/* Add button - show text on desktop */}
        {activeTab !== 'nodes' && (
          <button
            onClick={() => {
              if (activeTab === 'fixtures') { setEditingFixture(null); setShowEditor(true); }
              else if (activeTab === 'groups') { setEditingGroup(null); setShowGroupEditor(true); }
            }}
            className={`rounded-lg bg-[var(--accent)] text-black font-semibold transition-all ${
              isDesktop ? 'px-4 py-2.5 flex items-center gap-2 hover:brightness-110' : 'p-2 active:scale-95'
            }`}
          >
            <Plus size={isDesktop ? 18 : 18} />
            {isDesktop && <span>Add {activeTab === 'fixtures' ? 'Fixture' : 'Group'}</span>}
          </button>
        )}
      </div>

      {/* Tabs - adapts to desktop/kiosk */}
      <div className={`flex border-b border-white/10 shrink-0 ${isDesktop ? 'gap-1 px-4' : ''}`}>
        {[
          { id: 'fixtures', label: 'Fixtures', icon: Lightbulb, count: fixtures.length },
          { id: 'groups', label: 'Groups', icon: Layers, count: safeGroups.length },
          { id: 'nodes', label: 'Nodes', icon: Cpu, count: safeNodes.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 transition-all ${
              isDesktop
                ? `px-6 py-3 text-sm font-medium rounded-t-lg ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border-b-2 border-[var(--accent)]'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`
                : `flex-1 py-2 gap-1 text-sm ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border-b-2 border-[var(--accent)]'
                      : 'text-white/50'
                  }`
            }`}
          >
            <tab.icon size={isDesktop ? 18 : 16} />
            {tab.label}
            <span className={`bg-white/10 px-1.5 py-0.5 rounded-full ${isDesktop ? 'text-xs ml-1' : 'text-[10px]'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Channel Grid (when toggled on fixtures tab) */}
      {activeTab === 'fixtures' && showChannelGrid && (
        <div className={`border-b border-white/10 shrink-0 ${isDesktop ? 'p-4 px-6' : 'p-3'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-white/50 ${isDesktop ? 'text-sm' : 'text-xs'}`}>Universe:</span>
            {[1, 2, 3].map(u => (
              <button
                key={u}
                onClick={() => setGridUniverse(u)}
                className={`rounded font-bold transition-all ${
                  gridUniverse === u ? 'bg-[var(--accent)] text-black' : 'bg-white/10 text-white/60'
                } ${isDesktop ? 'px-3 py-1.5 text-sm hover:bg-white/15' : 'px-2 py-1 text-xs'}`}
              >
                Universe {u}
              </button>
            ))}
          </div>
          <UniverseGrid
            fixtures={fixtures}
            universe={gridUniverse}
            conflicts={conflicts}
            onFixtureClick={(f) => { setEditingFixture(f); setShowEditor(true); }}
          />
        </div>
      )}

      {/* Content - grid, adapts to desktop/kiosk */}
      <div className={`flex-1 flex flex-col ${isDesktop ? 'p-6' : 'p-3'}`}>
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
            {/* Grid - Desktop uses auto rows with scroll, kiosk uses fixed rows */}
            <div
              className={`grid ${isDesktop ? 'gap-4 flex-1 overflow-y-auto content-start auto-rows-min pb-4' : 'gap-3 flex-1'}`}
              style={{
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                ...(isDesktop ? {} : { gridTemplateRows: `repeat(${ROWS}, 1fr)` })
              }}
            >
              {pageItems.map((item) => (
                activeTab === 'fixtures' ? (
                  <FixtureTile key={item.fixture_id} fixture={item} onTap={f => { setEditingFixture(f); setShowEditor(true); }} isConflict={conflicts.has(item.fixture_id)} isDesktop={isDesktop} />
                ) : activeTab === 'groups' ? (
                  <GroupTile key={item.id} group={item} onTap={g => { setEditingGroup(g); setShowGroupEditor(true); }} isDesktop={isDesktop} />
                ) : (
                  <NodeTile key={item.node_id} node={item} fixtures={fixtures} isDesktop={isDesktop} />
                )
              ))}
              {/* Fill empty slots - only on kiosk mode */}
              {!isDesktop && Array(Math.max(0, ITEMS_PER_PAGE - pageItems.length)).fill(0).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-xl border border-white/5" />
              ))}
            </div>

            {/* Pagination - show count on desktop, pages on kiosk */}
            {isDesktop ? (
              <div className="flex items-center justify-between pt-3 border-t border-white/10 shrink-0">
                <span className="text-sm text-white/50">
                  {currentItems.length} {activeTab === 'fixtures' ? 'fixture' : activeTab === 'groups' ? 'group' : 'node'}{currentItems.length !== 1 ? 's' : ''}
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-30 transition-all">
                      <ChevronLeft size={18} className="text-white" />
                    </button>
                    <span className="text-sm text-white/60 min-w-[80px] text-center">Page {page + 1} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-30 transition-all">
                      <ChevronRight size={18} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
            ) : totalPages > 1 && (
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
      {showRDMModal && <RDMDiscoveryModal onClose={() => setShowRDMModal(false)} onImport={handleImportRDM} existingFixtures={fixtures} nodes={nodes} />}
    </div>
  );
}
