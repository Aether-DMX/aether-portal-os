import React, { useState, useEffect } from 'react';
import { Activity, Radio, Cpu, HardDrive, Command } from 'lucide-react';
import useNodeStore from '../../store/nodeStore';
import useDMXStore from '../../store/dmxStore';
import usePlaybackStore from '../../store/playbackStore';

export default function StatusBar() {
  const { nodes } = useNodeStore();
  const { configuredUniverses } = useDMXStore();
  const { playback } = usePlaybackStore();

  const [fps, setFps] = useState(44);
  const [dmxRate, setDmxRate] = useState(0);

  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const totalNodes = nodes.length;
  const activePlayback = Object.keys(playback).length;
  const universeCount = Object.keys(configuredUniverses || {}).length || 1;

  // Simulate DMX rate based on active channels
  useEffect(() => {
    const rate = activePlayback > 0 ? 44 : 0;
    setDmxRate(rate);
  }, [activePlayback]);

  return (
    <footer className="desktop-statusbar">
      <div className="statusbar-left">
        {/* DMX Output */}
        <div className="status-group">
          <Activity size={12} className="status-icon" />
          <span className="status-label">DMX</span>
          <div className="dmx-meter">
            <div
              className="dmx-fill"
              style={{ width: `${dmxRate > 0 ? 100 : 0}%` }}
            />
          </div>
          <span className="status-value">{dmxRate > 0 ? `${dmxRate}Hz` : 'Idle'}</span>
        </div>

        {/* Universes */}
        <div className="status-group">
          <HardDrive size={12} className="status-icon" />
          <span className="status-label">Universes</span>
          <span className="status-value">{universeCount}</span>
        </div>

        {/* Nodes */}
        <div className="status-group">
          <Radio size={12} className="status-icon" />
          <span className="status-label">Nodes</span>
          <span className={`status-value ${onlineNodes < totalNodes ? 'warning' : ''}`}>
            {onlineNodes}/{totalNodes}
          </span>
        </div>

        {/* Frame Rate */}
        <div className="status-group">
          <Cpu size={12} className="status-icon" />
          <span className="status-label">FPS</span>
          <span className="status-value">{fps}</span>
        </div>
      </div>

      <div className="statusbar-center">
        {activePlayback > 0 && (
          <span className="playback-indicator">
            <span className="pulse-dot" />
            {activePlayback} active
          </span>
        )}
      </div>

      <div className="statusbar-right">
        {/* Keyboard hints */}
        <div className="keyboard-hints">
          <span className="hint">
            <kbd><Command size={10} /></kbd><kbd>K</kbd> Search
          </span>
          <span className="hint">
            <kbd>Space</kbd> Play/Stop
          </span>
          <span className="hint">
            <kbd>Esc</kbd> Blackout
          </span>
        </div>
      </div>

      <style>{`
        .desktop-statusbar {
          height: 28px;
          background: rgba(10, 10, 18, 0.98);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 24px;
          font-size: 11px;
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

        .status-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-icon {
          color: rgba(255, 255, 255, 0.4);
        }

        .status-label {
          color: rgba(255, 255, 255, 0.4);
        }

        .status-value {
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .status-value.warning {
          color: #eab308;
        }

        .dmx-meter {
          width: 40px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .dmx-fill {
          height: 100%;
          background: var(--theme-primary, #00ffaa);
          transition: width 0.3s ease;
        }

        .playback-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--theme-primary, #00ffaa);
          font-weight: 500;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--theme-primary, #00ffaa);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .keyboard-hints {
          display: flex;
          gap: 16px;
        }

        .hint {
          display: flex;
          align-items: center;
          gap: 4px;
          color: rgba(255, 255, 255, 0.3);
        }

        .hint kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 16px;
          padding: 0 4px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          font-size: 10px;
          font-family: inherit;
        }
      `}</style>
    </footer>
  );
}
