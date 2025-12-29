/**
 * ApplyTargetModal - Unified "Apply Target" UI for Scenes, Chases, Shows, and AI-suggested actions.
 *
 * This is the SINGLE source of truth for target selection when applying any action to DMX universes.
 * All apply actions (scenes, chases, shows, AI suggestions) MUST use this modal.
 *
 * Routes through SSOT - does NOT directly manipulate DMX.
 */
import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Play, Zap, Layers, Users, Loader, Music, Sparkles, Film } from "lucide-react";
import useNodeStore from "../store/nodeStore";
import useDMXStore from "../store/dmxStore";
import axios from "axios";

const safeArray = (arr) => (Array.isArray(arr) ? arr : []);
const AETHER_CORE_URL = `http://${window.location.hostname}:8891`;

/**
 * Mode configurations for different action types
 */
const MODE_CONFIG = {
  scene: {
    icon: Play,
    iconColor: 'text-green-400',
    title: (item) => item?.name || 'Scene',
    subtitle: null,
    primaryColor: 'green',
    primaryLabel: 'Apply',
    showFadeOptions: true,
    showGroups: true,
  },
  chase: {
    icon: Music,
    iconColor: 'text-purple-400',
    title: (item) => item?.name || 'Chase',
    subtitle: (item) => `${item?.bpm || 120} BPM • ${item?.steps?.length || 0} steps`,
    primaryColor: 'purple',
    primaryLabel: 'Play',
    showFadeOptions: true, // Enable fade time selection for chases
    showGroups: false, // Chases apply to whole universes
  },
  show: {
    icon: Film,
    iconColor: 'text-amber-400',
    title: (item) => item?.name || 'Show',
    subtitle: (item) => item?.duration || null,
    primaryColor: 'amber',
    primaryLabel: 'Run',
    showFadeOptions: false,
    showGroups: false,
  },
  ai_scene: {
    icon: Sparkles,
    iconColor: 'text-cyan-400',
    title: (item) => item?.name || 'AI Suggestion',
    subtitle: () => 'AI-generated scene',
    primaryColor: 'cyan',
    primaryLabel: 'Apply',
    showFadeOptions: true,
    showGroups: true,
  },
};

/**
 * ApplyTargetModal Component
 *
 * @param {Object} props
 * @param {'scene'|'chase'|'show'|'ai_scene'} props.mode - The type of action
 * @param {Object} props.item - The item to apply (scene, chase, etc.)
 * @param {Object} props.defaultTargets - Optional pre-filled targets { scope, universes, groups, fadeMs }
 * @param {Function} props.onConfirm - Called with (item, options) when user confirms
 * @param {Function} props.onCancel - Called when user cancels
 * @param {boolean} props.loading - Shows loading state on confirm button
 */
