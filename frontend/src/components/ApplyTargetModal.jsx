/**
 * ApplyTargetModal - Unified "Apply Target" UI for Scenes, Chases, Shows, and AI-suggested actions.
 *
 * Full-screen design with tabbed interface: Universes | Fixtures | Groups
 * - Universe grid with online status indicators and fixture counts
 * - Fixture-level selection within each universe
 * - Quick actions: All, Online Only, None
 * - Sends universes array in single API call
 *
 * Routes through SSOT - does NOT directly manipulate DMX.
 */
import React, { useState, useMemo, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { X, Play, Zap, Layers, Users, Loader, Music, Sparkles, Film, Wifi, WifiOff, Check, Square, ChevronRight } from "lucide-react";
import useNodeStore from "../store/nodeStore";
import useDMXStore from "../store/dmxStore";
import axios from "axios";

// Debug flag - set to true to enable verbose logging
const DEBUG_MODAL = true;
const log = (...args) => DEBUG_MODAL && console.log('[ApplyTargetModal]', ...args);

const safeArray = (arr) => (Array.isArray(arr) ? arr : []);
const AETHER_CORE_URL = `http://${window.location.hostname}:8891`;

// ============================================================
// Target Memory - Remembers user's last-used targets
// ============================================================
const TARGET_MEMORY_KEY = 'aether-target-memory';
const TARGET_MEMORY_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Load saved targets from localStorage
 * @returns {object|null} Saved targets or null if none/expired
 */
function loadTargetMemory() {
  try {
    const stored = localStorage.getItem(TARGET_MEMORY_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);

    // Check expiry
    if (data.timestamp && Date.now() - data.timestamp > TARGET_MEMORY_EXPIRY_MS) {
      localStorage.removeItem(TARGET_MEMORY_KEY);
      return null;
    }

    return data;
  } catch (e) {
    log('Failed to load target memory:', e);
    return null;
  }
}

/**
 * Save targets to localStorage
 * @param {object} targets - Targets to save
 */
function saveTargetMemory(targets) {
  try {
    const data = {
      ...targets,
      timestamp: Date.now(),
      useCount: (loadTargetMemory()?.useCount || 0) + 1,
    };
    localStorage.setItem(TARGET_MEMORY_KEY, JSON.stringify(data));
    log('Saved target memory:', data);
  } catch (e) {
    log('Failed to save target memory:', e);
  }
}

/**
 * Check if user has consistent target preferences (3+ uses of same targets)
 * @returns {boolean}
 */
function hasConsistentPreferences() {
  const memory = loadTargetMemory();
  return memory && memory.useCount >= 3;
}

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
    primaryLabel: 'Apply Scene',
    showFadeOptions: true,
    showGroups: true,
    showFixtures: true,
  },
  look: {
    icon: Play,
    iconColor: 'text-cyan-400',
    title: (item) => item?.name || 'Look',
    subtitle: (item) => {
      const modCount = item?.modifiers?.length || 0;
      const chCount = Object.keys(item?.channels || {}).length;
      return modCount > 0 ? `${chCount} channels • ${modCount} modifiers` : `${chCount} channels`;
    },
    primaryColor: 'cyan',
    primaryLabel: 'Play Look',
    showFadeOptions: true,
    showGroups: true,
    showFixtures: true,
  },
  sequence: {
    icon: Music,
    iconColor: 'text-purple-400',
    title: (item) => item?.name || 'Sequence',
    subtitle: (item) => `${item?.bpm || 120} BPM • ${item?.steps?.length || 0} steps`,
    primaryColor: 'purple',
    primaryLabel: 'Play Sequence',
    showFadeOptions: false,
    showGroups: false,
    showFixtures: false, // Sequences apply to whole universes
  },
  chase: {
    icon: Music,
    iconColor: 'text-purple-400',
    title: (item) => item?.name || 'Chase',
    subtitle: (item) => `${item?.bpm || 120} BPM • ${item?.steps?.length || 0} steps`,
    primaryColor: 'purple',
    primaryLabel: 'Play Chase',
    showFadeOptions: true,
    showGroups: false,
    showFixtures: false, // Chases apply to whole universes
  },
  show: {
    icon: Film,
    iconColor: 'text-amber-400',
    title: (item) => item?.name || 'Show',
    subtitle: (item) => item?.duration || null,
    primaryColor: 'amber',
    primaryLabel: 'Run Show',
    showFadeOptions: false,
    showGroups: false,
    showFixtures: false,
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
    showFixtures: true,
  },
};

