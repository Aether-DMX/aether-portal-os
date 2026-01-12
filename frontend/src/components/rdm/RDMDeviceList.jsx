import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Flashlight, Settings, Trash2, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import useRDMStore from '../../store/rdmStore';

export default function RDMDeviceList({ nodeId, isExpanded = true }) {
  const {
    devices,
    scanningNodes,
    fetchDevices,
    startDiscovery,
    identifyDevice,
    setDeviceAddress,
    deleteDevice,
    getDevicesForNode,
    isNodeScanning
  } = useRDMStore();

  const [expandedDevice, setExpandedDevice] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState('');
  const [identifyingDevices, setIdentifyingDevices] = useState({});

  const nodeDevices = getDevicesForNode(nodeId);
  const isScanning = isNodeScanning(nodeId);

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDiscover = async () => {
    try {
      await startDiscovery(nodeId);
    } catch (e) {
      console.error('Discovery failed:', e);
    }
  };

  const handleIdentify = async (uid) => {
    const currentState = identifyingDevices[uid] || false;
    const newState = !currentState;

    setIdentifyingDevices(prev => ({ ...prev, [uid]: newState }));

    try {
      await identifyDevice(uid, newState);
      // Auto-off after 5 seconds
      if (newState) {
        setTimeout(() => {
          setIdentifyingDevices(prev => ({ ...prev, [uid]: false }));
          identifyDevice(uid, false);
        }, 5000);
      }
    } catch (e) {
      console.error('Identify failed:', e);
      setIdentifyingDevices(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleSetAddress = async (uid) => {
    const addr = parseInt(newAddress);
    if (addr >= 1 && addr <= 512) {
      try {
        await setDeviceAddress(uid, addr);
        setEditingAddress(null);
        setNewAddress('');
      } catch (e) {
        console.error('Set address failed:', e);
      }
    }
  };

  const handleDelete = async (uid) => {
    if (confirm('Remove this device from the list?')) {
      try {
        await deleteDevice(uid);
      } catch (e) {
        console.error('Delete failed:', e);
      }
    }
  };

  if (!isExpanded) return null;

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      {/* RDM Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Radio size={12} color="#10b981" />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>RDM DEVICES</span>
          {nodeDevices.length > 0 && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>({nodeDevices.length})</span>
          )}
        </div>
        <button
          onClick={handleDiscover}
          disabled={isScanning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: isScanning ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 4,
            color: '#10b981',
            fontSize: 10,
            fontWeight: 600,
            cursor: isScanning ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={10} className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {/* Device List */}
      {nodeDevices.length === 0 ? (
        <div style={{
          padding: '16px 12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 6,
          textAlign: 'center'
        }}>
          <Radio size={20} color="rgba(255,255,255,0.2)" style={{ marginBottom: 6 }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            {isScanning ? 'Scanning for RDM devices...' : 'No RDM devices found'}
          </p>
          {!isScanning && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '4px 0 0' }}>
              Click Scan to discover fixtures
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {nodeDevices.map(device => {
            const expanded = expandedDevice === device.uid;
            const isIdentifying = identifyingDevices[device.uid] || false;
            const isEditingThis = editingAddress === device.uid;

            return (
              <div
                key={device.uid}
                style={{
                  background: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 6,
                  padding: '6px 8px'
                }}
              >
                {/* Device Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isIdentifying ? '#fbbf24' : '#10b981',
                        animation: isIdentifying ? 'pulse 0.5s infinite' : 'none'
                      }}
                    />
                    <div>
                      <div style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>
                        {device.device_label || `Device ${device.uid.split(':')[1]?.slice(-4) || device.uid}`}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>
                        Ch {device.dmx_address || '?'} • UID: {device.uid}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button
                      onClick={() => handleIdentify(device.uid)}
                      style={{
                        background: isIdentifying ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: 4,
                        padding: 4,
                        cursor: 'pointer'
                      }}
                      title="Identify (flash LED)"
                    >
                      <Flashlight size={12} color={isIdentifying ? '#fbbf24' : '#fff'} />
                    </button>
                    <button
                      onClick={() => setExpandedDevice(expanded ? null : device.uid)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 4,
                        cursor: 'pointer'
                      }}
                    >
                      {expanded ? <ChevronUp size={12} color="#fff" /> : <ChevronDown size={12} color="#fff" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {/* Device Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 9, marginBottom: 8 }}>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Manufacturer:</span>{' '}
                        <span style={{ color: 'white' }}>{device.manufacturer_id || 'Unknown'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Model:</span>{' '}
                        <span style={{ color: 'white' }}>{device.device_model_id || 'Unknown'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Footprint:</span>{' '}
                        <span style={{ color: 'white' }}>{device.dmx_footprint || '?'} ch</span>
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Software:</span>{' '}
                        <span style={{ color: 'white' }}>{device.software_version || 'N/A'}</span>
                      </div>
                    </div>

                    {/* DMX Address Editor */}
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, display: 'block', marginBottom: 4 }}>
                        DMX ADDRESS
                      </label>
                      {isEditingThis ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            type="number"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            min={1}
                            max={512}
                            placeholder={String(device.dmx_address || 1)}
                            style={{
                              flex: 1,
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: 4,
                              padding: '4px 8px',
                              color: 'white',
                              fontSize: 11,
                              textAlign: 'center'
                            }}
                          />
                          <button
                            onClick={() => handleSetAddress(device.uid)}
                            style={{
                              padding: '4px 8px',
                              background: '#10b981',
                              border: 'none',
                              borderRadius: 4,
                              color: 'white',
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Set
                          </button>
                          <button
                            onClick={() => { setEditingAddress(null); setNewAddress(''); }}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(255,255,255,0.1)',
                              border: 'none',
                              borderRadius: 4,
                              color: 'white',
                              fontSize: 10,
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingAddress(device.uid); setNewAddress(String(device.dmx_address || 1)); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            width: '100%',
                            padding: '6px 8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 4,
                            color: 'white',
                            fontSize: 11,
                            cursor: 'pointer',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span><Hash size={10} style={{ marginRight: 4 }} />{device.dmx_address || '?'}</span>
                          <Settings size={10} color="rgba(255,255,255,0.4)" />
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleDelete(device.uid)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 4,
                          color: '#ef4444',
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4
                        }}
                      >
                        <Trash2 size={10} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
