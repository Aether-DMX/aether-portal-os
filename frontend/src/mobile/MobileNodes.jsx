import React, { useState, useEffect } from 'react';
import { Radio, Wifi, WifiOff } from 'lucide-react';

export default function MobileNodes() {
  const [nodes, setNodes] = useState([]);
  const backendUrl = 'http://' + window.location.hostname + ':8891';

  useEffect(() => {
    fetch(backendUrl + '/api/nodes').then(r => r.json()).then(setNodes).catch(console.error);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Nodes</span>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{nodes.length} nodes discovered</div>
      {nodes.map(n => (
        <div key={n.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          {n.online ? <Wifi size={18} color="#22c55e" /> : <WifiOff size={18} color="#ef4444" />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#fff' }}>{n.name || n.id}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{n.ip} • Universe {n.universe || 1}</div>
          </div>
          <div style={{ fontSize: 10, color: n.online ? '#22c55e' : '#ef4444' }}>{n.online ? 'Online' : 'Offline'}</div>
        </div>
      ))}
      {nodes.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', padding: 20 }}>No nodes found</div>}
    </div>
  );
}