/**
 * Tab definitions
 */
const TABS = {
  universes: { id: 'universes', label: 'Universes', icon: Layers },
  fixtures: { id: 'fixtures', label: 'Fixtures', icon: Zap },
  groups: { id: 'groups', label: 'Groups', icon: Users },
};

/**
 * ApplyTargetModal Component
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

  // Determine available tabs based on mode
  const availableTabs = useMemo(() => {
    const tabs = [TABS.universes];
    if (config.showFixtures) tabs.push(TABS.fixtures);
    if (config.showGroups) tabs.push(TABS.groups);
    return tabs;
  }, [config]);

  // Load saved target memory
  const savedTargets = useMemo(() => loadTargetMemory(), []);
  const hasSavedTargets = savedTargets && savedTargets.universes?.length > 0;

  // State
  const [activeTab, setActiveTab] = useState('universes');
  const [selectedUniverses, setSelectedUniverses] = useState(defaultTargets.universes || []);
  const [selectedFixtures, setSelectedFixtures] = useState(defaultTargets.fixtures || {});
  const [selectedGroups, setSelectedGroups] = useState(defaultTargets.groups || []);
  const [fadeMs, setFadeMs] = useState(defaultTargets.fadeMs || 1000);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [expandedUniverse, setExpandedUniverse] = useState(null);
  const [usedLastTargets, setUsedLastTargets] = useState(false);

  // Log on mount
  useEffect(() => {
    log('MOUNTED', { mode, item: item?.name || item?.id, hasOnConfirm: typeof onConfirm === 'function' });
    return () => log('UNMOUNTED');
  }, []);

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

  // Apply default targets when they change
  useEffect(() => {
    if (defaultTargets.universes) setSelectedUniverses(defaultTargets.universes);
    if (defaultTargets.groups) setSelectedGroups(defaultTargets.groups);
    if (defaultTargets.fadeMs) setFadeMs(defaultTargets.fadeMs);
  }, [defaultTargets]);

  // Build universe info with online status and fixture counts
  const universeInfo = useMemo(() => {
    const fromNodes = [...new Set(nodes.map(n => n.universe || 1))].sort((a, b) => a - b);
    const allUniverses = fromNodes.length > 0 ? fromNodes : configuredUniverses;

    return allUniverses.map(u => {
      const universeNodes = nodes.filter(n => n.universe === u);
      const onlineNodes = universeNodes.filter(n => n.status === 'online');
      const hasPairedFixture = universeNodes.some(n => n.fixture_count > 0 || n.paired);

      return {
        universe: u,
        nodes: universeNodes,
        onlineCount: onlineNodes.length,
        totalCount: universeNodes.length,
        isOnline: onlineNodes.length > 0,
        hasPairedFixture,
        fixtureCount: universeNodes.reduce((sum, n) => sum + (n.fixture_count || 0), 0)
      };
    });
  }, [nodes, configuredUniverses]);

  // Get fixtures for a universe
  const getFixturesForUniverse = (universe) => {
    return nodes.filter(n => n.universe === universe).map(n => ({
      id: n.node_id || n.id,
      name: n.name || `Node ${n.node_id || n.id}`,
      universe: n.universe,
      isOnline: n.status === 'online',
      fixtureCount: n.fixture_count || 0,
      channels: n.channels || []
    }));
  };

  // Log when selectedUniverses changes
  useEffect(() => {
    log('selectedUniverses changed:', selectedUniverses, 'canConfirm:', selectedUniverses.length > 0);
  }, [selectedUniverses]);

  // Toggle functions
  const toggleUniverse = (u) => {
    log('toggleUniverse:', u);
    setSelectedUniverses(prev =>
      prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
    );
  };

  const toggleGroup = (gid) => {
    setSelectedGroups(prev =>
      prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]
    );
  };

  const toggleFixture = (universeId, fixtureId) => {
    setSelectedFixtures(prev => {
      const current = prev[universeId] || [];
      const updated = current.includes(fixtureId)
        ? current.filter(x => x !== fixtureId)
        : [...current, fixtureId];
      return { ...prev, [universeId]: updated };
    });
  };

  // Quick actions
  const selectAllUniverses = () => {
    setSelectedUniverses(universeInfo.map(u => u.universe));
    setUsedLastTargets(false);
  };

  const selectOnlineOnly = () => {
    setSelectedUniverses(
      universeInfo.filter(u => u.isOnline && u.hasPairedFixture).map(u => u.universe)
    );
    setUsedLastTargets(false);
  };

  const selectNone = () => {
    setSelectedUniverses([]);
    setUsedLastTargets(false);
  };

  // Apply last-used targets
  const selectLastUsed = () => {
    if (!savedTargets) return;
    if (savedTargets.universes) setSelectedUniverses(savedTargets.universes);
    if (savedTargets.fadeMs) setFadeMs(savedTargets.fadeMs);
    setUsedLastTargets(true);
    log('Applied last-used targets:', savedTargets);
  };

  // Compute affected universes based on current selection mode
  const affectedUniverses = useMemo(() => {
    if (activeTab === 'groups' && selectedGroups.length > 0) {
      const groupUnivs = selectedGroups.map(gid => {
        const group = groups.find(g => g.id === gid);
        return group?.universe || 1;
      });
      return [...new Set(groupUnivs)];
    }
    if (activeTab === 'fixtures') {
      return Object.keys(selectedFixtures).filter(u => selectedFixtures[u]?.length > 0).map(Number);
    }
    return selectedUniverses;
  }, [activeTab, selectedUniverses, selectedGroups, selectedFixtures, groups]);

  // Group channels by universe for group-based playback
  const groupChannelsByUniverse = useMemo(() => {
    if (activeTab !== 'groups' || selectedGroups.length === 0) return null;
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
  }, [activeTab, selectedGroups, groups]);

  // Validation
  const canConfirm = useMemo(() => {
    if (activeTab === 'universes' && selectedUniverses.length === 0) return false;
    if (activeTab === 'groups' && selectedGroups.length === 0) return false;
    if (activeTab === 'fixtures') {
      const hasSelection = Object.values(selectedFixtures).some(arr => arr?.length > 0);
      if (!hasSelection) return false;
    }
    return true;
  }, [activeTab, selectedUniverses, selectedGroups, selectedFixtures]);

  const validationMessage = useMemo(() => {
    if (activeTab === 'universes' && selectedUniverses.length === 0) return 'Select at least one universe';
    if (activeTab === 'groups' && selectedGroups.length === 0) return 'Select at least one group';
    if (activeTab === 'fixtures') {
      const hasSelection = Object.values(selectedFixtures).some(arr => arr?.length > 0);
      if (!hasSelection) return 'Select at least one fixture';
    }
    return null;
  }, [activeTab, selectedUniverses, selectedGroups, selectedFixtures]);

  // Handle confirm - unified handler for both click and touch
  const handleConfirm = useCallback((e) => {
    // Prevent any default behavior and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    log('CONFIRM PRESSED', {
      eventType: e?.type || 'direct',
      canConfirm,
      selectedUniverses,
      affectedUniverses,
      hasOnConfirm: typeof onConfirm === 'function'
    });

    if (!canConfirm) {
      log('CONFIRM BLOCKED - canConfirm is false');
      return;
    }

    if (typeof onConfirm !== 'function') {
      console.error('[ApplyTargetModal] ERROR: onConfirm is not a function!', onConfirm);
      return;
    }

    const options = {
      fadeMs,
      universes: affectedUniverses,
      mergeMode: 'merge',
      scope: activeTab,
      channelsByUniverse: groupChannelsByUniverse
    };

    // Save targets to memory for future use
    saveTargetMemory({
      universes: affectedUniverses,
      fadeMs,
      scope: activeTab,
    });

    log('CALLING onConfirm with:', { item: item?.name || item?.id, options });

    try {
      onConfirm(item, options);
      log('onConfirm called successfully');
    } catch (err) {
      console.error('[ApplyTargetModal] ERROR in onConfirm:', err);
    }
  }, [canConfirm, onConfirm, item, fadeMs, affectedUniverses, activeTab, groupChannelsByUniverse, selectedUniverses]);

  // Get button colors based on mode
  const getPrimaryButtonClass = () => {
    switch (config.primaryColor) {
      case 'purple': return 'bg-purple-500 text-white';
      case 'amber': return 'bg-amber-500 text-black';
      case 'cyan': return 'bg-cyan-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  // Summary text
  const getSummaryText = () => {
    if (activeTab === 'groups') {
      const channelCount = groupChannelsByUniverse
        ? Object.values(groupChannelsByUniverse).flat().length
        : 0;
      return `${selectedGroups.length} group${selectedGroups.length !== 1 ? 's' : ''} • ${channelCount} channels`;
    }
    if (activeTab === 'fixtures') {
      const fixtureCount = Object.values(selectedFixtures).flat().length;
      return `${fixtureCount} fixture${fixtureCount !== 1 ? 's' : ''} across ${affectedUniverses.length} universe${affectedUniverses.length !== 1 ? 's' : ''}`;
    }
    const onlineCount = universeInfo.filter(u => selectedUniverses.includes(u.universe) && u.isOnline).length;
    return `${selectedUniverses.length} universe${selectedUniverses.length !== 1 ? 's' : ''} (${onlineCount} online)`;
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[#0a0a0f] z-[9999] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0d0d12]">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
          <div className="flex items-center gap-2">
            <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            <div>
              <h2 className="text-white font-bold text-base">{config.title(item)}</h2>
              {config.subtitle && config.subtitle(item) && (
                <p className="text-white/50 text-xs">{config.subtitle(item)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-[#0d0d12]">
        {availableTabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                isActive
                  ? 'text-white border-b-2 border-[var(--theme-primary)]'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Universes Tab */}
        {activeTab === 'universes' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2">
              {hasSavedTargets && (
                <button
                  onClick={selectLastUsed}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    usedLastTargets
                      ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border border-[var(--theme-primary)]'
                      : 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20'
                  }`}
                  title={`Last used: U${savedTargets.universes?.join(', U')}`}
                >
                  Last Used
                </button>
              )}
              <button
                onClick={selectAllUniverses}
                className="flex-1 py-2 px-3 rounded-xl bg-white/5 text-white/70 text-xs font-bold hover:bg-white/10 transition-colors"
              >
                All
              </button>
              <button
                onClick={selectOnlineOnly}
                className="flex-1 py-2 px-3 rounded-xl bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-colors"
              >
                Online Only
              </button>
              <button
                onClick={selectNone}
                className="flex-1 py-2 px-3 rounded-xl bg-white/5 text-white/70 text-xs font-bold hover:bg-white/10 transition-colors"
              >
                None
              </button>
            </div>

            {/* Universe Grid */}
            <div className="grid grid-cols-2 gap-3">
              {universeInfo.map(info => {
                const isSelected = selectedUniverses.includes(info.universe);
                return (
                  <button
                    key={info.universe}
                    onClick={() => toggleUniverse(info.universe)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]'
                        : 'bg-white/5 border-transparent hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-white">U{info.universe}</span>
                      <div className="flex items-center gap-1">
                        {isSelected && <Check size={16} className="text-[var(--theme-primary)]" />}
                        {info.isOnline ? (
                          <Wifi size={14} className="text-green-400" />
                        ) : (
                          <WifiOff size={14} className="text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-white/50">
                        {info.onlineCount}/{info.totalCount} nodes online
                      </div>
                      {info.fixtureCount > 0 && (
                        <div className="text-xs text-white/40">
                          {info.fixtureCount} fixture{info.fixtureCount !== 1 ? 's' : ''}
                        </div>
                      )}
                      {!info.hasPairedFixture && (
                        <div className="text-xs text-orange-400 mt-1">
                          No paired fixtures
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && config.showFixtures && (
          <div className="space-y-3">
            {universeInfo.map(info => {
              const fixtures = getFixturesForUniverse(info.universe);
              const isExpanded = expandedUniverse === info.universe;
              const selectedInUniverse = selectedFixtures[info.universe] || [];

              return (
                <div key={info.universe} className="rounded-2xl bg-white/5 overflow-hidden">
                  <button
                    onClick={() => setExpandedUniverse(isExpanded ? null : info.universe)}
                    className="w-full p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-white">Universe {info.universe}</span>
                      {info.isOnline ? (
                        <Wifi size={14} className="text-green-400" />
                      ) : (
                        <WifiOff size={14} className="text-red-400" />
                      )}
                      {selectedInUniverse.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--theme-primary)] text-black text-xs font-bold">
                          {selectedInUniverse.length}
                        </span>
                      )}
                    </div>
                    <ChevronRight
                      size={18}
                      className={`text-white/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {fixtures.length === 0 ? (
                        <div className="text-white/40 text-sm py-2">No fixtures in this universe</div>
                      ) : (
                        fixtures.map(fixture => {
                          const isSelected = selectedInUniverse.includes(fixture.id);
                          return (
                            <button
                              key={fixture.id}
                              onClick={() => toggleFixture(info.universe, fixture.id)}
                              className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]'
                                  : 'bg-white/5 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${fixture.isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                                <span className="text-white text-sm">{fixture.name}</span>
                              </div>
                              {isSelected ? (
                                <Check size={16} className="text-[var(--theme-primary)]" />
                              ) : (
                                <Square size={16} className="text-white/20" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && config.showGroups && (
          <div className="space-y-2">
            {groupsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader size={24} className="animate-spin text-white/40" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                No groups available
              </div>
            ) : (
              groups.map(group => {
                const isSelected = selectedGroups.includes(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-purple-500/20 border border-purple-500'
                        : 'bg-white/5 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <div className="text-left">
                        <div className="text-white font-medium">{group.name}</div>
                        <div className="text-white/50 text-xs">
                          U{group.universe} • {group.channels?.length || 0} channels
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check size={18} className="text-purple-400" />
                    ) : (
                      <Square size={18} className="text-white/20" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-[#0d0d12] p-4 space-y-3">
        {/* Fade Time */}
        {config.showFadeOptions && (
          <div className="flex gap-2">
            {[0, 500, 1000, 2000].map(ms => (
              <button
                key={ms}
                onClick={() => setFadeMs(ms)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                  fadeMs === ms
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {ms === 0 ? 'Snap' : `${ms / 1000}s`}
              </button>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="text-center text-xs">
          {validationMessage ? (
            <span className="text-red-400">{validationMessage}</span>
          ) : (
            <span className="text-white/50">{getSummaryText()}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/15 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            onPointerUp={handleConfirm}
            disabled={!canConfirm || loading}
            style={{ touchAction: 'manipulation' }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors select-none ${
              !canConfirm ? 'opacity-50 cursor-not-allowed' : ''
            } ${getPrimaryButtonClass()}`}
          >
            {loading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <>
                <IconComponent size={16} />
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
 */
export const useAISuggestionModal = (onApply) => {
  const [state, setState] = useState({ isOpen: false, item: null, targets: {} });

  const openAISuggestion = (suggestedItem, suggestedTargets = {}) => {
    setState({
      isOpen: true,
      item: suggestedItem,
      targets: {
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

// Export target memory utilities for use in other components (e.g., CommandPalette)
export { loadTargetMemory, saveTargetMemory, hasConsistentPreferences };

export default ApplyTargetModal;
