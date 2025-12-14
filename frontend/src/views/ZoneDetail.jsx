import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, Server, Activity, Zap, RefreshCw, X } from 'lucide-react';
import useNodeStore from '../store/nodeStore';
import useDMXStore from '../store/dmxStore';

const API = `http://${window.location.hostname}:8891`;

export default function ZoneDetail() {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const { nodes, fetchNodes } = useNodeStore();
  const { setChannels } = useDMXStore();
  const node = nodes.find(n => (n.node_id || n.id) === nodeId);
  const [testing, setTesting] = useState(false);
  const [testStep, setTestStep] = useState(0);

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleClose = () => navigate(-1);

  const isBuiltIn = node?.is_builtin || node?.isBuiltIn;
  const isOnline = node?.status === 'online';
  const universe = node?.universe || 1;
  const startCh = node?.channel_start || 1;
  const endCh = node?.channel_end || 512;

  // 4-channel test sequence: Red, Green, Blue, White, then off
  const runChannelTest = async () => {
    if (testing || !node) return;
    setTesting(true);
    
    const testColors = [
      { name: 'Red', channels: { [startCh]: 255, [startCh+1]: 0, [startCh+2]: 0, [startCh+3]: 0 } },
      { name: 'Green', channels: { [startCh]: 0, [startCh+1]: 255, [startCh+2]: 0, [startCh+3]: 0 } },
      { name: 'Blue', channels: { [startCh]: 0, [startCh+1]: 0, [startCh+2]: 255, [startCh+3]: 0 } },
      { name: 'White', channels: { [startCh]: 255, [startCh+1]: 255, [startCh+2]: 255, [startCh+3]: 255 } },
    ];

    for (let i = 0; i < testColors.length; i++) {
      setTestStep(i + 1);
      await setChannels(universe, testColors[i].channels, 200);
      await new Promise(r => setTimeout(r, 800));
    }

    // Turn off
    setTestStep(5);
    const offChannels = {};
    for (let ch = startCh; ch <= Math.min(startCh + 3, endCh); ch++) {
      offChannels[ch] = 0;
    }
    await setChannels(universe, offChannels, 300);
    
    setTesting(false);
    setTestStep(0);
  };

  const testLabels = ['', 'Red', 'Green', 'Blue', 'White', 'Off'];

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'white', marginRight: 12, cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0 }}>{node?.name || 'Node'}</h1>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Node Details</span>
        </div>
        <button onClick={fetchNodes} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', marginRight: 8 }}>
          <RefreshCw size={18} color="white" />
        </button>
        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          <X size={22} />
        </button>
      </div>

      {!node ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Node not found</p>
        </div>
      ) : (
        <div style={{ padding: 16, flex: 1, overflow: 'auto' }}>
          {/* Status Card */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${isOnline ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isBuiltIn ? <Server size={32} color="#60a5fa" /> : <Wifi size={32} color={isOnline ? '#22c55e' : '#666'} />}
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>{isBuiltIn ? 'Built-in DMX' : 'Wireless Node'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#22c55e' : '#666' }} />
                  <span style={{ color: isOnline ? '#22c55e' : '#666', fontSize: 12, fontWeight: 600 }}>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <InfoCard label="Universe" value={universe} icon={<Activity size={14} />} />
            <InfoCard label="Channels" value={`${startCh} - ${endCh}`} icon={<Zap size={14} />} />
            <InfoCard label="IP Address" value={node.ip || 'N/A'} />
            <InfoCard label="MAC" value={node.mac || 'N/A'} />
            <InfoCard label="Firmware" value={node.firmware || 'N/A'} />
            <InfoCard label="RSSI" value={node.rssi ? `${node.rssi} dBm` : 'N/A'} />
          </div>

          {/* Channel Test */}
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Channel Test</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Tests first 4 channels (RGBW)</div>
              </div>
              {testing && (
                <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600 }}>{testLabels[testStep]}</span>
              )}
            </div>
            <button
              onClick={runChannelTest}
              disabled={testing || !isOnline}
              style={{
                width: '100%',
                padding: '12px 0',
                background: testing ? 'rgba(139,92,246,0.3)' : '#8b5cf6',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: testing || !isOnline ? 'not-allowed' : 'pointer',
                opacity: !isOnline ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {testing ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Testing...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Run Test
                </>
              )}
            </button>
          </div>

          {/* Quick Actions */}
          {!isBuiltIn && (
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button
                onClick={() => { handleClose(); setTimeout(() => navigate('/nodes'), 100); }}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Manage Nodes
              </button>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        {icon && <span style={{ color: 'rgba(255,255,255,0.4)' }}>{icon}</span>}
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
