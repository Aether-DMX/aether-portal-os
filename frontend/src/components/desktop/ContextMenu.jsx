import React, { useEffect, useRef } from 'react';
import { Play, Edit3, Trash2, Copy, Plus, Star, Settings } from 'lucide-react';

/**
 * Context menu component for right-click actions
 * Usage:
 * <ContextMenu
 *   x={mouseX}
 *   y={mouseY}
 *   items={[
 *     { label: 'Play', icon: Play, action: () => playScene(id) },
 *     { label: 'Edit', icon: Edit3, action: () => editScene(id) },
 *     { divider: true },
 *     { label: 'Delete', icon: Trash2, action: () => deleteScene(id), danger: true },
 *   ]}
 *   onClose={() => setContextMenu(null)}
 * />
 */
export default function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = useAdjustedPosition(x, y, menuRef);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={index} className="context-divider" />;
        }

        const Icon = item.icon;

        return (
          <button
            key={index}
            className={`context-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            {Icon && <Icon size={16} className="context-icon" />}
            <span className="context-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-shortcut">{item.shortcut}</span>
            )}
          </button>
        );
      })}

      <style>{`
        .context-menu {
          position: fixed;
          min-width: 180px;
          background: rgba(25, 25, 35, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          padding: 6px;
          z-index: 10000;
          backdrop-filter: blur(12px);
        }

        .context-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.1s;
          text-align: left;
        }

        .context-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .context-item.danger {
          color: #f87171;
        }

        .context-item.danger:hover {
          background: rgba(248, 113, 113, 0.15);
        }

        .context-item.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .context-item.disabled:hover {
          background: transparent;
        }

        .context-icon {
          flex-shrink: 0;
          opacity: 0.7;
        }

        .context-label {
          flex: 1;
        }

        .context-shortcut {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
          font-family: monospace;
        }

        .context-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 6px 8px;
        }
      `}</style>
    </div>
  );
}

// Hook to adjust menu position to stay within viewport
function useAdjustedPosition(x, y, menuRef) {
  const [position, setPosition] = React.useState({ x, y });

  useEffect(() => {
    if (!menuRef.current) {
      setPosition({ x, y });
      return;
    }

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Keep within horizontal bounds
    if (x + rect.width > viewportWidth - 10) {
      adjustedX = viewportWidth - rect.width - 10;
    }
    if (adjustedX < 10) {
      adjustedX = 10;
    }

    // Keep within vertical bounds
    if (y + rect.height > viewportHeight - 10) {
      adjustedY = viewportHeight - rect.height - 10;
    }
    if (adjustedY < 10) {
      adjustedY = 10;
    }

    setPosition({ x: adjustedX, y: adjustedY });
  }, [x, y, menuRef]);

  return position;
}

// Preset context menu configurations
export const sceneContextMenu = (scene, { onPlay, onEdit, onDuplicate, onDelete, onAddToQuick }) => [
  { label: 'Play Scene', icon: Play, action: () => onPlay?.(scene), shortcut: 'Enter' },
  { label: 'Edit', icon: Edit3, action: () => onEdit?.(scene), shortcut: 'E' },
  { label: 'Duplicate', icon: Copy, action: () => onDuplicate?.(scene), shortcut: 'Cmd+D' },
  { divider: true },
  { label: 'Add to Quick Scenes', icon: Star, action: () => onAddToQuick?.(scene) },
  { divider: true },
  { label: 'Delete', icon: Trash2, action: () => onDelete?.(scene), danger: true, shortcut: 'Del' },
];

export const chaseContextMenu = (chase, { onPlay, onEdit, onDuplicate, onDelete }) => [
  { label: 'Start Chase', icon: Play, action: () => onPlay?.(chase), shortcut: 'Enter' },
  { label: 'Edit', icon: Edit3, action: () => onEdit?.(chase), shortcut: 'E' },
  { label: 'Duplicate', icon: Copy, action: () => onDuplicate?.(chase), shortcut: 'Cmd+D' },
  { divider: true },
  { label: 'Delete', icon: Trash2, action: () => onDelete?.(chase), danger: true, shortcut: 'Del' },
];

export const fixtureContextMenu = (fixture, { onControl, onEdit, onGroup, onDelete }) => [
  { label: 'Control', icon: Settings, action: () => onControl?.(fixture), shortcut: 'Enter' },
  { label: 'Edit', icon: Edit3, action: () => onEdit?.(fixture), shortcut: 'E' },
  { label: 'Add to Group', icon: Plus, action: () => onGroup?.(fixture) },
  { divider: true },
  { label: 'Delete', icon: Trash2, action: () => onDelete?.(fixture), danger: true, shortcut: 'Del' },
];

export const nodeContextMenu = (node, { onOpen, onRename, onUnpair }) => [
  { label: 'Open Detail', icon: Settings, action: () => onOpen?.(node), shortcut: 'Enter' },
  { label: 'Rename', icon: Edit3, action: () => onRename?.(node), shortcut: 'F2' },
  { divider: true },
  { label: 'Unpair Node', icon: Trash2, action: () => onUnpair?.(node), danger: true },
];
