/**
 * TargetPicker - Unified scope/universe/group selection component
 *
 * Reusable component for selecting where to apply scenes, chases, etc.
 * Extracted from ApplyTargetModal for reuse across the app.
 */
import React, { memo, useState, useMemo, useEffect } from 'react';
import { Zap, Layers, Users, Loader } from 'lucide-react';
import axios from 'axios';
import { OnlineIndicator } from './StatusBadge';
import ActionButton from './ActionButton';

const AETHER_CORE_URL = `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8891`;

const SCOPE_OPTIONS = [
  { id: 'current', icon: Zap, label: 'Current', description: 'Apply to current universe only' },
  { id: 'selected', icon: Layers, label: 'Select', description: 'Choose specific universes' },
  { id: 'groups', icon: Users, label: 'Groups', description: 'Apply to fixture groups' },
  { id: 'all', icon: Layers, label: 'All', description: 'Apply to all universes' },
];

const TargetPicker = memo(function TargetPicker({
  // Current values
  scope = 'current',
  selectedUniverses = [],
  selectedGroups = [],
  // Callbacks
  onScopeChange,
  onUniversesChange,
  onGroupsChange,
  // Options
  availableUniverses = [1],
  currentUniverse = 1,
  showGroups = true,
  disabled = false,
  // Node status for online indicators
  nodes = [],
  className = '',
  style = {},
}) {
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Load groups when needed
  useEffect(() => {
    if (!showGroups || scope !== 'groups') return;

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
  }, [showGroups, scope]);

  // Filter scope options based on showGroups
  const visibleScopes = useMemo(() => {
    return showGroups
      ? SCOPE_OPTIONS
      : SCOPE_OPTIONS.filter(s => s.id !== 'groups');
  }, [showGroups]);

  // Toggle handlers
  const toggleUniverse = (u) => {
    const newSelection = selectedUniverses.includes(u)
      ? selectedUniverses.filter(x => x !== u)
      : [...selectedUniverses, u];
    onUniversesChange?.(newSelection);
  };

  const toggleGroup = (gid) => {
    const newSelection = selectedGroups.includes(gid)
      ? selectedGroups.filter(x => x !== gid)
      : [...selectedGroups, gid];
    onGroupsChange?.(newSelection);
  };

  // Check if universe has online nodes
  const isUniverseOnline = (u) => {
    return nodes.some(node => node.universe === u && node.status === 'online');
  };

  return (
    <div className={`target-picker ${className}`} style={style}>
      {/* Scope Selection */}
      <div
        className="target-picker__scopes"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${visibleScopes.length}, 1fr)`,
          gap: '6px',
          marginBottom: '12px',
        }}
      >
        {visibleScopes.map(({ id, icon: Icon, label }) => {
          const isActive = scope === id;
          const isWarning = id === 'all';
          const isGroup = id === 'groups';

          return (
            <button
              key={id}
              onClick={() => onScopeChange?.(id)}
              disabled={disabled}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                border: isActive
                  ? `1px solid ${isGroup ? '#8b5cf6' : isWarning ? '#f59e0b' : 'var(--theme-primary, #00ffaa)'}`
                  : '1px solid transparent',
                background: isActive
                  ? `${isGroup ? 'rgba(139, 92, 246, 0.2)' : isWarning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(var(--theme-primary-rgb, 0, 255, 170), 0.2)'}`
                  : 'rgba(255, 255, 255, 0.05)',
                color: isActive
                  ? (isGroup ? '#c4b5fd' : isWarning ? '#fcd34d' : 'var(--theme-primary, #00ffaa)')
                  : 'rgba(255, 255, 255, 0.5)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 700,
                transition: 'all 0.15s',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Universe Selection */}
      {scope === 'selected' && (
        <div
          className="target-picker__universes"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          {availableUniverses.map(u => {
            const isSelected = selectedUniverses.includes(u);
            const isOnline = isUniverseOnline(u);

            return (
              <button
                key={u}
                onClick={() => toggleUniverse(u)}
                disabled={disabled}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSelected
                    ? 'var(--theme-primary, #00ffaa)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: isSelected ? 'black' : 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                <OnlineIndicator isOnline={isOnline} size={6} />
                U{u}
              </button>
            );
          })}
        </div>
      )}

      {/* Group Selection */}
      {scope === 'groups' && showGroups && (
        <div
          className="target-picker__groups"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            maxHeight: '100px',
            overflowY: 'auto',
            marginBottom: '8px',
          }}
        >
          {groupsLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '12px',
            }}>
              <Loader size={12} className="animate-spin" />
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>
              No groups available
            </div>
          ) : (
            groups.map(g => {
              const isSelected = selectedGroups.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  disabled={disabled}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
                    color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {g.name}
                  <span style={{ opacity: 0.6, marginLeft: '4px' }}>U{g.universe}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
});

export default TargetPicker;