const ApplyTargetModal = ({
  mode = 'scene',
  item,
  defaultTargets = {},
  onConfirm,
  onCancel,
  loading = false
}) => {
  const config = MODE_CONFIG[mode] || MODE_CONFIG.scene;
  const IconComponent = config.icon;

  const { nodes: rawNodes } = useNodeStore();
  const { configuredUniverses: rawConfigured } = useDMXStore();
  const nodes = safeArray(rawNodes);
  const configuredUniverses = safeArray(rawConfigured).length > 0 ? rawConfigured : [1];

  // State - default to "all" for scenes since fixtures may be on different universes than the scene was created on
  const [scope, setScope] = useState(defaultTargets.scope || (mode === 'scene' ? 'all' : 'current'));
  const [selectedUniverses, setSelectedUniverses] = useState(defaultTargets.universes || []);
  const [selectedGroups, setSelectedGroups] = useState(defaultTargets.groups || []);
  const [fadeMs, setFadeMs] = useState(defaultTargets.fadeMs || 1000);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Load groups if needed
  useEffect(() => {
    if (!config.showGroups) return;

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
  }, [config.showGroups]);

  // Apply default targets when they change (for AI pre-fill)
  useEffect(() => {
    if (defaultTargets.scope) setScope(defaultTargets.scope);
    if (defaultTargets.universes) setSelectedUniverses(defaultTargets.universes);
    if (defaultTargets.groups) setSelectedGroups(defaultTargets.groups);
    if (defaultTargets.fadeMs) setFadeMs(defaultTargets.fadeMs);
  }, [defaultTargets]);

  // Derived state
  const universes = useMemo(() => {
    const fromNodes = [...new Set(nodes.map(n => n.universe || 1))].sort((a, b) => a - b);
    return fromNodes.length > 0 ? fromNodes : configuredUniverses;
  }, [nodes, configuredUniverses]);

  const toggleUniverse = (u) => setSelectedUniverses(p => p.includes(u) ? p.filter(x => x !== u) : [...p, u]);
  const toggleGroup = (g) => setSelectedGroups(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);

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
      case 'current': return [item?.universe || 1];
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
  }, [scope, selectedUniverses, universes, item, selectedGroups, groups]);

  // Validation
  const canConfirm = useMemo(() => {
    if (scope === 'selected' && selectedUniverses.length === 0) return false;
    if (scope === 'groups' && selectedGroups.length === 0) return false;
    return true;
  }, [scope, selectedUniverses, selectedGroups]);

  const validationMessage = useMemo(() => {
    if (scope === 'selected' && selectedUniverses.length === 0) return 'Select at least one universe';
    if (scope === 'groups' && selectedGroups.length === 0) return 'Select at least one group';
    return null;
  }, [scope, selectedUniverses, selectedGroups]);

  // Handle confirm
  const handleConfirm = () => {
    if (!canConfirm) return;

    onConfirm(item, {
      fadeMs,
      universes: affectedUniverses,
      mergeMode: 'merge',
      scope,
      channelsByUniverse: groupChannelsByUniverse
    });
  };

  // Get button colors based on mode and scope
  const getPrimaryButtonClass = () => {
    if (scope === 'all') return 'bg-orange-500 text-white';
    switch (config.primaryColor) {
      case 'purple': return 'bg-purple-500 text-white';
      case 'amber': return 'bg-amber-500 text-black';
      case 'cyan': return 'bg-cyan-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  // Scope options - conditionally include groups
  const scopeOptions = [
    { id: 'current', icon: Zap, label: 'Current' },
    { id: 'selected', icon: Layers, label: 'Select' },
    ...(config.showGroups ? [{ id: 'groups', icon: Users, label: 'Groups' }] : []),
    { id: 'all', icon: Layers, label: 'All' }
  ];

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '12px'
      }}
      onTouchEnd={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); onCancel(); } }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="bg-[#0d0d12] rounded-2xl w-full max-w-sm border border-white/10"
        onClick={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
            <div>
              <span className="text-white font-bold text-sm">{config.title(item)}</span>
              {config.subtitle && config.subtitle(item) && (
                <p className="text-white/50 text-[10px]">{config.subtitle(item)}</p>
              )}
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-2.5 space-y-2">
          {/* Scope Selection */}
          <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${scopeOptions.length}, 1fr)` }}>
            {scopeOptions.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setScope(id)}
                className={`py-2 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                  scope === id
                    ? id === 'groups' ? 'bg-purple-500/20 text-purple-300 border border-purple-500'
                    : id === 'all' ? 'bg-orange-500/20 text-orange-300 border border-orange-500'
                    : 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]'
                    : 'bg-white/5 text-white/50 border border-transparent'
                }`}
              >
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
                  <button
                    key={u}
                    onClick={() => toggleUniverse(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      s ? "bg-[var(--accent)] text-black" : "bg-white/10 text-white/60"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    U{u}
                  </button>
                );
              })}
            </div>
          )}

          {/* Group Selection */}
          {scope === "groups" && config.showGroups && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {groupsLoading ? (
                <div className="text-white/40 text-xs flex items-center gap-1">
                  <Loader size={12} className="animate-spin" /> Loading...
                </div>
              ) : groups.length === 0 ? (
                <div className="text-white/40 text-xs">No groups available</div>
              ) : (
                groups.map(g => {
                  const s = selectedGroups.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGroup(g.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        s ? "bg-purple-500 text-white" : "bg-white/10 text-white/60"
                      }`}
                    >
                      {g.name} <span className="opacity-60">U{g.universe}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Fade Time - only for scenes */}
          {config.showFadeOptions && (
            <div className="flex gap-1">
              {[0, 500, 1000, 2000].map(ms => (
                <button
                  key={ms}
                  onClick={() => setFadeMs(ms)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${
                    fadeMs === ms ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                  }`}
                >
                  {ms === 0 ? "Snap" : `${ms / 1000}s`}
                </button>
              ))}
            </div>
          )}

          {/* Summary / Validation */}
          <div className="text-[10px] text-center">
            {validationMessage ? (
              <span className="text-red-400">{validationMessage}</span>
            ) : (
              <span className="text-white/40">
                {scope === 'groups'
                  ? `${selectedGroups.length} group${selectedGroups.length !== 1 ? 's' : ''} · ${groupChannels?.length || 0} ch`
                  : `${affectedUniverses.length} universe${affectedUniverses.length !== 1 ? 's' : ''}`
                }
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-2.5 pb-2.5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-white/10 text-white font-bold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5
              ${!canConfirm ? 'opacity-50 cursor-not-allowed' : ''}
              ${getPrimaryButtonClass()}`}
          >
            {loading ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <>
                <IconComponent size={14} />
                {config.primaryLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Hook for AI-suggested scene integration
 * Returns a function that can be called to open the modal with pre-filled suggestions
 *
 * Usage:
 *   const { openAISuggestion, AISuggestionModal } = useAISuggestionModal(handleApplyScene);
 *
 *   // When AI suggests a scene:
 *   openAISuggestion(suggestedScene, { universes: [2], fadeMs: 1000 });
 *
 *   // In render:
 *   {AISuggestionModal}
 */
export const useAISuggestionModal = (onApply) => {
  const [state, setState] = useState({ isOpen: false, item: null, targets: {} });

  const openAISuggestion = (suggestedItem, suggestedTargets = {}) => {
    setState({
      isOpen: true,
      item: suggestedItem,
      targets: {
        scope: suggestedTargets.universes?.length ? 'selected' : 'all',
        universes: suggestedTargets.universes || [],
        fadeMs: suggestedTargets.fadeMs || 1000,
        ...suggestedTargets
      }
    });
  };

  const handleConfirm = (item, options) => {
    onApply(item, options);
    setState({ isOpen: false, item: null, targets: {} });
  };

  const handleCancel = () => {
    setState({ isOpen: false, item: null, targets: {} });
  };

  const AISuggestionModal = state.isOpen ? (
    <ApplyTargetModal
      mode="ai_scene"
      item={state.item}
      defaultTargets={state.targets}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { openAISuggestion, AISuggestionModal };
};

export default ApplyTargetModal;
