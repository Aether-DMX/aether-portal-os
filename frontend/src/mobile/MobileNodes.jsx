import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh,
  RefreshCw, AlertTriangle, Clock, Radio, Server, Activity
} from 'lucide-react';

// Haptic feedback helper
const haptic = (pattern = 10) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

// Signal strength component
function SignalStrength({ rssi, latency }) {
  // rssi: -100 (weak) to 0 (strong), or estimate from latency
  const effectiveRssi = rssi ?? (latency ? Math.max(-90, -30 - latency) : -50);

  let strength = 'excellent';
  let SignalIcon = SignalHigh;
  let color = '#22c55e';

  if (effectiveRssi < -80) {
    strength = 'weak';
    SignalIcon = SignalLow;
    color = '#ef4444';
  } else if (effectiveRssi < -60) {
    strength = 'fair';
    SignalIcon = SignalMedium;
    color = '#f59e0b';
  } else if (effectiveRssi < -40) {
    strength = 'good';
    SignalIcon = Signal;
    color = '#22c55e';
  }

  return (
    <div className="signal-strength" style={{ color }}>
      <SignalIcon size={16} />
      <span className="signal-label">{strength}</span>
    </div>
  );
}

// Time ago formatter
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const diff = now - ts;

  if (diff < 1000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// Node Health Card
function NodeCard({ node, onIdentify }) {
  const isOnline = node.online || node.status === 'online';
  const hasFault = node.fault || node.error;
  const latency = node.latency || node.ping_ms;

  // Determine overall health status
  let healthStatus = 'healthy';
  let healthColor = '#22c55e';

  if (!isOnline) {
    healthStatus = 'offline';
    healthColor = '#ef4444';
  } else if (hasFault) {
    healthStatus = 'fault';
    healthColor = '#ef4444';
  } else if (latency && latency > 100) {
    healthStatus = 'degraded';
    healthColor = '#f59e0b';
  }

  return (
    <div
      className={`node-card ${healthStatus}`}
      style={{ '--health-color': healthColor }}
    >
      {/* Header with status indicator */}
      <div className="node-card-header">
        <div className="node-status-dot" style={{ background: healthColor }} />
        <div className="node-name">{node.name || node.id}</div>
        {hasFault && (
          <div className="node-fault-badge">
            <AlertTriangle size={12} />
            FAULT
          </div>
        )}
      </div>

      {/* Health metrics grid */}
      <div className="node-metrics">
        {/* Connection Status */}
        <div className="metric-item">
          <div className="metric-icon">
            {isOnline ? <Wifi size={16} color="#22c55e" /> : <WifiOff size={16} color="#ef4444" />}
          </div>
          <div className="metric-content">
            <div className="metric-label">Connection</div>
            <div className="metric-value" style={{ color: isOnline ? '#22c55e' : '#ef4444' }}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Signal Strength */}
        <div className="metric-item">
          <div className="metric-icon">
            <Radio size={16} color="rgba(255,255,255,0.5)" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Signal</div>
            <SignalStrength rssi={node.rssi} latency={latency} />
          </div>
        </div>

        {/* Latency */}
        <div className="metric-item">
          <div className="metric-icon">
            <Activity size={16} color="rgba(255,255,255,0.5)" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Latency</div>
            <div className="metric-value" style={{
              color: latency > 100 ? '#f59e0b' : latency > 50 ? '#22c55e' : '#fff'
            }}>
              {latency ? `${latency}ms` : '—'}
            </div>
          </div>
        </div>

        {/* Last Packet */}
        <div className="metric-item">
          <div className="metric-icon">
            <Clock size={16} color="rgba(255,255,255,0.5)" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Last Packet</div>
            <div className="metric-value">
              {formatTimeAgo(node.last_seen || node.lastPacket)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="node-card-footer">
        <div className="footer-item">
          <Server size={12} />
          <span>{node.ip || 'Unknown IP'}</span>
        </div>
        <div className="footer-divider" />
        <div className="footer-item">
          <span>Universe {node.universe || 1}</span>
        </div>
        {node.firmware && (
          <>
            <div className="footer-divider" />
            <div className="footer-item">
              <span>v{node.firmware}</span>
            </div>
          </>
        )}
      </div>

      {/* Identify button - read-only safe action */}
      {isOnline && onIdentify && (
        <button
          className="node-identify-btn"
          onClick={(e) => {
            e.stopPropagation();
            haptic(50);
            onIdentify(node);
          }}
        >
          Identify
        </button>
      )}
    </div>
  );
}

export default function MobileNodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const backendUrl = 'http://' + window.location.hostname + ':8891';

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(backendUrl + '/api/nodes');
      const data = await res.json();
      setNodes(data);
      setLastRefresh(Date.now());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [backendUrl]);

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 10000);
    return () => clearInterval(interval);
  }, [fetchNodes]);

  const handleIdentify = async (node) => {
    try {
      await fetch(`${backendUrl}/api/nodes/${node.id}/identify`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to identify node:', e);
    }
  };

  // Calculate health stats
  const onlineCount = nodes.filter(n => n.online || n.status === 'online').length;
  const offlineCount = nodes.length - onlineCount;
  const faultCount = nodes.filter(n => n.fault || n.error).length;
  const avgLatency = nodes.reduce((sum, n) => sum + (n.latency || 0), 0) / (nodes.length || 1);

  // Overall system health
  let systemHealth = 'healthy';
  let systemHealthColor = '#22c55e';
  if (offlineCount > 0) {
    systemHealth = offlineCount === nodes.length ? 'critical' : 'degraded';
    systemHealthColor = offlineCount === nodes.length ? '#ef4444' : '#f59e0b';
  }
  if (faultCount > 0) {
    systemHealth = 'fault';
    systemHealthColor = '#ef4444';
  }

  return (
    <div className="mobile-nodes-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title-row">
          <h1 className="dashboard-title">Node Health</h1>
          <button
            onClick={() => { haptic(); fetchNodes(); }}
            className="refresh-btn"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
        {lastRefresh && (
          <div className="last-refresh">Updated {formatTimeAgo(lastRefresh)}</div>
        )}
      </div>

      {/* System Health Overview */}
      <div className="system-health-card" style={{ '--health-color': systemHealthColor }}>
        <div className="health-indicator">
          <div className="health-pulse" />
          <span className="health-status">{systemHealth}</span>
        </div>
        <div className="health-stats">
          <div className="stat">
            <span className="stat-value" style={{ color: '#22c55e' }}>{onlineCount}</span>
            <span className="stat-label">Online</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: offlineCount > 0 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
              {offlineCount}
            </span>
            <span className="stat-label">Offline</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: faultCount > 0 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
              {faultCount}
            </span>
            <span className="stat-label">Faults</span>
          </div>
          <div className="stat">
            <span className="stat-value">{avgLatency.toFixed(0)}ms</span>
            <span className="stat-label">Avg Latency</span>
          </div>
        </div>
      </div>

      {/* Node List */}
      {nodes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Server size={32} />
          </div>
          <p className="empty-text">No PULSE nodes discovered</p>
          <p className="empty-subtext">Nodes will appear here when they connect to the network</p>
        </div>
      ) : (
        <div className="node-list">
          {nodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              onIdentify={handleIdentify}
            />
          ))}
        </div>
      )}

      {/* Styles */}
      <style>{`
        .mobile-nodes-dashboard {
          padding: 16px;
          padding-bottom: 100px;
          min-height: 100%;
        }

        .dashboard-header {
          margin-bottom: 20px;
        }

        .header-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dashboard-title {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .refresh-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none;
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-btn:active {
          background: rgba(255,255,255,0.2);
          transform: scale(0.95);
        }

        .refresh-btn:disabled {
          opacity: 0.5;
        }

        .refresh-btn .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .last-refresh {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          margin-top: 4px;
        }

        /* System Health Card */
        .system-health-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .health-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .health-pulse {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--health-color);
          animation: healthPulse 2s ease-in-out infinite;
        }

        @keyframes healthPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 var(--health-color); }
          50% { opacity: 0.8; box-shadow: 0 0 0 8px transparent; }
        }

        .health-status {
          font-size: 16px;
          font-weight: 700;
          color: var(--health-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .health-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          display: block;
        }

        .stat-label {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* Node List */
        .node-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Node Card */
        .node-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px;
          position: relative;
          transition: all 0.2s ease;
        }

        .node-card.offline {
          border-color: rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.05);
        }

        .node-card.fault {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.08);
        }

        .node-card.degraded {
          border-color: rgba(245,158,11,0.3);
          background: rgba(245,158,11,0.05);
        }

        .node-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .node-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .node-name {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          flex: 1;
        }

        .node-fault-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #ef4444;
          background: rgba(239,68,68,0.2);
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        /* Metrics Grid */
        .node-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 12px;
        }

        .metric-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .metric-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-content {
          flex: 1;
          min-width: 0;
        }

        .metric-label {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 2px;
        }

        .metric-value {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
        }

        .signal-strength {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          text-transform: capitalize;
        }

        /* Footer */
        .node-card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }

        .footer-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .footer-divider {
          width: 1px;
          height: 12px;
          background: rgba(255,255,255,0.1);
        }

        /* Identify Button */
        .node-identify-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent, #3b82f6);
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.3);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .node-identify-btn:active {
          background: rgba(59,130,246,0.2);
          transform: scale(0.95);
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.2);
          margin-bottom: 16px;
        }

        .empty-text {
          font-size: 16px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin: 0 0 4px 0;
        }

        .empty-subtext {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
