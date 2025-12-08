import React, { useState, useEffect } from 'react';
import {
  Palette, Bot, Eye, EyeOff, Shield, Zap, Trash2, Lock, User, Settings as SettingsIcon,
  Key, CheckCircle, Activity, Server, Cpu, HardDrive, Thermometer,
  Globe, Radio, Network, CheckCircle2, XCircle, Loader, Sparkles, Circle
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { useNavigate } from 'react-router-dom';
import useUIStore from '../store/uiStore';
import useAIStore from '../store/aiStore';
import useAuthStore from '../store/authStore';
import useBackgroundStore from '../store/backgroundStore';
import useNodeStore from '../store/nodeStore';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import BackgroundThemeModal from '../components/BackgroundThemeModal';
import useToastStore from '../store/toastStore';

const getBackendUrl = () => `http://${window.location.hostname}:8891`;

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useUIStore();
  const { nodes, fetchNodes } = useNodeStore();
  const { currentScene } = useSceneStore();
  const { activeChase } = useChaseStore();
  const {
    apiKey, model, confirmationRules, safetyWarnings,
    setApiKey, setModel, setConfirmationRules, setSafetyWarnings, clearHistory,
  } = useAIStore();

  const {
    securityEnabled, userPin, adminPin, permissions,
    setSecurityEnabled, setUserPin, setAdminPin, setPermission,
  } = useAuthStore();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [customColor, setCustomColor] = useState(theme);
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showUserPin, setShowUserPin] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [tempUserPin, setTempUserPin] = useState(userPin);
  const [tempAdminPin, setTempAdminPin] = useState(adminPin);
  const [activeTab, setActiveTab] = useState('status');
  const [themeSaved, setThemeSaved] = useState(false);
  const [recentColors, setRecentColors] = useState(['#64c8ff', '#ff6496', '#64ffa0', '#a064ff', '#ffc864']);
  const { enabled, preset, speed, bubbleCount, intensity, size, setEnabled, setPreset, setSpeed, setBubbleCount, setIntensity, setSize } = useBackgroundStore();
  const toast = useToastStore();

  // Device status
  const [deviceStatus, setDeviceStatus] = useState({
    internet: false,
    aetherNetwork: false,
    systemHealthy: false,
    checking: true,
  });

  const [systemStats, setSystemStats] = useState({
    cpuLoad: '--',
    memory: '--',
    temperature: '--',
  });

  useEffect(() => {
    fetchNodes();
    checkDeviceStatus();
    fetchSystemStats();
    const interval = setInterval(() => {
      checkDeviceStatus();
      fetchSystemStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkDeviceStatus = async () => {
    const status = {
      internet: false,
      aetherNetwork: false,
      systemHealthy: false,
      checking: false,
    };

    // Check internet (optional)
    try {
      await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', signal: AbortSignal.timeout(3000) });
      status.internet = true;
    } catch (e) {}

    // Check Aether Network (backend connectivity)
    try {
      const response = await fetch(`${getBackendUrl()}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        status.aetherNetwork = true;
        status.systemHealthy = data?.status === 'healthy';
      }
    } catch (e) {
      console.log('Aether Network check failed:', e);
    }

    setDeviceStatus(status);
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/system/stats`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        setSystemStats({
          cpuLoad: data.cpu_percent ? `${Math.round(data.cpu_percent)}%` : '--',
          memory: data.memory_used ? `${(data.memory_used / 1024 / 1024 / 1024).toFixed(1)}GB` : '--',
          temperature: data.cpu_temp ? `${Math.round(data.cpu_temp)}°C` : '--',
        });
      }
    } catch (e) {}
  };

  const handleColorChange = async (color) => {
    setCustomColor(color);
    await setTheme(color); // This now applies CSS variables and saves to backend
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);

    setRecentColors(prev => {
      const updated = [color, ...prev.filter(c => c.toLowerCase() !== color.toLowerCase())].slice(0, 5);
      return updated;
    });
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 100, g: 200, b: 255 };
  };

  const rgb = hexToRgb(customColor);

  // Get online nodes count from SSOT
  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const totalNodes = nodes.length;

  // DMX Engine state: 'active' (green), 'ready' (yellow), 'error' (red)
  const isDmxActive = currentScene !== null || activeChase !== null;
  const dmxEngineState = !deviceStatus.systemHealthy ? 'error' : (isDmxActive ? 'active' : 'ready');

  const tabs = [
    { id: 'status', label: 'Status', icon: Activity },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'system', label: 'System', icon: Cpu },
    { id: 'ai', label: 'AI', icon: Bot },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'background', label: 'Background', icon: Sparkles },
  ];

  // Status indicator - supports greyed out state
  const StatusIndicator = ({ active, label, icon: Icon, subtitle, greyed = false }) => (
    <div className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${greyed ? 'opacity-50' : ''}`}
      style={{
        background: greyed ? 'rgba(255,255,255,0.02)' : (active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
        borderColor: greyed ? 'rgba(255,255,255,0.1)' : (active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'),
      }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active && !greyed ? 'animate-pulse' : ''}`}
        style={{ background: greyed ? 'rgba(255,255,255,0.1)' : (active ? '#22c55e' : '#ef4444') }}
      >
        <Icon size={18} color={greyed ? 'rgba(255,255,255,0.3)' : '#fff'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: greyed ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
          {label}
        </div>
        <div className="text-xs" style={{ color: greyed ? 'var(--text-muted)' : (active ? '#22c55e' : '#ef4444') }}>
          {subtitle || (active ? 'Connected' : 'Disconnected')}
        </div>
      </div>
      {!greyed && (active ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />)}
    </div>
  );

  // 3-state indicator for DMX Engine
  const DMXEngineIndicator = ({ state }) => {
    const config = {
      active: { bg: '#22c55e', bgAlpha: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', label: 'Active', pulse: true },
      ready: { bg: '#f59e0b', bgAlpha: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', label: 'Ready', pulse: false },
      error: { bg: '#ef4444', bgAlpha: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', label: 'Error', pulse: false },
    };
    const c = config[state] || config.error;

    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border transition-all"
        style={{ background: c.bgAlpha, borderColor: c.border }}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.pulse ? 'animate-pulse' : ''}`}
          style={{ background: c.bg }}
        >
          <Zap size={18} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white">DMX Engine</div>
          <div className="text-xs" style={{ color: c.bg }}>{c.label}</div>
        </div>
        <Circle size={12} fill={c.bg} color={c.bg} />
      </div>
    );
  };

  const permissionActions = [
    { key: 'viewDashboard', label: 'Dashboard', icon: SettingsIcon },
    { key: 'controlFaders', label: 'Faders', icon: Zap },
    { key: 'runScenes', label: 'Scenes', icon: Zap },
    { key: 'runChases', label: 'Chases', icon: Zap },
    { key: 'editScenes', label: 'Edit Scenes', icon: Shield },
    { key: 'editChases', label: 'Edit Chases', icon: Shield },
  ];

  return (
    <div className="page-container">
      {/* Tabs */}
      <div className="h-[40px] shrink-0 border-b px-3 flex items-center gap-1.5 overflow-x-auto"
        style={{ borderColor: 'var(--border-color)', background: 'rgba(0, 0, 0, 0.3)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              activeTab === tab.id ? 'scale-105' : 'opacity-60'
            }`}
            style={{
              background: activeTab === tab.id ? 'var(--theme-primary)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-primary)',
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">

        {/* STATUS TAB */}
        {activeTab === 'status' && (
          <div className="flex flex-col gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={20} className="theme-text" />
                <h2 className="text-base font-bold text-white">System Status</h2>
                {deviceStatus.checking && <Loader className="animate-spin w-4 h-4 theme-text" />}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Internet - Greyed out if not connected */}
                <StatusIndicator 
                  active={deviceStatus.internet} 
                  label="Internet" 
                  icon={Globe} 
                  greyed={!deviceStatus.internet}
                  subtitle={deviceStatus.internet ? 'Available' : 'Not Required'}
                />

                {/* Aether Network */}
                <StatusIndicator 
                  active={deviceStatus.aetherNetwork} 
                  label="Aether Network" 
                  icon={Radio} 
                  subtitle={deviceStatus.aetherNetwork ? 'Online' : 'Offline'}
                />

                {/* DMX Engine - 3 state */}
                <DMXEngineIndicator state={dmxEngineState} />

                {/* Node Manager Button */}
                <button
                  onClick={() => navigate('/nodes')}
                  className="flex items-center gap-2 p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'rgba(var(--theme-primary-rgb), 0.1)',
                    borderColor: 'rgba(var(--theme-primary-rgb), 0.3)',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center theme-bg">
                    <Network size={18} color="#fff" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-bold text-white">Node Manager</div>
                    <div className="text-xs theme-text">
                      {onlineNodes}/{totalNodes} Online
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3">
                <Cpu size={16} className="mb-1 theme-text" />
                <div className="text-lg font-bold text-white">{systemStats.cpuLoad}</div>
                <div className="text-xs text-white/50">CPU Load</div>
              </div>
              <div className="card p-3">
                <HardDrive size={16} className="mb-1 theme-text" />
                <div className="text-lg font-bold text-white">{systemStats.memory}</div>
                <div className="text-xs text-white/50">Memory</div>
              </div>
              <div className="card p-3">
                <Thermometer size={16} className="mb-1 theme-text" />
                <div className="text-lg font-bold text-white">{systemStats.temperature}</div>
                <div className="text-xs text-white/50">Temperature</div>
              </div>
            </div>
          </div>
        )}

        {/* THEME TAB */}
        {activeTab === "theme" && (
          <div className="card p-3 relative">
            {themeSaved && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 border border-green-500/30 z-10">
                <CheckCircle size={12} className="text-green-400" />
                <span className="text-xs font-bold text-green-400">Saved!</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <HexColorPicker color={customColor} onChange={handleColorChange} style={{ width: "100%", height: "200px" }} />
              </div>

              <div className="space-y-2">
                <div className="rounded-xl border-2 p-2 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${customColor}20, ${customColor}05)`,
                    borderColor: customColor,
                  }}
                >
                  <div className="w-12 h-12 rounded-full mx-auto mb-1" style={{ backgroundColor: customColor }} />
                  <div className="text-xs font-bold text-white">Preview</div>
                </div>

                <div>
                  <div className="text-xs font-bold mb-1 text-white/50">HEX</div>
                  <input type="text" value={customColor.toUpperCase()} onChange={(e) => {
                    if (/^#[0-9A-F]{0,6}$/i.test(e.target.value)) {
                      setCustomColor(e.target.value);
                      if (e.target.value.length === 7) handleColorChange(e.target.value);
                    }
                  }}
                    className="input font-mono text-center font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {['R', 'G', 'B'].map((c, i) => (
                    <div key={c}>
                      <div className="text-xs font-bold mb-1 text-center text-white/50">{c}</div>
                      <div className="px-1 py-1 rounded-lg border text-center font-mono text-xs font-bold text-white"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
                        {[rgb.r, rgb.g, rgb.b][i]}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs font-bold mb-1 text-white/50">Recent</div>
                  <div className="flex gap-1.5 justify-center">
                    {recentColors.map((c, i) => (
                      <button key={i} onClick={() => handleColorChange(c)}
                        className={`w-8 h-8 rounded-full transition-all ${customColor.toLowerCase() === c.toLowerCase() ? "ring-2 ring-white scale-110" : "hover:scale-110"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM TAB */}
        {activeTab === 'system' && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={20} className="theme-text" />
              <h2 className="text-base font-bold text-white">System Info</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Version', value: '2.0.0' },
                { label: 'Protocol', value: 'sACN/E1.31' },
                { label: 'Device', value: 'Pi 5' },
                { label: 'OS', value: 'Debian 12' },
                { label: 'Kernel', value: '6.1.0' },
                { label: 'Uptime', value: '24d 8h' },
                { label: 'RAM', value: '4.0 GB' },
                { label: 'Storage', value: '32 GB' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl border" style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
                  <div className="text-xs mb-1 font-bold text-white/50">{item.label}</div>
                  <div className="text-sm font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI TAB */}
        {activeTab === 'ai' && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={20} className="theme-text" />
              <h2 className="text-base font-bold text-white">AI Assistant</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold mb-1 block text-white/70">API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input type={showApiKey ? 'text' : 'password'} value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)}
                      className="input pr-10 text-xs font-mono"
                    />
                    <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50">
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button onClick={() => { setApiKey(tempApiKey); toast.success('API Key saved!'); }} className="btn btn-primary">
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block text-white/70">Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="input text-sm">
                  <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                  <option value="claude-4-20241220">Claude Opus 4</option>
                </select>
              </div>

              <div className="space-y-2">
                <button onClick={() => setConfirmationRules(!confirmationRules)}
                  className="w-full p-3 rounded-xl border flex items-center justify-between transition-all"
                  style={{ borderColor: 'var(--border-color)', background: confirmationRules ? 'rgba(var(--theme-primary-rgb), 0.1)' : 'transparent' }}>
                  <span className="text-sm font-bold text-white">Confirmation Rules</span>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${confirmationRules ? 'theme-bg' : 'bg-white/20'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all ${confirmationRules ? 'translate-x-5' : ''}`} />
                  </div>
                </button>

                <button onClick={() => setSafetyWarnings(!safetyWarnings)}
                  className="w-full p-3 rounded-xl border flex items-center justify-between transition-all"
                  style={{ borderColor: 'var(--border-color)', background: safetyWarnings ? 'rgba(var(--theme-primary-rgb), 0.1)' : 'transparent' }}>
                  <span className="text-sm font-bold text-white">Safety Warnings</span>
                  <div className={`w-10 h-5 rounded-full relative transition-all ${safetyWarnings ? 'theme-bg' : 'bg-white/20'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all ${safetyWarnings ? 'translate-x-5' : ''}`} />
                  </div>
                </button>

                <button onClick={() => { if(confirm('Clear history?')) clearHistory(); }} className="btn btn-danger w-full">
                  <Trash2 size={14} /> Clear History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="flex flex-col gap-3">
            <div className="card p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={18} style={{ color: securityEnabled ? '#22c55e' : 'var(--text-tertiary)' }} />
                  <div>
                    <div className="text-sm font-bold text-white">Security System</div>
                    <div className="text-xs text-white/50">{securityEnabled ? 'Active' : 'Disabled'}</div>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${securityEnabled ? 'bg-green-500' : 'bg-white/20'}`}
                  onClick={() => { if(confirm(securityEnabled ? 'Disable?' : 'Enable?')) setSecurityEnabled(!securityEnabled); }}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${securityEnabled ? 'translate-x-6' : ''}`} />
                </div>
              </div>
            </div>

            <div className="card p-3">
              <div className="text-xs font-bold mb-2 text-white/70">PINs</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs mb-1 text-white/50">User PIN</div>
                  <input type={showUserPin ? 'text' : 'password'} value={tempUserPin}
                    onChange={(e) => setTempUserPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input text-sm font-mono"
                  />
                </div>
                <div>
                  <div className="text-xs mb-1 text-white/50">Admin PIN</div>
                  <input type={showAdminPin ? 'text' : 'password'} value={tempAdminPin}
                    onChange={(e) => setTempAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input text-sm font-mono"
                  />
                </div>
              </div>
              <button onClick={() => { setUserPin(tempUserPin); setAdminPin(tempAdminPin); toast.success('PINs saved!'); }}
                className="btn btn-primary w-full mt-2">
                Save PINs
              </button>
            </div>

            <div className="card p-3">
              <div className="text-xs font-bold mb-2 text-white/70">User Permissions</div>
              <div className="grid grid-cols-3 gap-2">
                {permissionActions.map((action) => (
                  <button key={action.key} onClick={() => setPermission('user', action.key, !permissions.user[action.key])}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${permissions.user[action.key] ? 'theme-border' : ''}`}
                    style={{
                      borderColor: permissions.user[action.key] ? 'var(--theme-primary)' : 'var(--border-color)',
                      background: permissions.user[action.key] ? 'rgba(var(--theme-primary-rgb), 0.1)' : 'var(--input-bg)',
                      color: 'var(--text-primary)',
                    }}>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BACKGROUND TAB */}
        {activeTab === 'background' && (
          <div className="flex flex-col gap-3">
            {/* Enable Toggle */}
            <div className="card p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="theme-text" />
                <span className="text-sm font-bold text-white">Background Animation</span>
              </div>
              <div className={`w-14 h-7 rounded-full relative cursor-pointer ${enabled ? 'theme-bg' : 'bg-white/20'}`}
                onClick={() => setEnabled(!enabled)}>
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : ''}`} />
              </div>
            </div>

            {enabled && (
              <>
                {/* Theme Selection - Button Grid */}
                <div className="card p-3">
                  <div className="text-xs font-bold text-white/50 mb-2">THEME</div>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { id: 'default', label: 'Default', colors: ['var(--theme-primary)'] },
                      { id: 'warm', label: 'Warm', colors: ['#ff6b6b', '#feca57'] },
                      { id: 'cool', label: 'Cool', colors: ['#54a0ff', '#48dbfb'] },
                      { id: 'sunset', label: 'Sunset', colors: ['#ff6b6b', '#feca57', '#ff9ff3'] },
                      { id: 'ocean', label: 'Ocean', colors: ['#0abde3', '#10ac84'] },
                      { id: 'forest', label: 'Forest', colors: ['#10ac84', '#2ecc71'] },
                      { id: 'aurora', label: 'Aurora', colors: ['#a29bfe', '#74b9ff', '#55efc4'] },
                      { id: 'cosmic', label: 'Cosmic', colors: ['#6c5ce7', '#fd79a8'] },
                      { id: 'cyberpunk', label: 'Cyber', colors: ['#ff00ff', '#00ffff'] },
                      { id: 'neon', label: 'Neon', colors: ['#39ff14', '#ff073a'] },
                      { id: 'fire', label: 'Fire', colors: ['#ff4500', '#ffa500'] },
                      { id: 'midnight', label: 'Night', colors: ['#2c3e50', '#5d6d7e'] },
                    ].map((t) => (
                      <button key={t.id} onClick={() => setPreset(t.id)}
                        className={`p-2 rounded-lg border-2 transition-all ${preset === t.id ? 'border-white scale-105' : 'border-transparent'}`}
                        style={{ background: t.colors.length > 1 ? `linear-gradient(135deg, ${t.colors.join(', ')})` : t.colors[0] }}>
                        <span className="text-[10px] font-bold text-white drop-shadow-lg">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed & Intensity - Simple Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Speed */}
                  <div className="card p-3">
                    <div className="text-xs font-bold text-white/50 mb-2">SPEED</div>
                    <div className="flex gap-2">
                      {['slow', 'normal', 'fast'].map((s) => (
                        <button key={s} onClick={() => setSpeed(s)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${
                            speed === s ? 'theme-bg text-white' : 'bg-white/10 text-white/60'
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="card p-3">
                    <div className="text-xs font-bold text-white/50 mb-2">AMOUNT</div>
                    <div className="flex gap-2">
                      {[
                        { label: 'Few', value: 15 },
                        { label: 'Med', value: 30 },
                        { label: 'Many', value: 50 },
                      ].map((a) => (
                        <button key={a.value} onClick={() => setBubbleCount(a.value)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                            bubbleCount === a.value ? 'theme-bg text-white' : 'bg-white/10 text-white/60'
                          }`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <BackgroundThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentPreset={preset}
        onSelect={setPreset}
        themeColor={theme}
      />
    </div>
  );
}
