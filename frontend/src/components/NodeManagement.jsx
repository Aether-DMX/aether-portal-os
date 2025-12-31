import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Wifi, Server, RefreshCw, Trash2, Check, X, ChevronDown, ChevronUp, AlertTriangle, Layers, Edit3, Cpu, Hash, Cable } from 'lucide-react';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

const getPulseId = (node) => {
  if (node.mac) {
    const last4 = node.mac.replace(/:/g, '').slice(-4).toUpperCase();
    return `PULSE-${last4}`;
  }
  if (node.node_id && node.node_id.includes('-')) {
    const last4 = node.node_id.split('-').pop().toUpperCase();
    return `PULSE-${last4}`;
  }
  return null;
};

export default function NodeManagement() {
  const [nodes, setNodes] = useState([]);
  const [pendingNodes, setPendingNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNode, setExpandedNode] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [modalConfig, setModalConfig] = useState({ universe: 1, channelStart: 1, channelEnd: 512, name: '' });
  const [conflict, setConflict] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchNodes = async () => {
    try {
      const res = await fetch(getApiUrl() + '/api/nodes');
      const data = await res.json();
      const allNodes = Array.isArray(data) ? data : [];
      setNodes(allNodes.filter(n => n.is_paired || n.is_builtin || n.isBuiltIn));
      setPendingNodes(allNodes.filter(n => !n.is_paired && !n.is_builtin && !n.isBuiltIn && n.status === 'online'));
      setLoading(false);
    } catch (e) {
      console.error('Failed to fetch nodes:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkConflict = (universe, channelStart, channelEnd, excludeNodeId = null) => {
    return nodes.find(n => {
      if (n.node_id === excludeNodeId) return false;
      if (n.universe !== universe) return false;
      const nStart = n.channel_start || 1;
      const nEnd = n.channel_end || 512;
      return !(channelEnd < nStart || channelStart > nEnd);
    });
  };

  const openPairModal = (node, editing = false) => {
    setSelectedNode(node);
    setIsEditing(editing);
    setModalConfig({
      universe: node.universe || 1,
      channelStart: node.channel_start || 1,
      channelEnd: node.channel_end || 512,
      name: node.name || getPulseId(node) || '',
      transport: node.type || 'wifi'  // 'wifi' or 'gateway'
    });
    setConflict(null);
    setShowModal(true);
  };

  const handleConfigChange = (field, value) => {
    const newConfig = { ...modalConfig, [field]: value };
    setModalConfig(newConfig);
    if (field !== 'name') {
      const conflictNode = checkConflict(newConfig.universe, newConfig.channelStart, newConfig.channelEnd, selectedNode?.node_id);
      setConflict(conflictNode);
    }
  };

  const handlePairOrSave = async () => {
    if (conflict && !confirm(`⚠️ Channel conflict with "${conflict.name}"!\n\nProceed anyway?`)) return;
    try {
      const endpoint = isEditing ? 'configure' : 'pair';
      await fetch(getApiUrl() + '/api/nodes/' + selectedNode.node_id + '/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modalConfig.name || getPulseId(selectedNode),
          universe: modalConfig.universe,
          channel_start: modalConfig.channelStart,
          channel_end: modalConfig.channelEnd
          // type is auto-detected (wifi or gateway) based on how node connects
        })
      });
      setShowModal(false);
      setIsEditing(false);
      await fetchNodes();
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };

  const handleUnpair = async (nodeId) => {
    if (!confirm('Unpair this node?')) return;
    try {
      await fetch(getApiUrl() + '/api/nodes/' + nodeId + '/unpair', { method: 'POST' });
      await fetchNodes();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (nodeId) => {
    if (!confirm('Delete this node?')) return;
    try {
      await fetch(getApiUrl() + '/api/nodes/' + nodeId, { method: 'DELETE' });
      await fetchNodes();
    } catch (e) { console.error(e); }
  };

  const nodesByUniverse = nodes.reduce((acc, node) => {
    const u = node.universe || 1;
    if (!acc[u]) acc[u] = [];
    acc[u].push(node);
    return acc;
  }, {});

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><RefreshCw className="animate-spin" style={{ color: '#888' }} /></div>;
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#0a0a0f' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, background: '#0a0a0f', zIndex: 10 }}>
        <h1 style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>Nodes</h1>
        <button onClick={fetchNodes} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer' }}>
          <RefreshCw size={16} color="white" />
        </button>
      </div>

      <div style={{ padding: '8px 12px' }}>
        {/* Pending Nodes */}
        {pendingNodes.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ color: '#facc15', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>PENDING ({pendingNodes.length})</h2>
            {pendingNodes.map((node) => (
              <div key={node.node_id} style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 8, padding: '8px 10px', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wifi size={16} color="#facc15" />
                  <div>
                    <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{getPulseId(node) || node.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{node.ip}</div>
                  </div>
                </div>
                <button onClick={() => openPairModal(node, false)} style={{ background: '#facc15', border: 'none', borderRadius: 6, padding: '6px 12px', color: 'black', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Pair</button>
              </div>
            ))}
          </div>
        )}

        {/* Paired Nodes by Universe */}
        {Object.keys(nodesByUniverse).sort((a, b) => a - b).map(universe => (
          <div key={universe} style={{ marginBottom: 12 }}>
            <h2 style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={12} /> UNIVERSE {universe}
            </h2>
            {nodesByUniverse[universe].map((node) => {
              const isBuiltIn = node.is_builtin || node.isBuiltIn;
              const isOnline = node.status === 'online';
              const expanded = expandedNode === node.node_id;
              const pulseId = getPulseId(node);

              return (
                <div key={node.node_id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isOnline ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isBuiltIn ? <Server size={16} color="#60a5fa" /> : node.type === 'gateway' ? <Cable size={16} color={isOnline ? '#f59e0b' : '#666'} /> : <Wifi size={16} color={isOnline ? '#22c55e' : '#666'} />}
                      <div>
                        <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{node.name || pulseId}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Ch {node.channel_start || 1}-{node.channel_end || 512} {node.type === 'gateway' && <span style={{ color: '#f59e0b' }}>UART</span>}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600, background: isOnline ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)', color: isOnline ? '#22c55e' : '#666' }}>
                        {isOnline ? 'ON' : 'OFF'}
                      </span>
                      {!isBuiltIn && (
                        <button onClick={() => openPairModal(node, true)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                          <Edit3 size={14} color="#60a5fa" />
                        </button>
                      )}
                      <button onClick={() => setExpandedNode(expanded ? null : node.node_id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                        {expanded ? <ChevronUp size={14} color="white" /> : <ChevronDown size={14} color="white" />}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10, marginBottom: 8 }}>
                        <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>IP:</span> <span style={{ color: 'white' }}>{node.ip || 'N/A'}</span></div>
                        <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>MAC:</span> <span style={{ color: 'white' }}>{node.mac || 'N/A'}</span></div>
                        <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Type:</span> <span style={{ color: node.type === 'gateway' ? '#f59e0b' : 'white' }}>{isBuiltIn ? 'Built-in' : node.type === 'gateway' ? 'Gateway (UART)' : 'WiFi (sACN)'}</span></div>
                        <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>FW:</span> <span style={{ color: 'white' }}>{node.firmware || 'N/A'}</span></div>
                      </div>
                      {!isBuiltIn && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleUnpair(node.node_id)} style={{ flex: 1, padding: '6px 0', background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 6, color: '#facc15', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Unpair</button>
                          <button onClick={() => handleDelete(node.node_id)} style={{ flex: 1, padding: '6px 0', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {nodes.length === 0 && pendingNodes.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
            <Server size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p>No nodes found</p>
          </div>
        )}
      </div>

      {/* Config Modal */}
      {showModal && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, width: '100%', maxWidth: 340, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{isEditing ? 'Edit' : 'Pair'} {getPulseId(selectedNode)}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4 }}>NAME</label>
              <input
                value={modalConfig.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder={getPulseId(selectedNode)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '8px 10px', color: 'white', fontSize: 13 }}
              />
            </div>

            {/* Universe */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4 }}>UNIVERSE</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(u => (
                  <button key={u} onClick={() => handleConfigChange('universe', u)} style={{ padding: '8px 0', background: modalConfig.universe === u ? '#8b5cf6' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{u}</button>
                ))}
              </div>
            </div>

            {/* Transport Info - read-only, determined by how node connects */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4 }}>TRANSPORT</label>
              <div style={{ padding: '8px 12px', background: modalConfig.transport === 'gateway' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)', border: `1px solid ${modalConfig.transport === 'gateway' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                {modalConfig.transport === 'gateway' ? <Cable size={14} color="#f59e0b" /> : <Wifi size={14} color="#3b82f6" />}
                <span style={{ color: 'white', fontSize: 12 }}>{modalConfig.transport === 'gateway' ? 'Gateway (UART/GPIO)' : 'WiFi (sACN Multicast)'}</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                {modalConfig.transport === 'gateway' ? 'Direct wired connection via Pi GPIO' : 'Wireless via sACN/E1.31 multicast'}
              </div>
            </div>

            {/* Channels */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4 }}>CHANNELS</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" value={modalConfig.channelStart} onChange={(e) => handleConfigChange('channelStart', parseInt(e.target.value) || 1)} min={1} max={512} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '8px 10px', color: 'white', fontSize: 13, textAlign: 'center' }} />
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>to</span>
                <input type="number" value={modalConfig.channelEnd} onChange={(e) => handleConfigChange('channelEnd', parseInt(e.target.value) || 512)} min={1} max={512} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '8px 10px', color: 'white', fontSize: 13, textAlign: 'center' }} />
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4 }}>PRESETS</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {[{ l: 'Full', s: 1, e: 512 }, { l: '1-128', s: 1, e: 128 }, { l: '129-256', s: 129, e: 256 }, { l: '257-384', s: 257, e: 384 }].map(p => (
                  <button key={p.l} onClick={() => { handleConfigChange('channelStart', p.s); handleConfigChange('channelEnd', p.e); }} style={{ padding: '6px 0', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: 'white', fontSize: 10, cursor: 'pointer' }}>{p.l}</button>
                ))}
              </div>
            </div>

            {/* Conflict Warning */}
            {conflict && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: 8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span style={{ color: '#ef4444', fontSize: 11 }}>Conflicts with {conflict.name}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handlePairOrSave} style={{ flex: 1, padding: '10px 0', background: '#8b5cf6', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{isEditing ? 'Save' : 'Pair'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
