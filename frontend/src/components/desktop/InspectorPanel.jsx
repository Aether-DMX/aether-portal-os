import React from 'react';
import { ChevronLeft, ChevronRight, Play, Edit3, Trash2, Copy } from 'lucide-react';

export default function InspectorPanel({ collapsed, onToggle, item }) {
  if (collapsed) {
    return (
      <aside className="inspector-panel collapsed">
        <button className="inspector-toggle" onClick={onToggle}>
          <ChevronLeft size={16} />
        </button>
        <style>{collapsedStyles}</style>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel">
      <button className="inspector-toggle" onClick={onToggle}>
        <ChevronRight size={16} />
      </button>

      <div className="inspector-content">
        {item ? (
          <InspectorContent item={item} />
        ) : (
          <div className="inspector-empty">
            <p>Select or hover over an item to see details</p>
          </div>
        )}
      </div>

      <style>{`
        .inspector-panel {
          width: 280px;
          background: rgba(15, 15, 25, 0.95);
          border-left: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          position: relative;
          transition: width 0.2s ease;
        }

        .inspector-toggle {
          position: absolute;
          top: 12px;
          left: -12px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(30, 30, 45, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
        }

        .inspector-toggle:hover {
          background: rgba(50, 50, 70, 0.95);
          color: white;
        }

        .inspector-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .inspector-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 13px;
          padding: 24px;
        }

        ${collapsedStyles}
      `}</style>
    </aside>
  );
}

const collapsedStyles = `
  .inspector-panel.collapsed {
    width: 20px;
    background: transparent;
    border: none;
  }

  .inspector-panel.collapsed .inspector-toggle {
    left: -8px;
  }
`;

function InspectorContent({ item }) {
  // Determine item type and render appropriate content
  const itemType = getItemType(item);

  return (
    <div className="inspector-item">
      {/* Header */}
      <div className="inspector-header">
        <span className="inspector-type">{itemType}</span>
        <h3 className="inspector-title">{item.name || 'Unnamed'}</h3>
      </div>

      {/* Preview/Color */}
      {itemType === 'Scene' && <ScenePreview item={item} />}
      {itemType === 'Chase' && <ChasePreview item={item} />}
      {itemType === 'Fixture' && <FixturePreview item={item} />}
      {itemType === 'Node' && <NodePreview item={item} />}

      {/* Properties */}
      <div className="inspector-properties">
        {itemType === 'Scene' && <SceneProperties item={item} />}
        {itemType === 'Chase' && <ChaseProperties item={item} />}
        {itemType === 'Fixture' && <FixtureProperties item={item} />}
        {itemType === 'Node' && <NodeProperties item={item} />}
      </div>

      {/* Actions */}
      <div className="inspector-actions">
        {(itemType === 'Scene' || itemType === 'Chase') && (
          <button className="action-btn primary">
            <Play size={14} /> Play
          </button>
        )}
        <button className="action-btn">
          <Edit3 size={14} /> Edit
        </button>
        <button className="action-btn">
          <Copy size={14} /> Duplicate
        </button>
        <button className="action-btn danger">
          <Trash2 size={14} /> Delete
        </button>
      </div>

      <style>{`
        .inspector-item {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .inspector-header {
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .inspector-type {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--theme-primary, #00ffaa);
          margin-bottom: 4px;
          display: block;
        }

        .inspector-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .inspector-preview {
          width: 100%;
          height: 80px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .inspector-properties {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .property-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .property-label {
          color: rgba(255, 255, 255, 0.5);
        }

        .property-value {
          color: white;
          font-weight: 500;
        }

        .inspector-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .action-btn {
          flex: 1;
          min-width: calc(50% - 4px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .action-btn.primary {
          background: var(--theme-primary, #00ffaa);
          color: #000;
        }

        .action-btn.primary:hover {
          filter: brightness(1.1);
        }

        .action-btn.danger:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .color-preview {
          width: 100%;
          height: 60px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.online {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .status-badge.offline {
          background: rgba(234, 179, 8, 0.2);
          color: #eab308;
        }
      `}</style>
    </div>
  );
}

function getItemType(item) {
  if (item.scene_id) return 'Scene';
  if (item.chase_id) return 'Chase';
  if (item.fixture_id) return 'Fixture';
  if (item.node_id) return 'Node';
  if (item.channels) return 'Scene';
  if (item.steps) return 'Chase';
  if (item.type === 'hardwired' || item.type === 'wireless') return 'Node';
  return 'Item';
}

function ScenePreview({ item }) {
  const color = item.color || getSceneColor(item);
  return (
    <div
      className="color-preview"
      style={{ background: color || 'linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.3), rgba(var(--theme-primary-rgb), 0.1))' }}
    />
  );
}

function ChasePreview({ item }) {
  return (
    <div
      className="inspector-preview"
      style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))' }}
    >
      <span style={{ color: '#22c55e', fontSize: 12 }}>
        {item.steps?.length || 0} steps
      </span>
    </div>
  );
}

