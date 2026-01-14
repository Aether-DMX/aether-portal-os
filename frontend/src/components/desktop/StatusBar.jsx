import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, Radio, Cpu, HardDrive, Command, AlertTriangle,
  Wifi, WifiOff, Zap, Clock, Volume2, VolumeX
} from 'lucide-react';
import useNodeStore from '../../store/nodeStore';
import useDMXStore from '../../store/dmxStore';
import usePlaybackStore from '../../store/playbackStore';
import useSceneStore from '../../store/sceneStore';
import useChaseStore from '../../store/chaseStore';

export default function StatusBar() {
  const { nodes } = useNodeStore();
  const { configuredUniverses, masterValue } = useDMXStore();
  const { playback } = usePlaybackStore();
  const { scenes } = useSceneStore();
  const { chases } = useChaseStore();

  const [fps, setFps] = useState(44);
  const [frameTime, setFrameTime] = useState(0);

  // Calculate node statistics
  const nodeStats = useMemo(() => {
    const online = nodes.filter(n => n.status === 'online');
    const offline = nodes.filter(n => n.status !== 'online');
    const hasWarnings = offline.length > 0;

    // Calculate average latency from online nodes
    const latencies = online
      .map(n => n.latency || n.last_seen_ms)
      .filter(Boolean);
    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

    return {
      online: online.length,
      offline: offline.length,
      total: nodes.length,
      hasWarnings,
      avgLatency,
    };
  }, [nodes]);

  // Get latency color based on value
  const getLatencyColor = (latency) => {
    if (latency === null) return 'rgba(255, 255, 255, 0.4)';
    if (latency < 20) return '#22c55e'; // Green - excellent
    if (latency < 50) return 'var(--theme-primary, #00ffaa)'; // Accent - good
    if (latency < 100) return '#eab308'; // Yellow - warning
    return '#ef4444'; // Red - critical
  };

  // Calculate playback statistics
  const playbackStats = useMemo(() => {
    const entries = Object.entries(playback);
    // Filter out null/undefined playback entries
    const validEntries = entries.filter(([, pb]) => pb && pb.type);
    const activeCount = validEntries.length;

    // Get names of currently playing items
    const playingItems = validEntries.map(([universe, pb]) => {
      if (pb.type === 'scene') {
        const scene = scenes.find(s => (s.scene_id || s.id) === pb.id);
        return scene?.name || pb.id;
      }
      if (pb.type === 'chase') {
        const chase = chases.find(c => (c.chase_id || c.id) === pb.id);
        return chase?.name || pb.id;
      }
      return pb.name || pb.id;
    });

    return {
      activeCount,
      playingItems,
      isPlaying: activeCount > 0,
    };
  }, [playback, scenes, chases]);

  // Universe count
  const universeCount = Object.keys(configuredUniverses || {}).length || 1;

  // Simulate FPS and frame time based on activity
  useEffect(() => {
    const updateMetrics = () => {
      const baseFps = playbackStats.isPlaying ? 44 : 0;
      const jitter = playbackStats.isPlaying ? Math.floor(Math.random() * 3) - 1 : 0;
      setFps(baseFps + jitter);

      const baseFrameTime = playbackStats.isPlaying ? 22.7 : 0;
      const timeJitter = playbackStats.isPlaying ? Math.random() * 2 - 1 : 0;
      setFrameTime(baseFrameTime + timeJitter);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [playbackStats.isPlaying]);

  return (
    <footer className="desktop-statusbar">
      {/* Left Section - System Metrics */}
      <div className="statusbar-left">
        {/* DMX Output Activity */}
        <StatusGroup
          icon={Activity}
          label="DMX"
          active={playbackStats.isPlaying}
        >
          <div className="dmx-meter">
            <div
              className={`dmx-fill ${playbackStats.isPlaying ? 'active' : ''}`}
              style={{ width: playbackStats.isPlaying ? '100%' : '0%' }}
            />
          </div>
          <span className={`status-value ${playbackStats.isPlaying ? 'active' : ''}`}>
            {playbackStats.isPlaying ? `${fps}Hz` : 'Idle'}
          </span>
        </StatusGroup>

        {/* Universes */}
        <StatusGroup icon={HardDrive} label="Universes">
          <span className="status-value">{universeCount}</span>
        </StatusGroup>

        {/* Nodes with latency */}
        <StatusGroup
          icon={nodeStats.hasWarnings ? WifiOff : Wifi}
          label="Nodes"
          warning={nodeStats.hasWarnings}
        >
          <span className={`status-value ${nodeStats.hasWarnings ? 'warning' : ''}`}>
            {nodeStats.online}/{nodeStats.total}
          </span>
          {nodeStats.avgLatency !== null && (
            <span
              className="latency-badge"
              style={{ color: getLatencyColor(nodeStats.avgLatency) }}
            >
              {nodeStats.avgLatency}ms
            </span>
          )}
        </StatusGroup>

        {/* Frame Rate / Performance */}
        <StatusGroup icon={Cpu} label="FPS">
          <span className={`status-value ${fps > 40 ? 'good' : fps > 0 ? 'warning' : ''}`}>
            {fps > 0 ? fps : '—'}
          </span>
        </StatusGroup>

        {/* Master Level */}
        <StatusGroup icon={masterValue > 0 ? Volume2 : VolumeX} label="Master">
          <div className="master-mini-bar">
            <div
              className="master-mini-fill"
              style={{ width: `${masterValue || 100}%` }}
            />
          </div>
          <span className="status-value">{Math.round(masterValue || 100)}%</span>
        </StatusGroup>
      </div>

      {/* Center Section - Now Playing */}
      <div className="statusbar-center">
        {playbackStats.isPlaying ? (
          <div className="now-playing-status">
            <span className="pulse-dot" />
            <span className="now-playing-text">
              {playbackStats.activeCount === 1
                ? playbackStats.playingItems[0]?.replace(/_/g, ' ')
                : `${playbackStats.activeCount} active`}
            </span>
          </div>
        ) : (
          <span className="idle-status">Ready</span>
        )}
      </div>

      {/* Right Section - Warnings & Keyboard Hints */}
      <div className="statusbar-right">
        {/* Warnings */}
        {nodeStats.hasWarnings && (
          <div className="status-warning">
            <AlertTriangle size={12} />
            <span>{nodeStats.offline} node{nodeStats.offline > 1 ? 's' : ''} offline</span>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="keyboard-hints">
          <span className="hint">
            <kbd><Command size={10} /></kbd><kbd>K</kbd>
          </span>
          <span className="hint">
            <kbd>Space</kbd>
          </span>
          <span className="hint">
            <kbd>Esc</kbd>
          </span>
        </div>
      </div>

      <style>{`
        .desktop-statusbar {
          height: 32px;
          background: rgba(8, 8, 14, 0.98);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 24px;
          font-size: 11px;
          user-select: none;
        }

        .statusbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .statusbar-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .statusbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Status Group Component */
        .status-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-group-icon {
          color: rgba(255, 255, 255, 0.35);
          transition: color 0.2s;
        }

        .status-group.active .status-group-icon {
          color: var(--theme-primary, #00ffaa);
        }

        .status-group.warning .status-group-icon {
          color: #eab308;
        }

        .status-label {
          color: rgba(255, 255, 255, 0.35);
          font-weight: 500;
        }

        .status-value {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .status-value.active {
          color: var(--theme-primary, #00ffaa);
        }

        .status-value.warning {
          color: #eab308;
        }

        .status-value.good {
          color: #22c55e;
        }

        /* DMX Meter */
        .dmx-meter {
          width: 40px;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
        }

        .dmx-fill {
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          transition: width 0.3s ease, background 0.3s ease;
        }

        .dmx-fill.active {
          background: var(--theme-primary, #00ffaa);
          animation: dmxPulse 1s ease-in-out infinite;
        }

        @keyframes dmxPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* Master Mini Bar */
        .master-mini-bar {
          width: 32px;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
        }

        .master-mini-fill {
          height: 100%;
          background: var(--theme-primary, #00ffaa);
          transition: width 0.15s ease;
        }

        /* Latency Badge */
        .latency-badge {
          font-size: 10px;
          font-weight: 500;
          padding: 1px 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        /* Now Playing Status */
        .now-playing-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.1);
          border-radius: 12px;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--theme-primary, #00ffaa);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        .now-playing-text {
          color: var(--theme-primary, #00ffaa);
          font-weight: 500;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .idle-status {
          color: rgba(255, 255, 255, 0.3);
          font-weight: 500;
        }

        /* Warning Badge */
        .status-warning {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(234, 179, 8, 0.15);
          border-radius: 12px;
          color: #eab308;
          font-weight: 500;
          animation: warningPulse 2s ease-in-out infinite;
        }

        @keyframes warningPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* Keyboard Hints */
        .keyboard-hints {
          display: flex;
          gap: 12px;
        }

        .hint {
          display: flex;
          align-items: center;
          gap: 2px;
          color: rgba(255, 255, 255, 0.25);
        }

        .hint kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 16px;
          padding: 0 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          font-size: 10px;
          font-family: inherit;
        }
      `}</style>
    </footer>
  );
}

// Status Group Component
function StatusGroup({ icon: Icon, label, children, active, warning }) {
  return (
    <div className={`status-group ${active ? 'active' : ''} ${warning ? 'warning' : ''}`}>
      <Icon size={12} className="status-group-icon" />
      <span className="status-label">{label}</span>
      {children}
    </div>
  );
}
