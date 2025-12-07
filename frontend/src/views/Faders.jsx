import React, { useState, useEffect } from 'react';
import { Power, PowerOff, Save, Layers, Grid3X3, Cpu, Wifi, Server } from 'lucide-react';
import useDMXStore from '../store/dmxStore';
import useNodeStore from '../store/nodeStore';
import Fader from '../components/controls/Fader';

// Main Entry: Choose Browse Method
function BrowseMethodSelect({ onSelectMethod, nodes }) {
  const universes = [...new Set(nodes.map(n => n.universe || 1))].sort((a, b) => a - b);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold text-white mb-1">Channel Control</h2>
      <p className="text-sm text-white/50 mb-6">Choose how to browse channels</p>

      <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
        <button
          onClick={() => onSelectMethod('universe')}
          className="card p-4 hover:bg-white/5 transition-all text-left"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Layers className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">By Universe</h3>
              <p className="text-[10px] text-white/50 mb-2">Browse all channels</p>
              <div className="flex flex-wrap gap-1">
                {universes.map(u => (
                  <span key={u} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">
                    U{u}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelectMethod('device')}
          className="card p-4 hover:bg-white/5 transition-all text-left"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-green-500/20">
              <Cpu className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">By Device</h3>
              <p className="text-[10px] text-white/50 mb-2">Control by node</p>
              <div className="flex flex-wrap gap-1">
                {nodes.slice(0, 2).map(n => (
                  <span key={n.node_id} className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded flex items-center gap-1">
                    {n.is_builtin || n.isBuiltIn ? <Server className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                    {(n.name || 'Node').slice(0, 6)}
                  </span>
                ))}
                {nodes.length > 2 && (
                  <span className="px-2 py-0.5 bg-white/10 text-white/40 text-[10px] rounded">+{nodes.length - 2}</span>
                )}
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// Universe Selection
function UniverseSelect({ onSelect, nodes }) {
  const universes = [...new Set(nodes.map(n => n.universe || 1))].sort((a, b) => a - b);

  useEffect(() => {
    if (universes.length === 1) onSelect(universes[0]);
  }, [universes.length]);

  if (universes.length === 1) {
    return <div className="flex-1 flex items-center justify-center text-white/50">Loading Universe {universes[0]}...</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold text-white mb-1">Select Universe</h2>
      <p className="text-sm text-white/50 mb-6">Choose a DMX universe</p>

      <div className="grid grid-cols-2 gap-3 max-w-md w-full">
        {universes.map((universe) => {
          const nodesInUniverse = nodes.filter(n => (n.universe || 1) === universe);
          return (
            <button key={universe} onClick={() => onSelect(universe)} className="card p-4 hover:bg-white/5 transition-all">
              <div className="flex flex-col items-center gap-2">
                <Layers className="w-8 h-8 theme-text" />
                <span className="text-lg font-bold text-white">Universe {universe}</span>
                <span className="text-xs text-white/50">{nodesInUniverse.length} device{nodesInUniverse.length !== 1 ? 's' : ''}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Device Selection
function DeviceSelect({ onSelect, nodes }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold text-white mb-1">Select Device</h2>
      <p className="text-sm text-white/50 mb-6">Choose a node to control</p>

      <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
        {nodes.map((node) => {
          const isBuiltIn = node.is_builtin || node.isBuiltIn;
          const isOnline = node.status === 'online';
          const start = node.channel_start || node.channelStart || 1;
          const end = node.channel_end || node.channelEnd || 512;

          return (
            <button
              key={node.node_id}
              onClick={() => onSelect(node)}
              className={`card p-3 hover:bg-white/5 transition-all text-left ${!isOnline ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isBuiltIn ? 'bg-purple-500/20' : 'bg-green-500/20'}`}>
                  {isBuiltIn ? (
                    <Server className={`w-5 h-5 ${isOnline ? 'text-purple-400' : 'text-white/30'}`} />
                  ) : (
                    <Wifi className={`w-5 h-5 ${isOnline ? 'text-green-400' : 'text-white/30'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{node.name || node.hostname || `Node`}</h3>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                  </div>
                  <p className="text-[10px] text-white/50">U{node.universe || 1} • Ch {start}-{end}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {nodes.length === 0 && (
        <div className="card p-6 text-center text-white/50">No devices paired yet.</div>
      )}
    </div>
  );
}

// Channel Bank Selection
function ChannelBankSelect({ universe, device, onSelect, channelRange }) {
  const minChannel = channelRange?.start || 1;
  const maxChannel = channelRange?.end || 512;

  const banks = [];
  for (let i = Math.floor((minChannel - 1) / 100) * 100 + 1; i <= maxChannel; i += 100) {
    const bankStart = Math.max(i, minChannel);
    const bankEnd = Math.min(i + 99, maxChannel);
    if (bankStart <= bankEnd) banks.push({ start: bankStart, end: bankEnd, label: `${bankStart}-${bankEnd}` });
  }

  useEffect(() => {
    if (banks.length === 1) onSelect(banks[0]);
  }, [banks.length]);

  if (banks.length === 1) {
    return <div className="flex-1 flex items-center justify-center text-white/50">Loading channels {banks[0].label}...</div>;
  }

  const title = device ? `${device.name || 'Device'}` : `Universe ${universe}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
      <p className="text-sm text-white/50 mb-6">Select channel range</p>

      <div className="grid grid-cols-3 gap-3 max-w-md w-full">
        {banks.map((bank) => (
          <button key={bank.label} onClick={() => onSelect(bank)} className="card p-3 hover:bg-white/5 transition-all">
            <div className="flex flex-col items-center gap-1">
              <Grid3X3 className="w-5 h-5 theme-text" />
              <span className="text-sm font-bold text-white">{bank.label}</span>
              <span className="text-[10px] text-white/50">{bank.end - bank.start + 1} ch</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Channel Page Selection
function ChannelPageSelect({ universe, device, bank, onSelect }) {
  const pages = [];
  for (let i = bank.start; i <= bank.end; i += 10) {
    const end = Math.min(i + 9, bank.end);
    pages.push({ start: i, end, label: `${i}-${end}` });
  }

  const title = device ? device.name || 'Device' : `Universe ${universe}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
      <p className="text-sm text-white/50 mb-6">Select 10-channel group from {bank.label}</p>

      <div className="grid grid-cols-5 gap-2 max-w-lg w-full">
        {pages.map((page) => (
          <button key={page.label} onClick={() => onSelect(page)} className="card p-2 hover:bg-white/5 transition-all">
            <span className="text-xs font-bold text-white">{page.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Faders View
function FadersView({ universe, device, page, onSaveScene }) {
  const { universeState, channelLabels, setChannel, setChannelLabel, fetchUniverseState, setChannels } = useDMXStore();
  const [allOff, setAllOff] = useState(false);

  const targetUniverse = device?.universe || universe;

  useEffect(() => {
    fetchUniverseState(targetUniverse);
  }, [targetUniverse, fetchUniverseState]);

  const handleTogglePower = () => {
    const channels = {};
    for (let i = page.start; i <= page.end; i++) {
      channels[i] = allOff ? 255 : 0;
    }
    setChannels(targetUniverse, channels);
    setAllOff(!allOff);
  };

  const channelCount = page.end - page.start + 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Info Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-3 text-sm">
          {device && (
            <div className="flex items-center gap-1.5">
              {device.is_builtin || device.isBuiltIn ? (
                <Server className="w-4 h-4 text-purple-400" />
              ) : (
                <Wifi className="w-4 h-4 text-green-400" />
              )}
              <span className="font-medium text-white">{(device.name || 'Device').slice(0, 15)}</span>
            </div>
          )}
          <span className="text-white/50">U{targetUniverse}</span>
          <span className="font-bold text-white">{page.start}-{page.end}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePower}
            className={`btn btn-sm ${allOff ? 'btn-success' : 'btn-danger'}`}
          >
            {allOff ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
          </button>

          <button onClick={onSaveScene} className="btn btn-sm btn-primary">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      {/* Faders Grid */}
      <div className="flex-1 p-2 overflow-hidden">
        <div className="h-full grid gap-1" style={{ gridTemplateColumns: `repeat(${channelCount}, 1fr)` }}>
          {Array.from({ length: channelCount }, (_, i) => {
            const channel = page.start + i;
            return (
              <div key={channel} className="h-full min-h-0">
                <Fader
                  channel={channel}
                  value={universeState[channel - 1] || 0}
                  label={channelLabels[channel] || `${channel}`}
                  onChange={(value) => setChannel(targetUniverse, channel, value)}
                  onLabelChange={(label) => setChannelLabel(channel, label)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function Faders() {
  const { nodes, fetchNodes } = useNodeStore();
  const [step, setStep] = useState('method');
  const [browseMethod, setBrowseMethod] = useState(null);
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);

  useEffect(() => { fetchNodes(); }, []);

  const getChannelRange = () => {
    if (selectedDevice) {
      return {
        start: selectedDevice.channel_start || selectedDevice.channelStart || 1,
        end: selectedDevice.channel_end || selectedDevice.channelEnd || 512
      };
    }
    return { start: 1, end: 512 };
  };

  const handleMethodSelect = (method) => {
    setBrowseMethod(method);
    setStep(method === 'universe' ? 'universe' : 'device');
  };

  const pairedNodes = nodes.filter(n => n.is_paired !== false || n.is_builtin || n.isBuiltIn);

  return (
    <div className="page-container">
      {step === 'method' && <BrowseMethodSelect onSelectMethod={handleMethodSelect} nodes={pairedNodes} />}
      {step === 'universe' && <UniverseSelect onSelect={(u) => { setSelectedUniverse(u); setStep('bank'); }} nodes={pairedNodes} />}
      {step === 'device' && <DeviceSelect onSelect={(d) => { setSelectedDevice(d); setSelectedUniverse(d.universe || 1); setStep('bank'); }} nodes={pairedNodes} />}
      {step === 'bank' && <ChannelBankSelect universe={selectedUniverse} device={selectedDevice} onSelect={(b) => { setSelectedBank(b); setStep('page'); }} channelRange={getChannelRange()} />}
      {step === 'page' && <ChannelPageSelect universe={selectedUniverse} device={selectedDevice} bank={selectedBank} onSelect={(p) => { setSelectedPage(p); setStep('faders'); }} />}
      {step === 'faders' && <FadersView universe={selectedUniverse} device={selectedDevice} page={selectedPage} onSaveScene={() => alert('Save Scene - Coming soon!')} />}
    </div>
  );
}

export const FadersHeaderExtension = () => null;
