import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Wifi, Server, RefreshCw, Trash2, Check, X, ChevronDown, ChevronUp, AlertTriangle, Layers, Edit3, Cpu, Hash } from 'lucide-react';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

// Get AETHER-PULSE-XXXX name from MAC or node_id
const getPulseId = (node) => {
  if (node.mac) {
    const last4 = node.mac.replace(/:/g, '').slice(-4).toUpperCase();
    return `AETHER-PULSE-${last4}`;
  }
  if (node.node_id && node.node_id.includes('-')) {
    const last4 = node.node_id.split('-').pop().toUpperCase();
    return `AETHER-PULSE-${last4}`;
  }
  return null;
};

export default function NodeManagement() {
  const [nodes, setNodes] = useState([]);
  const [pendingNodes, setPendingNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNode, setExpandedNode] = useState(null);

  // Modal state
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
    const conflicting = nodes.find(n => {
      if (n.node_id === excludeNodeId) return false;
      if (n.universe !== universe) return false;
      const nStart = n.channel_start || 1;
      const nEnd = n.channel_end || 512;
      return !(channelEnd < nStart || channelStart > nEnd);
    });
    return conflicting;
  };

  const getSuggestedRange = (universe) => {
    const excludeId = selectedNode?.node_id;
    const nodesInUniverse = nodes.filter(n => n.universe === universe && n.node_id !== excludeId);
    
    if (nodesInUniverse.length === 0) {
      return { start: 1, end: 512 };
    }
    
    const ranges = nodesInUniverse.map(n => ({
      start: n.channel_start || 1,
      end: n.channel_end || 512
    })).sort((a, b) => a.start - b.start);
    
    if (ranges[0].start > 1) {
      return { start: 1, end: ranges[0].start - 1 };
    }
    
    for (let i = 0; i < ranges.length - 1; i++) {
      if (ranges[i].end + 1 < ranges[i + 1].start) {
        return { start: ranges[i].end + 1, end: ranges[i + 1].start - 1 };
      }
    }
    
    const lastEnd = ranges[ranges.length - 1].end;
    if (lastEnd < 512) {
      return { start: lastEnd + 1, end: 512 };
    }
    
    return null;
  };

  const autoRebalance = async () => {
    const universe = modalConfig.universe;
    const excludeId = selectedNode?.node_id;
    const nodesInUniverse = nodes.filter(n => n.universe === universe && n.node_id !== excludeId);

    if (nodesInUniverse.length === 0) {
      setModalConfig({ ...modalConfig, channelStart: 1, channelEnd: 512 });
      setConflict(null);
      return;
    }

    const totalNodes = nodesInUniverse.length + 1;
    const channelsPerNode = Math.floor(512 / totalNodes);

    try {
      for (let i = 0; i < nodesInUniverse.length; i++) {
        const node = nodesInUniverse[i];
        const startCh = i * channelsPerNode + 1;
        const endCh = (i + 1) * channelsPerNode;

        await fetch(getApiUrl() + '/api/nodes/' + node.node_id + '/configure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            universe: universe,
            channelStart: startCh,
            channelEnd: endCh
          })
        });
      }

      const newStart = nodesInUniverse.length * channelsPerNode + 1;
      const newEnd = 512;

      setModalConfig({ ...modalConfig, channelStart: newStart, channelEnd: newEnd });
      setConflict(null);

      await fetchNodes();
    } catch (e) {
      console.error('Rebalance failed:', e);
      alert('Failed to rebalance: ' + e.message);
    }
  };

  const openPairModal = (node, editing = false) => {
    setSelectedNode(node);
    setIsEditing(editing);

    const defaultUniverse = node.universe || 1;
    const pulseId = getPulseId(node);
    
    if (editing) {
      setModalConfig({
        universe: node.universe || 1,
        channelStart: node.channel_start || 1,
        channelEnd: node.channel_end || 512,
        name: node.name || pulseId || ''
      });
      setConflict(null);
    } else {
      const suggested = getSuggestedRange(defaultUniverse);
      const defaultConfig = suggested 
        ? { universe: defaultUniverse, channelStart: suggested.start, channelEnd: suggested.end, name: pulseId || '' }
        : { universe: defaultUniverse, channelStart: 1, channelEnd: 512, name: pulseId || '' };

      const conflictNode = checkConflict(defaultConfig.universe, defaultConfig.channelStart, defaultConfig.channelEnd);
      setConflict(conflictNode);
      setModalConfig(defaultConfig);
    }
    setShowModal(true);
  };

  const handleUniverseSelect = (universe) => {
    const suggested = getSuggestedRange(universe);
    const newConfig = suggested
      ? { ...modalConfig, universe, channelStart: suggested.start, channelEnd: suggested.end }
      : { ...modalConfig, universe, channelStart: 1, channelEnd: 512 };
    
    setModalConfig(newConfig);
    const conflictNode = checkConflict(universe, newConfig.channelStart, newConfig.channelEnd, selectedNode?.node_id);
    setConflict(conflictNode);
  };

  const handlePresetSelect = (preset) => {
    let newConfig = { ...modalConfig };
    
    switch (preset) {
      case 'full':
        newConfig.channelStart = 1;
        newConfig.channelEnd = 512;
        break;
      case 'first-half':
        newConfig.channelStart = 1;
        newConfig.channelEnd = 256;
        break;
      case 'second-half':
        newConfig.channelStart = 257;
        newConfig.channelEnd = 512;
        break;
      case 'first-quarter':
        newConfig.channelStart = 1;
        newConfig.channelEnd = 128;
        break;
      case 'second-quarter':
        newConfig.channelStart = 129;
        newConfig.channelEnd = 256;
        break;
      case 'third-quarter':
        newConfig.channelStart = 257;
        newConfig.channelEnd = 384;
        break;
      case 'fourth-quarter':
        newConfig.channelStart = 385;
        newConfig.channelEnd = 512;
        break;
    }
    
    setModalConfig(newConfig);
    const conflictNode = checkConflict(newConfig.universe, newConfig.channelStart, newConfig.channelEnd, selectedNode?.node_id);
    setConflict(conflictNode);
  };

  const handlePairOrSave = async () => {
    if (conflict) {
      if (!confirm(`⚠️ Channel conflict with "${conflict.name}"!\n\nProceed anyway?`)) {
        return;
      }
    }

    try {
      const endpoint = isEditing ? 'configure' : 'pair';
      await fetch(getApiUrl() + '/api/nodes/' + selectedNode.node_id + '/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modalConfig.name || getPulseId(selectedNode),
          universe: modalConfig.universe,
          channel_start: modalConfig.channelStart,
          channel_end: modalConfig.channelEnd,
          channelStart: modalConfig.channelStart,
          channelEnd: modalConfig.channelEnd
        })
      });
      setShowModal(false);
      setIsEditing(false);
      await fetchNodes();
    } catch (e) {
      console.error('Failed:', e);
      alert('Failed: ' + e.message);
    }
  };

  const handleUnpair = async (nodeId) => {
    if (!confirm('Unpair this node?')) return;
    try {
      await fetch(getApiUrl() + '/api/nodes/' + nodeId + '/unpair', { method: 'POST' });
      await fetchNodes();
    } catch (e) {
      console.error('Failed to unpair:', e);
    }
  };

  const handleDelete = async (nodeId) => {
    if (!confirm('Delete this node? This cannot be undone.')) return;
    try {
      await fetch(getApiUrl() + '/api/nodes/' + nodeId, { method: 'DELETE' });
      await fetchNodes();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const nodesByUniverse = nodes.reduce((acc, node) => {
    const u = node.universe || 1;
    if (!acc[u]) acc[u] = [];
    acc[u].push(node);
    return acc;
  }, {});

  const universeHasBuiltIn = (universe) => {
    return nodesByUniverse[universe]?.some(n => n.is_builtin || n.isBuiltIn);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent pb-4 px-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Node Management</h1>
          <button onClick={fetchNodes} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-6">
        {/* Pending Nodes */}
        {pendingNodes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-yellow-400 mb-3">
              Pending ({pendingNodes.length})
            </h2>
            <div className="grid gap-3">
              {pendingNodes.map((node) => {
                const pulseId = getPulseId(node);
                return (
                  <div key={node.node_id} className="glass-panel rounded-xl border-2 border-yellow-500/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{pulseId || node.name || node.node_id}</h3>
                        <p className="text-sm text-slate-400">{node.ip}</p>
                      </div>
                      <Wifi className="w-6 h-6 text-yellow-400" />
                    </div>
                    <button
                      onClick={() => openPairModal(node, false)}
                      className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg text-lg"
                    >
                      Configure & Pair
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Paired Nodes by Universe */}
        {Object.keys(nodesByUniverse).sort((a, b) => a - b).map(universe => (
          <div key={universe} className="mb-6">
            <h2 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {universeHasBuiltIn(universe) ? `AETHER-PORTAL Universe ${universe}` : `Universe ${universe}`}
            </h2>
            <div className="grid gap-3">
              {nodesByUniverse[universe].map((node) => {
                const isBuiltIn = node.is_builtin || node.isBuiltIn;
                const isOnline = node.status === 'online';
                const expanded = expandedNode === node.node_id;
                const pulseId = getPulseId(node);
                const displayName = node.name || pulseId;
                const showPulseId = pulseId && node.name && node.name !== pulseId;

                return (
                  <div
                    key={node.node_id}
                    className={`glass-panel rounded-xl border-2 p-4 ${
                      isOnline ? 'border-green-500/50' : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isBuiltIn ? (
                          <Server className="w-6 h-6 text-blue-400" />
                        ) : (
                          <Wifi className={`w-6 h-6 ${isOnline ? 'text-green-400' : 'text-slate-500'}`} />
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-white">{displayName}</h3>
                          {showPulseId && (
                            <p className="text-xs text-slate-500">({pulseId})</p>
                          )}
                          <p className="text-sm text-slate-400">
                            Ch {node.channel_start || 1}-{node.channel_end || 512}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          isOnline ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                        {!isBuiltIn && (
                          <button
                            onClick={() => openPairModal(node, true)}
                            className="p-2 hover:bg-white/10 rounded"
                            title="Edit"
                          >
                            <Edit3 className="w-5 h-5 text-blue-400" />
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedNode(expanded ? null : node.node_id)}
                          className="p-2 hover:bg-white/10 rounded"
                        >
                          {expanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                          <div><span className="text-slate-400">IP:</span> <span className="text-white">{node.ip || 'N/A'}</span></div>
                          <div><span className="text-slate-400">MAC:</span> <span className="text-white">{node.mac || 'N/A'}</span></div>
                          <div><span className="text-slate-400">Type:</span> <span className="text-white">{isBuiltIn ? 'Built-in' : 'Wireless'}</span></div>
                          <div><span className="text-slate-400">Firmware:</span> <span className="text-white">{node.firmware || 'N/A'}</span></div>
                        </div>

                        {!isBuiltIn && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUnpair(node.node_id)}
                              className="flex-1 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold rounded-lg"
                            >
                              Unpair
                            </button>
                            <button
                              onClick={() => handleDelete(node.node_id)}
                              className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {nodes.length === 0 && pendingNodes.length === 0 && (
          <div className="text-center py-12">
            <Server className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No nodes found</p>
          </div>
        )}
      </div>

      {/* Modal - Styled like ChatModal - Rendered as Portal */}
      {showModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-3" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div
            className="glass-panel rounded-xl border-2 w-full max-w-3xl"
            style={{
              borderColor: 'rgba(139, 92, 246, 0.4)',
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
              height: '420px'
            }}
          >
            {/* Compact Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1))',
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
                  }}>
                  <Cpu size={18} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-1">
                    {isEditing ? 'Edit Node' : 'Configure Node'}
                  </h2>
                  <p className="text-xs text-white/60">{getPulseId(selectedNode)} • {selectedNode?.ip}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setIsEditing(false); }}
                className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center hover:scale-110 transition-all text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content - Side by Side Layout */}
            <div className="flex h-[370px]">
              {/* Left Side - Universe & Name */}
              <div className="flex-1 p-3 border-r overflow-y-auto" style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                {/* Node Name */}
                <div className="mb-3">
                  <label className="block text-xs text-white/60 mb-1">Node Name</label>
                  <input
                    type="text"
                    value={modalConfig.name}
                    onChange={(e) => setModalConfig({ ...modalConfig, name: e.target.value })}
                    placeholder={getPulseId(selectedNode)}
                    className="w-full bg-black/30 rounded-lg px-3 py-2 text-white text-sm border border-white/10 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Universe Selection */}
                <div className="mb-3">
                  <label className="block text-xs text-white/60 mb-1">Universe</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(u => (
                      <button
                        key={u}
                        onClick={() => handleUniverseSelect(u)}
                        className={`py-2 text-lg font-bold rounded-lg transition-all ${
                          modalConfig.universe === u
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Selection */}
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Selected:</span>
                    <span className="text-white font-bold">
                      U{modalConfig.universe} • Ch {modalConfig.channelStart}-{modalConfig.channelEnd}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 text-right">
                    {modalConfig.channelEnd - modalConfig.channelStart + 1} channels
                  </div>
                </div>

                {/* Conflict Warning */}
                {conflict && (
                  <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-400" />
                      <div className="text-xs">
                        <p className="text-red-400 font-semibold">Conflict with "{conflict.name}"</p>
                        <p className="text-red-300/70">Ch {conflict.channel_start}-{conflict.channel_end}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Channel Presets */}
              <div className="w-[280px] p-3 flex flex-col">
                <label className="block text-xs text-white/60 mb-1">Channel Range</label>
                
                {/* Main Presets */}
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <button
                    onClick={() => handlePresetSelect('full')}
                    className={`py-3 rounded-lg font-semibold text-sm ${
                      modalConfig.channelStart === 1 && modalConfig.channelEnd === 512
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    Full (1-512)
                  </button>
                  <button
                    onClick={autoRebalance}
                    className="py-3 rounded-lg font-semibold text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50"
                  >
                    Auto-Split
                  </button>
                </div>

                {/* Half Presets */}
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <button
                    onClick={() => handlePresetSelect('first-half')}
                    className={`py-2 rounded-lg font-semibold text-sm ${
                      modalConfig.channelStart === 1 && modalConfig.channelEnd === 256
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    1st Half (1-256)
                  </button>
                  <button
                    onClick={() => handlePresetSelect('second-half')}
                    className={`py-2 rounded-lg font-semibold text-sm ${
                      modalConfig.channelStart === 257 && modalConfig.channelEnd === 512
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    2nd Half (257-512)
                  </button>
                </div>

                {/* Quarter Presets */}
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <button
                    onClick={() => handlePresetSelect('first-quarter')}
                    className={`py-2 rounded-lg text-xs font-semibold ${
                      modalConfig.channelStart === 1 && modalConfig.channelEnd === 128
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    Q1 (1-128)
                  </button>
                  <button
                    onClick={() => handlePresetSelect('second-quarter')}
                    className={`py-2 rounded-lg text-xs font-semibold ${
                      modalConfig.channelStart === 129 && modalConfig.channelEnd === 256
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    Q2 (129-256)
                  </button>
                  <button
                    onClick={() => handlePresetSelect('third-quarter')}
                    className={`py-2 rounded-lg text-xs font-semibold ${
                      modalConfig.channelStart === 257 && modalConfig.channelEnd === 384
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    Q3 (257-384)
                  </button>
                  <button
                    onClick={() => handlePresetSelect('fourth-quarter')}
                    className={`py-2 rounded-lg text-xs font-semibold ${
                      modalConfig.channelStart === 385 && modalConfig.channelEnd === 512
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    Q4 (385-512)
                  </button>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowModal(false); setIsEditing(false); }}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePairOrSave}
                    className={`flex-1 py-3 font-semibold rounded-lg text-sm flex items-center justify-center gap-1 ${
                      conflict
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <Check size={16} />
                    {isEditing ? 'Save' : (conflict ? 'Pair Anyway' : 'Pair')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
