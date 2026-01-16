/**
 * ApplyTargetModal - Compact "Apply Target" UI optimized for 7" touchscreen (800x480)
 *
 * Slide-up panel design - minimal footprint, quick selection
 * - Universe chips for fast selection
 * - Quick actions: All, Online, Last Used
 * - Fade time presets
 * - Single API call with universes array
 */
import React, { useState, useMemo, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { X, Play, Zap, Wifi, WifiOff, Check, Music, Sparkles, Film } from "lucide-react";
import useNodeStore from "../store/nodeStore";
import useDMXStore from "../store/dmxStore";

const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

// ============================================================
// Target Memory - Remembers user's last-used targets
// ============================================================
const TARGET_MEMORY_KEY = 'aether-target-memory';
const TARGET_MEMORY_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadTargetMemory() {
  try {
    const stored = localStorage.getItem(TARGET_MEMORY_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (data.timestamp && Date.now() - data.timestamp > TARGET_MEMORY_EXPIRY_MS) {
      localStorage.removeItem(TARGET_MEMORY_KEY);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

function saveTargetMemory(targets) {
  try {
    const data = {
      ...targets,
      timestamp: Date.now(),
      useCount: (loadTargetMemory()?.useCount || 0) + 1,
    };
    localStorage.setItem(TARGET_MEMORY_KEY, JSON.stringify(data));
  } catch (e) {}
}

function hasConsistentPreferences() {
  const memory = loadTargetMemory();
  return memory && memory.useCount >= 3;
}

// Mode configurations
const MODE_CONFIG = {
  scene: { icon: Play, color: '#22c55e', label: 'Apply Scene', showFade: true },
  look: { icon: Play, color: '#06b6d4', label: 'Play Look', showFade: true },
  chase: { icon: Music, color: '#a855f7', label: 'Play Chase', showFade: true },
  sequence: { icon: Music, color: '#a855f7', label: 'Play Sequence', showFade: false },
  show: { icon: Film, color: '#f59e0b', label: 'Run Show', showFade: false },
  ai_scene: { icon: Sparkles, color: '#06b6d4', label: 'Apply', showFade: true },
};

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

  // Load saved targets
  const savedTargets = useMemo(() => loadTargetMemory(), []);
  const hasSavedTargets = savedTargets && savedTargets.universes?.length > 0;

  // State
  const [selectedUniverses, setSelectedUniverses] = useState(defaultTargets.universes || []);
  const [fadeMs, setFadeMs] = useState(defaultTargets.fadeMs || 1000);
  const [applyToAllFixtures, setApplyToAllFixtures] = useState(false);

  // Build universe info
  const universeInfo = useMemo(() => {
    const fromNodes = [...new Set(nodes.map(n => n.universe || 1))].sort((a, b) => a - b);
    const allUniverses = fromNodes.length > 0 ? fromNodes : configuredUniverses;

    return allUniverses.map(u => {
      const universeNodes = nodes.filter(n => n.universe === u);
      const onlineNodes = universeNodes.filter(n => n.status === 'online');
      return {
        universe: u,
        isOnline: onlineNodes.length > 0,
        onlineCount: onlineNodes.length,
        totalCount: universeNodes.length,
      };
    });
  }, [nodes, configuredUniverses]);

  // Toggle universe
  const toggleUniverse = (u) => {
    setSelectedUniverses(prev =>
      prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
    );
  };

  // Quick actions
  const selectAll = () => setSelectedUniverses(universeInfo.map(u => u.universe));
  const selectOnline = () => setSelectedUniverses(universeInfo.filter(u => u.isOnline).map(u => u.universe));
  const selectLastUsed = () => {
    if (savedTargets?.universes) setSelectedUniverses(savedTargets.universes);
    if (savedTargets?.fadeMs) setFadeMs(savedTargets.fadeMs);
  };

  // Validation
  const canConfirm = selectedUniverses.length > 0;

  // Handle confirm
  const handleConfirm = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!canConfirm || typeof onConfirm !== 'function') return;

    const options = {
      fadeMs,
      universes: selectedUniverses,
      mergeMode: 'merge',
      applyToAllFixtures,
    };

    saveTargetMemory({ universes: selectedUniverses, fadeMs });
    onConfirm(item, options);
  }, [canConfirm, onConfirm, item, fadeMs, selectedUniverses]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return ReactDOM.createPortal(
    <div className="target-modal-overlay" onClick={onCancel}>
      <div className="target-modal" onClick={e => e.stopPropagation()}>
        {/* Header - compact */}
        <div className="modal-header">
          <div className="header-title">
            <IconComponent size={18} style={{ color: config.color }} />
            <span>{item?.name || 'Apply'}</span>
          </div>
          <button className="close-btn" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          {hasSavedTargets && (
            <button className="quick-btn accent" onClick={selectLastUsed}>Last</button>
          )}
          <button className="quick-btn" onClick={selectAll}>All</button>
          <button className="quick-btn online" onClick={selectOnline}>Online</button>
        </div>

        {/* Universe Chips */}
        <div className="universe-chips">
          {universeInfo.map(info => {
            const isSelected = selectedUniverses.includes(info.universe);
            return (
              <button
                key={info.universe}
                className={`universe-chip ${isSelected ? 'selected' : ''} ${info.isOnline ? 'online' : 'offline'}`}
                onClick={() => toggleUniverse(info.universe)}
              >
                <span className="u-label">U{info.universe}</span>
                {info.isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isSelected && <Check size={12} className="check" />}
              </button>
            );
          })}
        </div>

        {/* Fade Time - only if applicable */}
        {config.showFade && (
          <div className="fade-row">
            <span className="fade-label">Fade:</span>
            <div className="fade-options">
              {[0, 500, 1000, 2000].map(ms => (
                <button
                  key={ms}
                  className={`fade-btn ${fadeMs === ms ? 'active' : ''}`}
                  onClick={() => setFadeMs(ms)}
                >
                  {ms === 0 ? 'Snap' : `${ms / 1000}s`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Apply to All Fixtures Toggle - for scenes */}
        {mode === 'scene' && (
          <div className="fixture-toggle-row">
            <button
              className={`fixture-toggle ${applyToAllFixtures ? 'active' : ''}`}
              onClick={() => setApplyToAllFixtures(!applyToAllFixtures)}
            >
              <Zap size={14} />
              <span>Apply to all fixtures</span>
              {applyToAllFixtures && <Check size={14} className="check" />}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button
            className="confirm-btn"
            style={{ background: canConfirm ? config.color : 'rgba(255,255,255,0.1)' }}
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
          >
            <IconComponent size={16} />
            <span>{config.label}</span>
          </button>
        </div>
      </div>

      <style>{`
        .target-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .target-modal {
          width: 100%;
          max-width: 500px;
          background: #12121a;
          border-radius: 16px 16px 0 0;
          padding: 12px 16px 16px;
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .quick-actions {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }

        .quick-btn {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: none;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .quick-btn:hover {
          background: rgba(255,255,255,0.12);
        }

        .quick-btn.accent {
          background: rgba(var(--accent-rgb), 0.2);
          color: var(--accent);
        }

        .quick-btn.online {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .universe-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .universe-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 2px solid transparent;
          color: rgba(255,255,255,0.6);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .universe-chip:hover {
          background: rgba(255,255,255,0.1);
        }

        .universe-chip.selected {
          background: rgba(var(--accent-rgb), 0.15);
          border-color: var(--accent);
          color: var(--accent);
        }

        .universe-chip.online svg:not(.check) {
          color: #22c55e;
        }

        .universe-chip.offline svg:not(.check) {
          color: #ef4444;
        }

        .universe-chip .check {
          color: var(--accent);
        }

        .u-label {
          font-weight: 700;
        }

        .fade-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .fade-label {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          min-width: 36px;
        }

        .fade-options {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        .fade-btn {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .fade-btn.active {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        .fixture-toggle-row {
          margin-bottom: 12px;
        }

        .fixture-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 2px solid transparent;
          color: rgba(255,255,255,0.6);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .fixture-toggle:hover {
          background: rgba(255,255,255,0.1);
        }

        .fixture-toggle.active {
          background: rgba(168, 85, 247, 0.15);
          border-color: #a855f7;
          color: #a855f7;
        }

        .fixture-toggle .check {
          margin-left: auto;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
        }

        .cancel-btn {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.08);
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .confirm-btn {
          flex: 2;
          padding: 14px;
          border-radius: 12px;
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.15s;
        }

        .confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Kiosk optimizations (800x480) */
        @media (max-height: 520px) {
          .target-modal {
            padding: 10px 14px 14px;
          }

          .modal-header {
            margin-bottom: 8px;
          }

          .header-title {
            font-size: 14px;
          }

          .quick-actions {
            margin-bottom: 8px;
          }

          .quick-btn {
            padding: 6px;
            font-size: 11px;
          }

          .universe-chips {
            margin-bottom: 8px;
            gap: 6px;
          }

          .universe-chip {
            padding: 8px 10px;
            font-size: 12px;
          }

          .fade-row {
            margin-bottom: 10px;
          }

          .fade-btn {
            padding: 6px;
            font-size: 11px;
          }

          .modal-actions {
            gap: 8px;
          }

          .cancel-btn, .confirm-btn {
            padding: 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

// Hook for AI suggestions
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

export { loadTargetMemory, saveTargetMemory, hasConsistentPreferences };
export default ApplyTargetModal;
