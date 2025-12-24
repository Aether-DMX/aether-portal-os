import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Play, Zap, Layers, Merge, Replace, AlertTriangle, Cpu, Users, Loader } from "lucide-react";
import useNodeStore from "../store/nodeStore";
import useDMXStore from "../store/dmxStore";
import axios from "axios";

// Safe array helper
const safeArray = (arr) => (Array.isArray(arr) ? arr : []);
const API_BASE = `http://${window.location.hostname}:3000`;
const AETHER_CORE_URL = `http://${window.location.hostname}:8891`;

const PlaySceneModal = ({ scene, onClose, onPlay }) => {
  const { nodes: rawNodes } = useNodeStore();
  const { configuredUniverses: rawConfigured } = useDMXStore();

  // Defensive arrays
  const nodes = safeArray(rawNodes);
  const configuredUniverses = safeArray(rawConfigured).length > 0 ? rawConfigured : [1];

  const [scope, setScope] = useState("current"); // current | selected | all | nodes | groups
  const [selectedUniverses, setSelectedUniverses] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [mergeMode, setMergeMode] = useState("merge"); // merge | replace
  const [fadeMs, setFadeMs] = useState(1500);

  // Fetch groups from backend API
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      setGroupsLoading(true);
      try {
        // Fetch from AETHER Core (SSOT for groups)
        const res = await axios.get(`${AETHER_CORE_URL}/api/groups`);
        const data = Array.isArray(res.data) ? res.data : [];
        // Normalize Core's group_id to id for consistency
        setGroups(data.filter(g => g && (g.group_id || g.id) && g.name).map(g => ({
          id: g.group_id || g.id,
          name: g.name,
          channels: g.channels || [],
          universe: g.universe || 1,
          color: g.color || '#8b5cf6'
        })));
      } catch (e) {
        console.error('Failed to load groups from AETHER Core:', e);
        setGroups([]);
      }
      setGroupsLoading(false);
    };
    loadGroups();
  }, []);

  // Get unique universes from nodes (online only for node scope)
  const universes = useMemo(() => {
    const fromNodes = [...new Set(nodes.map(n => n.universe || 1))].sort((a,b) => a-b);
    return fromNodes.length > 0 ? fromNodes : configuredUniverses;
  }, [nodes, configuredUniverses]);

  const onlineNodes = useMemo(() => nodes.filter(n => n.status === 'online'), [nodes]);

  const toggleUniverse = (u) => setSelectedUniverses(p => p.includes(u) ? p.filter(x=>x!==u) : [...p,u]);
  const toggleGroup = (g) => setSelectedGroups(p => p.includes(g) ? p.filter(x=>x!==g) : [...p,g]);

  const getNode = (u) => nodes.find(n => n.universe === u);

  // Get channels from selected groups, organized by universe
  const groupChannelsByUniverse = useMemo(() => {
    if (scope !== 'groups' || selectedGroups.length === 0) return null;
    const byUniverse = {};
    selectedGroups.forEach(gid => {
      const group = groups.find(g => g.id === gid);
      if (group?.channels) {
        const univ = group.universe || 1;
        if (!byUniverse[univ]) byUniverse[univ] = [];
        byUniverse[univ].push(...group.channels);
      }
    });
    // Deduplicate channels per universe
    Object.keys(byUniverse).forEach(u => {
      byUniverse[u] = [...new Set(byUniverse[u])];
    });
    return byUniverse;
  }, [scope, selectedGroups, groups]);

  // Flat list of all group channels (for display)
  const groupChannels = useMemo(() => {
    if (!groupChannelsByUniverse) return null;
    const allChannels = [];
    Object.values(groupChannelsByUniverse).forEach(chs => allChannels.push(...chs));
    return [...new Set(allChannels)];
  }, [groupChannelsByUniverse]);

  // Calculate what will be affected
  const affectedUniverses = useMemo(() => {
    switch (scope) {
      case 'current': return [scene?.universe || 1];
      case 'selected': return selectedUniverses;
      case 'all': return universes;
      case 'nodes': return [...new Set(onlineNodes.map(n => n.universe || 1))];
      case 'groups': {
        // Get universes from selected groups
        const groupUnivs = selectedGroups.map(gid => {
          const group = groups.find(g => g.id === gid);
          return group?.universe || 1;
        });
        return [...new Set(groupUnivs)];
      }
      default: return [1];
    }
  }, [scope, selectedUniverses, universes, onlineNodes, scene, selectedGroups, groups]);

  // Count channels that will be affected
  const channelCount = useMemo(() => {
    if (!scene?.channels) return 0;
    return Object.keys(scene.channels).length;
  }, [scene]);

  const handlePlay = () => {
    if (scope === 'selected' && selectedUniverses.length === 0) {
      alert("Select at least one universe");
      return;
    }
    if (scope === 'groups' && selectedGroups.length === 0) {
      alert("Select at least one group");
      return;
    }

    onPlay(scene, {
      fadeMs,
      universes: affectedUniverses,
      mergeMode,
      scope,
      channelsByUniverse: groupChannelsByUniverse // Pass channels organized by universe for group playback
    });
    onClose();
  };

  // Show warning for dangerous operations
  const showWarning = scope === 'all' || scope === 'nodes';

  return ReactDOM.createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
      onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); onClose(); } }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0d0d12] rounded-2xl w-full max-w-md border border-white/10" onClick={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Apply Scene</h2>
              <p className="text-white/50 text-xs">{scene?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="p-3 space-y-3">
          {/* Scope Selection */}
          <div>
            <label className="text-white/50 text-[10px] uppercase font-bold mb-1.5 block">Apply Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>setScope("current")}
                className={`p-2.5 rounded-xl border flex items-center gap-2 justify-center text-sm ${
                  scope==="current" ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]" : "bg-white/5 border-white/10 text-white/70"
                }`}>
                <Zap size={16} /> Current
              </button>
              <button onClick={()=>setScope("selected")}
                className={`p-2.5 rounded-xl border flex items-center gap-2 justify-center text-sm ${
                  scope==="selected" ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]" : "bg-white/5 border-white/10 text-white/70"
                }`}>
                <Layers size={16} /> Select
              </button>
              <button onClick={()=>setScope("groups")}
                className={`p-2.5 rounded-xl border flex items-center gap-2 justify-center text-sm ${
                  scope==="groups" ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-white/5 border-white/10 text-white/70"
                }`}>
                <Users size={16} /> Groups
              </button>
              <button onClick={()=>setScope("all")}
                className={`p-2.5 rounded-xl border flex items-center gap-2 justify-center text-sm ${
                  scope==="all" ? "bg-orange-500/20 border-orange-500 text-orange-300" : "bg-white/5 border-white/10 text-white/70"
                }`}>
                <Layers size={16} /> All Universes
              </button>
            </div>
          </div>

          {/* Universe Selection (when scope is 'selected') */}
          {scope === "selected" && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {universes.map(u => {
                const n = getNode(u);
                const s = selectedUniverses.includes(u);
                const isOnline = nodes.some(node => node.universe === u && node.status === 'online');
                return (
                  <button
                    key={u}
                    onClick={() => toggleUniverse(u)}
                    className={`w-full p-2 rounded-xl border flex items-center justify-between ${
                      s ? "bg-[var(--accent)]/20 border-[var(--accent)]" : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
                        s ? "bg-[var(--accent)] text-black" : "bg-white/10 text-white/50"
                      }`}>
                        {u}
                      </div>
                      <span className="text-white text-sm">{n?.name || `Universe ${u}`}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Group Selection (when scope is 'groups') */}
          {scope === "groups" && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {groupsLoading ? (
                <div className="text-center py-4 text-white/40 text-sm flex items-center justify-center gap-2">
                  <Loader size={16} className="animate-spin" /> Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-4 text-white/40 text-sm">
                  No groups defined. Create groups in Fixtures.
                </div>
              ) : (
                groups.map(g => {
                  const s = selectedGroups.includes(g.id);
                  const channelCount = g.channels?.length || g.fixture_ids?.length || 0;
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGroup(g.id)}
                      className={`w-full p-2 rounded-xl border flex items-center justify-between ${
                        s ? "bg-purple-500/20 border-purple-500" : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
                          s ? "bg-purple-500 text-white" : "bg-white/10 text-white/50"
                        }`}>
                          <Users size={14} />
                        </div>
                        <span className="text-white text-sm">{g.name}</span>
                      </div>
                      <span className="text-white/40 text-xs">{channelCount} ch</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Merge Mode */}
          <div>
            <label className="text-white/50 text-[10px] uppercase font-bold mb-1.5 block">Merge Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={()=>setMergeMode("merge")}
                className={`p-2.5 rounded-xl border flex items-center gap-2 justify-center text-sm ${
                  mergeMode==="merge" ? "bg-blue-500/20 border-blue-500 text-blue-300" : "bg-white/5 border-white/10 text-white/70"
                }`}>
                <Merge size={16} /> Merge
              </button>
              <button onClick={()=>setMergeMode("replace")}
                className={`p-2.5 rounded-xl border flex items-center gap-2 justify-center text-sm ${
                  mergeMode==="replace" ? "bg-red-500/20 border-red-500 text-red-300" : "bg-white/5 border-white/10 text-white/70"
                }`}>
                <Replace size={16} /> Replace
              </button>
            </div>
            <p className="text-[10px] text-white/40 mt-1">
              {mergeMode === "merge" ? "Only apply defined channels (keep others)" : "Zero all other channels in scope"}
            </p>
          </div>

          {/* Fade Time */}
          <div>
            <label className="text-white/50 text-[10px] uppercase font-bold mb-1.5 block">Fade Time</label>
            <div className="flex gap-1.5">
              {[0, 500, 1000, 1500, 2000, 3000].map(ms => (
                <button
                  key={ms}
                  onClick={() => setFadeMs(ms)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                    fadeMs === ms ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
                  }`}
                >
                  {ms === 0 ? "Snap" : `${ms/1000}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Affecting:</span>
              <span className="text-white font-bold">
                {scope === 'groups'
                  ? `${selectedGroups.length} group${selectedGroups.length !== 1 ? 's' : ''} · ${groupChannels?.length || 0} channels`
                  : `${affectedUniverses.length} universe${affectedUniverses.length !== 1 ? 's' : ''} · ${channelCount} channels`
                }
              </span>
            </div>
          </div>

          {/* Warning for dangerous operations */}
          {showWarning && (
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-400 shrink-0" />
              <p className="text-[10px] text-orange-300">
                This will apply to {scope === 'all' ? 'all universes' : 'all online nodes'}. Confirm before proceeding.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm">
            Cancel
          </button>
          <button
            onClick={handlePlay}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
              showWarning ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            <Play size={16} /> Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PlaySceneModal;
