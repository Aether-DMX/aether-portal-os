import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Play, Pause, Square, Edit3, Trash2, Copy,
  AlertTriangle, Activity, Layers, Zap, Radio, Box, Clock, Volume2,
  Eye, EyeOff, RotateCcw, Settings, Sliders
} from 'lucide-react';
import usePlaybackStore from '../../store/playbackStore';
import useSceneStore from '../../store/sceneStore';
import useChaseStore from '../../store/chaseStore';
import useNodeStore from '../../store/nodeStore';
import useDMXStore from '../../store/dmxStore';
import { useDesktop } from './DesktopShell';

export default function InspectorPanel({ collapsed, onToggle, item, width = 300 }) {
  const navigate = useNavigate();
  const { playback, stopAll } = usePlaybackStore();
  const { scenes, playScene, stopScene } = useSceneStore();
  const { chases, startChase, stopChase } = useChaseStore();
  const { nodes } = useNodeStore();
  const { blackoutAll, masterValue } = useDMXStore();
  const desktopContext = useDesktop();
  const currentIntent = desktopContext?.currentIntent || null;

  // Determine what to show in inspector based on context
  const inspectorContent = useMemo(() => {
    // If we have a selected/hovered item, show its details
    if (item) {
      return { type: 'item', data: item };
    }

    // Otherwise, show context-aware default content
    const activePlayback = Object.entries(playback);
    const warnings = [];
    const offlineNodes = nodes.filter(n => n.status !== 'online');

    if (offlineNodes.length > 0) {
      warnings.push({
        id: 'offline-nodes',
        type: 'warning',
        message: `${offlineNodes.length} node${offlineNodes.length > 1 ? 's' : ''} offline`,
        action: () => navigate('/nodes'),
      });
    }

    return {
      type: 'default',
      nowPlaying: activePlayback,
      warnings,
      overrides: [], // Future: active modifiers/overrides
    };
  }, [item, playback, nodes, navigate]);

  if (collapsed) {
    return (
      <aside className="inspector-panel collapsed" style={{ width: 20 }}>
        <button className="inspector-toggle" onClick={onToggle}>
          <ChevronLeft size={16} />
        </button>
        <style>{collapsedStyles}</style>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel" style={{ width }}>
      <button className="inspector-toggle" onClick={onToggle}>
        <ChevronRight size={16} />
      </button>

      <div className="inspector-content">
        {inspectorContent.type === 'item' ? (
          <ItemInspector item={inspectorContent.data} />
        ) : (
          <DefaultInspector
            nowPlaying={inspectorContent.nowPlaying}
            warnings={inspectorContent.warnings}
            overrides={inspectorContent.overrides}
          />
        )}
      </div>

      <style>{inspectorStyles}</style>
    </aside>
  );
}

// Default view when nothing is selected
function DefaultInspector({ nowPlaying, warnings, overrides }) {
  const navigate = useNavigate();
  const { stopAll } = usePlaybackStore();
  const { scenes } = useSceneStore();
  const { chases } = useChaseStore();
  const { blackoutAll, masterValue } = useDMXStore();

  // Filter out null/undefined playback entries
  const validPlayback = nowPlaying.filter(([, pb]) => pb && pb.type);
  const hasPlayback = validPlayback.length > 0;

  return (
    <div className="inspector-default">
      {/* Now Playing Section */}
      <InspectorSection title="Now Playing" icon={Activity}>
        {hasPlayback ? (
          <div className="now-playing-list">
            {validPlayback.map(([universe, pb]) => (
              <NowPlayingItem
                key={universe}
                universe={universe}
                playback={pb}
                scenes={scenes}
                chases={chases}
              />
            ))}
            <button className="stop-all-btn" onClick={() => stopAll()}>
              <Square size={14} />
              Stop All
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">●</span>
            <span>Nothing playing</span>
          </div>
        )}
      </InspectorSection>

      {/* Master Control */}
      <InspectorSection title="Master" icon={Sliders}>
        <div className="master-control">
          <div className="master-value">{Math.round(masterValue || 100)}%</div>
          <div className="master-bar">
            <div
              className="master-fill"
              style={{ width: `${masterValue || 100}%` }}
            />
          </div>
        </div>
      </InspectorSection>

      {/* Active Overrides */}
      {overrides.length > 0 && (
        <InspectorSection title="Active Overrides" icon={Layers}>
          <div className="overrides-list">
            {overrides.map((override, i) => (
              <div key={i} className="override-item">
                <span>{override.name}</span>
                <button className="override-remove">×</button>
              </div>
            ))}
          </div>
        </InspectorSection>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <InspectorSection title="Warnings" icon={AlertTriangle} warning>
          <div className="warnings-list">
            {warnings.map((warning) => (
              <button
                key={warning.id}
                className="warning-item"
                onClick={warning.action}
              >
                <AlertTriangle size={14} />
                <span>{warning.message}</span>
              </button>
            ))}
          </div>
        </InspectorSection>
      )}

      {/* Quick Actions */}
      <InspectorSection title="Quick Actions" icon={Zap}>
        <div className="quick-actions">
          <button
            className="quick-action blackout"
            onClick={() => blackoutAll(500)}
          >
            <EyeOff size={16} />
            Blackout
          </button>
          <button
            className="quick-action"
            onClick={() => navigate('/scenes')}
          >
            <Layers size={16} />
            Scenes
          </button>
          <button
            className="quick-action"
            onClick={() => navigate('/chases')}
          >
            <Zap size={16} />
            Chases
          </button>
        </div>
      </InspectorSection>
    </div>
  );
}

// Now Playing Item component
function NowPlayingItem({ universe, playback, scenes, chases }) {
  const { stopAll } = usePlaybackStore();

  const getName = () => {
    if (playback.type === 'scene') {
      const scene = scenes.find(s => s.id === playback.id || s.scene_id === playback.id);
      return scene?.name || playback.id;
    }
    if (playback.type === 'chase') {
      const chase = chases.find(c => c.id === playback.id || c.chase_id === playback.id);
      return chase?.name || playback.id;
    }
    return playback.name || playback.id || 'Unknown';
  };

  return (
    <div className="now-playing-item">
      <div className="playing-indicator">
        <span className="pulse-dot" />
      </div>
      <div className="playing-info">
        <span className="playing-name">{getName().replace(/_/g, ' ')}</span>
        <span className="playing-meta">
          {playback.type} • Universe {universe}
        </span>
      </div>
      <button
        className="playing-stop"
        onClick={() => stopAll(parseInt(universe))}
      >
        <Square size={12} />
      </button>
    </div>
  );
}

// Inspector Section component
function InspectorSection({ title, icon: Icon, children, warning }) {
  return (
    <div className={`inspector-section ${warning ? 'warning' : ''}`}>
      <div className="section-header">
        {Icon && <Icon size={14} className="section-icon" />}
        <span className="section-title">{title}</span>
      </div>
      <div className="section-content">
        {children}
      </div>
    </div>
  );
}

// Item Inspector - shows details for selected item
function ItemInspector({ item }) {
  const navigate = useNavigate();
  const { playScene, stopScene, isScenePlaying } = useSceneStore();
  const { startChase, stopChase, isChasePlaying } = useChaseStore();

  const itemType = getItemType(item);
  const isPlaying = itemType === 'Scene'
    ? isScenePlaying(item.id || item.scene_id)
    : itemType === 'Chase'
      ? isChasePlaying(item.id || item.chase_id)
      : false;

  const handlePlay = () => {
    const id = item.id || item.scene_id || item.chase_id;
    if (itemType === 'Scene') {
      if (isPlaying) {
        stopScene(id);
      } else {
        playScene(id, item.fade_time || 1000);
      }
    } else if (itemType === 'Chase') {
      if (isPlaying) {
        stopChase(id);
      } else {
        startChase(id);
      }
    }
  };

  const handleEdit = () => {
    const id = item.id || item.scene_id || item.chase_id || item.fixture_id;
    if (itemType === 'Scene') {
      navigate(`/scenes?edit=${id}`);
    } else if (itemType === 'Chase') {
      navigate(`/chases?edit=${id}`);
    } else if (itemType === 'Fixture') {
      navigate(`/fixtures?edit=${id}`);
    }
  };

  return (
    <div className="inspector-item">
      {/* Header */}
      <div className="inspector-header">
        <div className="header-badge">
          <span className={`type-badge ${itemType.toLowerCase()}`}>
            {itemType}
          </span>
          {isPlaying && <span className="playing-badge">Playing</span>}
        </div>
        <h3 className="inspector-title">{item.name || 'Unnamed'}</h3>
      </div>

      {/* Preview */}
      <div className="inspector-preview-section">
        {itemType === 'Scene' && <ScenePreview item={item} isPlaying={isPlaying} />}
        {itemType === 'Chase' && <ChasePreview item={item} isPlaying={isPlaying} />}
        {itemType === 'Fixture' && <FixturePreview item={item} />}
        {itemType === 'Node' && <NodePreview item={item} />}
      </div>

      {/* Identity Section */}
      <InspectorSection title="Identity" icon={Box}>
        <div className="properties-grid">
          <PropertyRow label="ID" value={item.id || item.scene_id || item.chase_id || item.fixture_id || '-'} mono />
          {item.universe && <PropertyRow label="Universe" value={item.universe} />}
          {item.group && <PropertyRow label="Group" value={item.group} />}
        </div>
      </InspectorSection>

      {/* Playback State (for Scene/Chase) */}
      {(itemType === 'Scene' || itemType === 'Chase') && (
        <InspectorSection title="Playback" icon={Activity}>
          <div className="properties-grid">
            <PropertyRow
              label="State"
              value={isPlaying ? 'Playing' : 'Stopped'}
              highlight={isPlaying}
            />
            {itemType === 'Scene' && (
              <PropertyRow label="Fade Time" value={`${item.fade_time || 1000}ms`} />
            )}
            {itemType === 'Chase' && (
              <>
                <PropertyRow label="Speed" value={`${item.speed || 1000}ms`} />
                <PropertyRow label="Mode" value={item.mode || 'Loop'} />
              </>
            )}
          </div>
        </InspectorSection>
      )}

      {/* Parameters Section */}
      <InspectorSection title="Parameters" icon={Sliders}>
        {itemType === 'Scene' && <SceneParameters item={item} />}
        {itemType === 'Chase' && <ChaseParameters item={item} />}
        {itemType === 'Fixture' && <FixtureParameters item={item} />}
        {itemType === 'Node' && <NodeParameters item={item} />}
      </InspectorSection>

      {/* Actions */}
      <div className="inspector-actions">
        {(itemType === 'Scene' || itemType === 'Chase') && (
          <button
            className={`action-btn primary ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlay}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        )}
        <button className="action-btn" onClick={handleEdit}>
          <Edit3 size={14} /> Edit
        </button>
        <button className="action-btn">
          <Copy size={14} /> Duplicate
        </button>
        <button className="action-btn danger">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

// Property Row component
function PropertyRow({ label, value, mono, highlight }) {
  return (
    <div className="property-row">
      <span className="property-label">{label}</span>
      <span className={`property-value ${mono ? 'mono' : ''} ${highlight ? 'highlight' : ''}`}>
        {value}
      </span>
    </div>
  );
}

// Preview Components
function ScenePreview({ item, isPlaying }) {
  const color = item.color || getSceneColor(item);
  return (
    <div
      className={`color-preview ${isPlaying ? 'playing' : ''}`}
      style={{
        background: color || 'linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.3), rgba(var(--theme-primary-rgb), 0.1))'
      }}
    >
      {isPlaying && <span className="preview-playing-indicator" />}
    </div>
  );
}

function ChasePreview({ item, isPlaying }) {
  return (
    <div className={`chase-preview ${isPlaying ? 'playing' : ''}`}>
      <div className="chase-steps">
        {(item.steps || []).slice(0, 8).map((step, i) => (
          <div
            key={i}
            className="chase-step"
            style={{
              animationDelay: isPlaying ? `${i * 0.1}s` : '0s'
            }}
          />
        ))}
      </div>
      <span className="chase-step-count">
        {item.steps?.length || 0} steps
      </span>
    </div>
  );
}

function FixturePreview({ item }) {
  return (
    <div className="fixture-preview">
      <div className="fixture-icon">
        <Box size={32} />
      </div>
      <span className="fixture-type">{item.type || 'Generic'}</span>
    </div>
  );
}

function NodePreview({ item }) {
  const isOnline = item.status === 'online';
  return (
    <div className={`node-preview ${isOnline ? 'online' : 'offline'}`}>
      <Radio size={24} />
      <span className="node-status">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}

// Parameter Components
function SceneParameters({ item }) {
  const channelCount = Object.keys(item.channels || {}).length;
  return (
    <div className="properties-grid">
      <PropertyRow label="Channels" value={channelCount} />
      <PropertyRow label="Color" value={item.color || 'Auto'} />
    </div>
  );
}

function ChaseParameters({ item }) {
  return (
    <div className="properties-grid">
      <PropertyRow label="Steps" value={item.steps?.length || 0} />
      <PropertyRow label="Direction" value={item.direction || 'Forward'} />
      <PropertyRow label="Fade" value={item.fade ? 'Yes' : 'No'} />
    </div>
  );
}

function FixtureParameters({ item }) {
  return (
    <div className="properties-grid">
      <PropertyRow label="Type" value={item.type || 'Generic'} />
      <PropertyRow label="Address" value={item.start_channel || 1} />
      <PropertyRow label="Channels" value={item.channel_count || 1} />
      <PropertyRow label="Universe" value={item.universe || 1} />
    </div>
  );
}

function NodeParameters({ item }) {
  return (
    <div className="properties-grid">
      <PropertyRow label="Type" value={item.type || 'Unknown'} />
      <PropertyRow label="Universe" value={item.universe || 1} />
      <PropertyRow label="Channels" value={`${item.channel_start || 1} - ${item.channel_end || 512}`} />
      {item.ip && <PropertyRow label="IP" value={item.ip} mono />}
      {item.firmware && <PropertyRow label="Firmware" value={item.firmware} />}
    </div>
  );
}

// Helper functions
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

function getSceneColor(scene) {
  const ch = scene.channels || {};
  const r = ch['1:1'] ?? ch['1'] ?? ch[1] ?? 0;
  const g = ch['1:2'] ?? ch['2'] ?? ch[2] ?? 0;
  const b = ch['1:3'] ?? ch['3'] ?? ch[3] ?? 0;
  if (r + g + b < 30) return null;
  return `rgb(${r}, ${g}, ${b})`;
}

// Styles
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

const inspectorStyles = `
  .inspector-panel {
    background: rgba(15, 15, 25, 0.95);
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    position: relative;
    transition: width 0.2s ease;
    flex-shrink: 0;
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

  /* Default Inspector Styles */
  .inspector-default {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .inspector-section {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    padding: 12px;
  }

  .inspector-section.warning {
    background: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.2);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .section-icon {
    color: var(--theme-primary, #00ffaa);
    opacity: 0.7;
  }

  .inspector-section.warning .section-icon {
    color: #eab308;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.5);
  }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Now Playing */
  .now-playing-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .now-playing-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.1);
    border-radius: 8px;
  }

  .playing-indicator {
    width: 8px;
    height: 8px;
  }

  .pulse-dot {
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--theme-primary, #00ffaa);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .playing-info {
    flex: 1;
    min-width: 0;
  }

  .playing-name {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .playing-meta {
    display: block;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: capitalize;
  }

  .playing-stop {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.2);
    border: none;
    color: #ef4444;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .playing-stop:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .stop-all-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .stop-all-btn:hover {
    background: rgba(239, 68, 68, 0.25);
  }

  .empty-state {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    color: rgba(255, 255, 255, 0.3);
    font-size: 13px;
  }

  .empty-icon {
    opacity: 0.3;
  }

  /* Master Control */
  .master-control {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .master-value {
    font-size: 20px;
    font-weight: 600;
    color: white;
    min-width: 50px;
  }

  .master-bar {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .master-fill {
    height: 100%;
    background: var(--theme-primary, #00ffaa);
    transition: width 0.15s ease;
  }

  /* Warnings */
  .warnings-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .warning-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: rgba(234, 179, 8, 0.1);
    border: none;
    border-radius: 6px;
    color: #eab308;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    width: 100%;
  }

  .warning-item:hover {
    background: rgba(234, 179, 8, 0.2);
  }

  /* Quick Actions */
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .quick-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .quick-action:hover {
    background: rgba(255, 255, 255, 0.06);
    color: white;
  }

  .quick-action.blackout {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    grid-column: span 2;
  }

  .quick-action.blackout:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  /* Item Inspector Styles */
  .inspector-item {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .inspector-header {
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .header-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .type-badge {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(var(--theme-primary-rgb), 0.15);
    color: var(--theme-primary, #00ffaa);
  }

  .type-badge.scene {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }

  .type-badge.chase {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  .type-badge.fixture {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
  }

  .type-badge.node {
    background: rgba(234, 179, 8, 0.15);
    color: #eab308;
  }

  .playing-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(var(--theme-primary-rgb), 0.2);
    color: var(--theme-primary, #00ffaa);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .inspector-title {
    font-size: 18px;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  /* Preview Styles */
  .inspector-preview-section {
    margin-bottom: 8px;
  }

  .color-preview {
    width: 100%;
    height: 80px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
  }

  .color-preview.playing {
    box-shadow: 0 0 20px rgba(var(--theme-primary-rgb), 0.3);
  }

  .preview-playing-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--theme-primary, #00ffaa);
    animation: pulse 1s ease-in-out infinite;
  }

  .chase-preview {
    width: 100%;
    padding: 16px;
    background: rgba(34, 197, 94, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .chase-preview.playing {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
  }

  .chase-steps {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
  }

  .chase-step {
    flex: 1;
    height: 24px;
    background: rgba(34, 197, 94, 0.3);
    border-radius: 4px;
  }

  .chase-preview.playing .chase-step {
    animation: stepPulse 0.8s ease-in-out infinite;
  }

  @keyframes stepPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  .chase-step-count {
    font-size: 12px;
    color: #22c55e;
  }

  .fixture-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px;
    background: rgba(168, 85, 247, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(168, 85, 247, 0.2);
  }

  .fixture-icon {
    color: #a855f7;
  }

  .fixture-type {
    font-size: 12px;
    color: #a855f7;
  }

  .node-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px;
    border-radius: 12px;
  }

  .node-preview.online {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .node-preview.offline {
    background: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.2);
    color: #eab308;
  }

  .node-status {
    font-size: 12px;
    font-weight: 500;
  }

  /* Properties Grid */
  .properties-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .property-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }

  .property-label {
    color: rgba(255, 255, 255, 0.5);
  }

  .property-value {
    color: white;
    font-weight: 500;
  }

  .property-value.mono {
    font-family: monospace;
    font-size: 11px;
    opacity: 0.7;
  }

  .property-value.highlight {
    color: var(--theme-primary, #00ffaa);
  }

  /* Actions */
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
    padding: 10px 12px;
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

  .action-btn.primary.playing {
    background: rgba(239, 68, 68, 0.9);
    color: white;
  }

  .action-btn.danger:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  /* Scrollbar */
  .inspector-content::-webkit-scrollbar {
    width: 6px;
  }
  .inspector-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  ${collapsedStyles}
`;
