import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Play, Zap, Layers, Users, Loader } from "lucide-react";
import useNodeStore from "../store/nodeStore";
import useDMXStore from "../store/dmxStore";
import axios from "axios";

const safeArray = (arr) => (Array.isArray(arr) ? arr : []);
const AETHER_CORE_URL = `http://${window.location.hostname}:8891`;

const PlaySceneModal = ({ scene, onClose, onPlay }) => {
  const { nodes: rawNodes } = useNodeStore();
  const { configuredUniverses: rawConfigured } = useDMXStore();
  const nodes = safeArray(rawNodes);
  const configuredUniverses = safeArray(rawConfigured).length > 0 ? rawConfigured : [1];

  const [scope, setScope] = useState("current");
  const [selectedUniverses, setSelectedUniverses] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [fadeMs, setFadeMs] = useState(1000);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      setGroupsLoading(true);
      try {
        const res = await axios.get(`${AETHER_CORE_URL}/api/groups`);
        const data = Array.isArray(res.data) ? res.data : [];
        setGroups(data.filter(g => g && (g.group_id || g.id) && g.name).map(g => ({
          id: g.group_id || g.id,
          name: g.name,
          channels: g.channels || [],
          universe: g.universe || 1,
          color: g.color || '#8b5cf6'
        })));
      } catch (e) {
        setGroups([]);
      }
      setGroupsLoading(false);
    };
    loadGroups();
  }, []);

  const universes = useMemo(() => {
    const fromNodes = [...new Set(nodes.map(n => n.universe || 1))].sort((a,b) => a-b);
    return fromNodes.length > 0 ? fromNodes : configuredUniverses;
  }, [nodes, configuredUniverses]);

  const onlineNodes = useMemo(() => nodes.filter(n => n.status === 'online'), [nodes]);
  const toggleUniverse = (u) => setSelectedUniverses(p => p.includes(u) ? p.filter(x=>x!==u) : [...p,u]);
  const toggleGroup = (g) => setSelectedGroups(p => p.includes(g) ? p.filter(x=>x!==g) : [...p,g]);

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
    Object.keys(byUniverse).forEach(u => {
      byUniverse[u] = [...new Set(byUniverse[u])];
    });
    return byUniverse;
  }, [scope, selectedGroups, groups]);

  const groupChannels = useMemo(() => {
    if (!groupChannelsByUniverse) return null;
    const allChannels = [];
    Object.values(groupChannelsByUniverse).forEach(chs => allChannels.push(...chs));
    return [...new Set(allChannels)];
  }, [groupChannelsByUniverse]);

  const affectedUniverses = useMemo(() => {
    switch (scope) {
      case 'current': return [scene?.universe || 1];
      case 'selected': return selectedUniverses;
      case 'all': return universes;
      case 'groups': {
        const groupUnivs = selectedGroups.map(gid => {
          const group = groups.find(g => g.id === gid);
          return group?.universe || 1;
        });
        return [...new Set(groupUnivs)];
      }
      default: return [1];
    }
  }, [scope, selectedUniverses, universes, scene, selectedGroups, groups]);

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
      mergeMode: 'merge',
      scope,
      channelsByUniverse: groupChannelsByUniverse
    });
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '12px' }}
      onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); onClose(); } }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0d0d12] rounded-2xl w-full max-w-sm border border-white/10" onClick={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()}>
        {/* Header - compact */}
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-green-400" />
            <span className="text-white font-bold text-sm">{scene?.name}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-2.5 space-y-2">
          {/* Scope - 4 buttons inline */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'current', icon: Zap, label: 'Current' },
              { id: 'selected', icon: Layers, label: 'Select' },
              { id: 'groups', icon: Users, label: 'Groups' },
              { id: 'all', icon: Layers, label: 'All' }
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setScope(id)}
                className={`py-2 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                  scope === id
                    ? id === 'groups' ? 'bg-purple-500/20 text-purple-300 border border-purple-500'
                    : id === 'all' ? 'bg-orange-500/20 text-orange-300 border border-orange-500'
                    : 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]'
                    : 'bg-white/5 text-white/50 border border-transparent'
                }`}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Universe Selection */}
          {scope === "selected" && (
            <div className="flex flex-wrap gap-1.5">
              {universes.map(u => {
                const s = selectedUniverses.includes(u);
                const isOnline = nodes.some(node => node.universe === u && node.status === 'online');
                return (
                  <button key={u} onClick={() => toggleUniverse(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      s ? "bg-[var(--accent)] text-black" : "bg-white/10 text-white/60"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    U{u}
                  </button>
                );
              })}
            </div>
          )}

          {/* Group Selection */}
          {scope === "groups" && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {groupsLoading ? (
                <div className="text-white/40 text-xs flex items-center gap-1"><Loader size={12} className="animate-spin" /> Loading...</div>
              ) : groups.length === 0 ? (
                <div className="text-white/40 text-xs">No groups</div>
              ) : (
                groups.map(g => {
                  const s = selectedGroups.includes(g.id);
                  return (
                    <button key={g.id} onClick={() => toggleGroup(g.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        s ? "bg-purple-500 text-white" : "bg-white/10 text-white/60"
                      }`}>
                      {g.name} <span className="opacity-60">U{g.universe}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Fade Time - fewer options */}
          <div className="flex gap-1">
            {[0, 500, 1000, 2000].map(ms => (
              <button key={ms} onClick={() => setFadeMs(ms)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${
                  fadeMs === ms ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                }`}>
                {ms === 0 ? "Snap" : `${ms/1000}s`}
              </button>
            ))}
          </div>

          {/* Summary line */}
          <div className="text-[10px] text-white/40 text-center">
            {scope === 'groups'
              ? `${selectedGroups.length} group${selectedGroups.length !== 1 ? 's' : ''} · ${groupChannels?.length || 0} ch`
              : `${affectedUniverses.length} universe${affectedUniverses.length !== 1 ? 's' : ''}`
            }
          </div>
        </div>

        {/* Actions - compact */}
        <div className="px-2.5 pb-2.5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-white/10 text-white font-bold text-xs">
            Cancel
          </button>
          <button onClick={handlePlay}
            className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
              scope === 'all' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
            }`}>
            <Play size={14} /> Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PlaySceneModal;