function FixturePreview({ item }) {
  return (
    <div
      className="inspector-preview"
      style={{ background: 'rgba(255, 255, 255, 0.03)' }}
    >
      <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
        {item.type || 'Generic'}
      </span>
    </div>
  );
}

function NodePreview({ item }) {
  const isOnline = item.status === 'online';
  return (
    <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}

function SceneProperties({ item }) {
  const channelCount = Object.keys(item.channels || {}).length;
  return (
    <>
      <div className="property-row">
        <span className="property-label">Channels</span>
        <span className="property-value">{channelCount}</span>
      </div>
      <div className="property-row">
        <span className="property-label">Fade Time</span>
        <span className="property-value">{item.fade_time || 1000}ms</span>
      </div>
      <div className="property-row">
        <span className="property-label">ID</span>
        <span className="property-value" style={{ fontSize: 10, opacity: 0.6 }}>
          {item.scene_id || item.id}
        </span>
      </div>
    </>
  );
}

function ChaseProperties({ item }) {
  return (
    <>
      <div className="property-row">
        <span className="property-label">Steps</span>
        <span className="property-value">{item.steps?.length || 0}</span>
      </div>
      <div className="property-row">
        <span className="property-label">Speed</span>
        <span className="property-value">{item.speed || 1000}ms</span>
      </div>
      <div className="property-row">
        <span className="property-label">Mode</span>
        <span className="property-value">{item.mode || 'Loop'}</span>
      </div>
    </>
  );
}

function FixtureProperties({ item }) {
  return (
    <>
      <div className="property-row">
        <span className="property-label">Type</span>
        <span className="property-value">{item.type || 'Generic'}</span>
      </div>
      <div className="property-row">
        <span className="property-label">DMX Address</span>
        <span className="property-value">{item.start_channel || 1}</span>
      </div>
      <div className="property-row">
        <span className="property-label">Channels</span>
        <span className="property-value">{item.channel_count || 1}</span>
      </div>
      <div className="property-row">
        <span className="property-label">Universe</span>
        <span className="property-value">{item.universe || 1}</span>
      </div>
    </>
  );
}

function NodeProperties({ item }) {
  return (
    <>
      <div className="property-row">
        <span className="property-label">Type</span>
        <span className="property-value">{item.type || 'Unknown'}</span>
      </div>
      <div className="property-row">
        <span className="property-label">Universe</span>
        <span className="property-value">{item.universe || 1}</span>
      </div>
      <div className="property-row">
        <span className="property-label">Channels</span>
        <span className="property-value">
          {item.channel_start || 1} - {item.channel_end || 512}
        </span>
      </div>
      {item.ip && (
        <div className="property-row">
          <span className="property-label">IP</span>
          <span className="property-value">{item.ip}</span>
        </div>
      )}
    </>
  );
}

function getSceneColor(scene) {
  const ch = scene.channels || {};
  const r = ch['1:1'] ?? ch['1'] ?? ch[1] ?? 0;
  const g = ch['1:2'] ?? ch['2'] ?? ch[2] ?? 0;
  const b = ch['1:3'] ?? ch['3'] ?? ch[3] ?? 0;
  if (r + g + b < 30) return null;
  return `rgb(${r}, ${g}, ${b})`;
}
