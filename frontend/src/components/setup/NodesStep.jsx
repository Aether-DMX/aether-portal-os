/**
 * NodesStep.jsx
 * Step 4 of Setup Wizard
 * User connects zones to Aether Pulse nodes
 */

import React, { useEffect, useState } from 'react';
import useSetupStore from '../../store/setupStore';

function NodesStep() {
  const { 
    zones,
    availableNodes,
    nodeAssignments,
    fetchNodes,
    assignNodeToZone,
    autoAssignNodes,
    completeSetup,
    prevStep,
    loading,
    error
  } = useSetupStore();

  const [scanning, setScanning] = useState(false);

  // Filter to zones with fixtures
  const activeZones = zones.filter(z => z.name.trim() && z.fixtures.length > 0);

  // Fetch nodes on mount
  useEffect(() => {
    handleScan();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    await fetchNodes();
    setScanning(false);
  };

  const handleComplete = async () => {
    await completeSetup();
    // Step automatically advances to 5 in completeSetup
  };

  // Count online nodes
  const onlineNodes = availableNodes.filter(n => n.status === 'online');
  const offlineNodes = availableNodes.filter(n => n.status !== 'online');

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-1">
          Connect to Aether Pulse Nodes
        </h2>
        <p className="text-gray-400 text-sm">
          Assign zones to your DMX output nodes
        </p>
      </div>

      {/* Detected Nodes */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Detected Nodes
          </h3>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-3 py-1 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20 disabled:opacity-50"
          >
            {scanning ? '🔄 Scanning...' : '🔄 Scan Again'}
          </button>
        </div>

        <div className="space-y-2">
          {onlineNodes.map(node => (
            <div 
              key={node.node_id}
              className="flex items-center gap-3 p-3 bg-green-600/10 rounded-lg border border-green-600/30"
            >
              <span className="text-green-400">✅</span>
              <div className="flex-1">
                <div className="text-white font-medium">{node.name || node.hostname}</div>
                <div className="text-xs text-gray-400">
                  Universe {node.universe} • {node.type === 'hardwired' ? 'Hardwired' : 'Wireless'}
                  {node.ip && ` • ${node.ip}`}
                </div>
              </div>
              {node.rssi && (
                <div className="text-xs text-gray-500">
                  {node.rssi}dBm
                </div>
              )}
            </div>
          ))}

          {offlineNodes.map(node => (
            <div 
              key={node.node_id}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 opacity-50"
            >
              <span className="text-gray-500">⚠️</span>
              <div className="flex-1">
                <div className="text-gray-400 font-medium">{node.name || node.hostname}</div>
                <div className="text-xs text-gray-500">Offline</div>
              </div>
            </div>
          ))}

          {availableNodes.length === 0 && !scanning && (
            <div className="p-4 bg-yellow-600/10 rounded-lg border border-yellow-600/30 text-center">
              <span className="text-yellow-400">⚠️ No nodes detected</span>
              <p className="text-sm text-gray-400 mt-1">
                Make sure your Aether Pulse nodes are powered on and connected to the AetherDMX network.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zone → Node Assignment */}
      {activeZones.length > 0 && onlineNodes.length > 0 && (
        <div className="flex-1 overflow-auto mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              Assign Zones to Nodes
            </h3>
            <button
              onClick={autoAssignNodes}
              className="px-3 py-1 bg-blue-600 rounded-lg text-sm text-white hover:bg-blue-500"
            >
              ⚡ Auto-Assign
            </button>
          </div>

          <div className="space-y-2">
            {activeZones.map(zone => (
              <div 
                key={zone.id}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
                <div className="flex-1">
                  <div className="text-white font-medium">{zone.name}</div>
                  <div className="text-xs text-gray-400">
                    {zone.fixtures.length} fixture{zone.fixtures.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className="text-gray-500">→</span>
                <select
                  value={nodeAssignments[zone.id] || ''}
                  onChange={(e) => assignNodeToZone(zone.id, e.target.value)}
                  className="px-3 py-2 bg-white/10 rounded-lg text-white border border-white/20 outline-none"
                >
                  <option value="">Select node...</option>
                  {onlineNodes.map(node => (
                    <option key={node.node_id} value={node.node_id}>
                      {node.name || node.hostname} (U{node.universe})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No nodes warning but allow continue */}
      {onlineNodes.length === 0 && activeZones.length > 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 p-4">
            <p>You can continue without nodes and configure them later.</p>
            <p className="text-sm mt-2">Zones will be created but won't output DMX until nodes are connected.</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-600/20 rounded-lg border border-red-600/50 text-red-400">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={prevStep}
          className="px-6 py-3 bg-white/10 rounded-xl text-white font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleComplete}
          disabled={loading}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            loading
              ? 'bg-white/10 text-gray-400 cursor-wait'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {loading ? '⏳ Setting up...' : '✓ Complete Setup'}
        </button>
      </div>
    </div>
  );
}

export default NodesStep;
