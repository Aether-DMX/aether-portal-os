import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function MobileNodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const backendUrl = 'http://' + window.location.hostname + ':8891';

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const res = await fetch(backendUrl + '/api/nodes');
      const data = await res.json();
      setNodes(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 10000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = nodes.filter(n => n.online || n.status === 'online').length;

  return (
    <div className="mobile-nodes">
      <div className="mobile-section-header">
        <span className="mobile-section-title">Nodes</span>
        <button
          onClick={fetchNodes}
          className="mobile-add-btn"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="mobile-stats" style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        padding: '12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 10
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{onlineCount}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Online</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{nodes.length}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Total</div>
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="mobile-empty">
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 16px' }}>
            No PULSE nodes discovered yet.
          </p>
        </div>
      ) : (
        nodes.map(n => {
          const isOnline = n.online || n.status === 'online';
          return (
            <div key={n.id} className="mobile-list-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isOnline ? (
                  <Wifi size={20} color="#22c55e" />
                ) : (
                  <WifiOff size={20} color="#ef4444" />
                )}
                <div>
                  <div className="mobile-list-item-name">{n.name || n.id}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {n.ip} • Universe {n.universe || 1}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: isOnline ? '#22c55e' : '#ef4444',
                padding: '4px 8px',
                borderRadius: 4,
                background: isOnline ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'
              }}>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
