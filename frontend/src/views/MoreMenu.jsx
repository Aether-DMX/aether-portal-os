import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, X, Activity, Palette, Sparkles, Cpu, Bot, Shield,
  Globe, Radio, Zap, Network, Eye, EyeOff, Trash2, Thermometer, HardDrive
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { HexColorPicker } from 'react-colorful';
import useUIStore from '../store/uiStore';
import useAIStore from '../store/aiStore';
import useAuthStore from '../store/authStore';
import useBackgroundStore from '../store/backgroundStore';
import useNodeStore from '../store/nodeStore';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import useToastStore from '../store/toastStore';

const getBackendUrl = () => `http://${window.location.hostname}:8891`;
const LIVE_CONSOLE_URL = 'http://192.168.168.51:3000/mobile';

const quickActions = [
  { icon: '📱', name: 'Remote', action: 'openLiveQR' },
  { icon: '🎚️', name: 'Fixtures', path: '/fixtures-menu' },
  { icon: '📅', name: 'Schedule', path: '/schedules-menu' },
  { icon: '📡', name: 'Nodes', path: '/nodes' },
];


const settingsTabs = [
  { id: 'status', label: 'Status', icon: Activity },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'background', label: 'BG', icon: Sparkles },
  { id: 'system', label: 'System', icon: Cpu },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'security', label: 'Security', icon: Shield },
];

const accentColors = [
  '#00ffaa', '#00d4ff', '#ff6b6b', '#ffd93d',
  '#6bcb77', '#9b59b6', '#ff9f43', '#00cec9',
];

const bgThemes = [
  { id: 'live', label: '🎭 Live', colors: ['#00ff88', '#ff00ff'] },
  { id: 'default', label: 'Default', colors: ['var(--theme-primary)'] },
  { id: 'warm', label: 'Warm', colors: ['#ff6b6b', '#feca57'] },
  { id: 'cool', label: 'Cool', colors: ['#54a0ff', '#48dbfb'] },
  { id: 'sunset', label: 'Sunset', colors: ['#ff6b6b', '#feca57', '#ff9ff3'] },
  { id: 'ocean', label: 'Ocean', colors: ['#0abde3', '#10ac84'] },
  { id: 'aurora', label: 'Aurora', colors: ['#a29bfe', '#74b9ff', '#55efc4'] },
  { id: 'cosmic', label: 'Cosmic', colors: ['#6c5ce7', '#fd79a8'] },
  { id: 'neon', label: 'Neon', colors: ['#39ff14', '#ff073a'] },
];

export default function MoreMenu() {
  const navigate = useNavigate();
  const toast = useToastStore();
  const { theme, setTheme } = useUIStore();
  const { nodes, fetchNodes } = useNodeStore();
  const { currentScene } = useSceneStore();
  const { currentChase } = useChaseStore();
  const { enabled, preset, speed, bubbleCount, setEnabled, setPreset, setSpeed, setBubbleCount } = useBackgroundStore();
  const { apiKey, model, confirmationRules, safetyWarnings, setApiKey, setModel, setConfirmationRules, setSafetyWarnings, clearHistory } = useAIStore();
  const { securityEnabled, userPin, adminPin, setSecurityEnabled, setUserPin, setAdminPin } = useAuthStore();

  const [activeTab, setActiveTab] = useState('status');
  const [showLiveQR, setShowLiveQR] = useState(false);
  const [customColor, setCustomColor] = useState(theme);
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempUserPin, setTempUserPin] = useState(userPin);
  const [tempAdminPin, setTempAdminPin] = useState(adminPin);

  const [deviceStatus, setDeviceStatus] = useState({ internet: false, aetherNetwork: false, systemHealthy: false, checking: true });
  const [systemStats, setSystemStats] = useState({ cpuLoad: '--', memory: '--', temperature: '--' });

  useEffect(() => {
    fetchNodes();
    checkDeviceStatus();
    fetchSystemStats();
    const interval = setInterval(() => { checkDeviceStatus(); fetchSystemStats(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkDeviceStatus = async () => {
    const status = { internet: false, aetherNetwork: false, systemHealthy: false, checking: false };
    try { await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', signal: AbortSignal.timeout(3000) }); status.internet = true; } catch (e) {}
    try {
      const response = await fetch(getBackendUrl() + '/api/health', { signal: AbortSignal.timeout(3000) });
      if (response.ok) { const data = await response.json(); status.aetherNetwork = true; status.systemHealthy = data?.status === 'healthy'; }
    } catch (e) {}
    setDeviceStatus(status);
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch(getBackendUrl() + '/api/system/stats', { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        setSystemStats({
          cpuLoad: data.cpu_percent ? Math.round(data.cpu_percent) + '%' : '--',
          memory: data.memory_used ? (data.memory_used / 1024 / 1024 / 1024).toFixed(1) + 'GB' : '--',
          temperature: data.cpu_temp ? Math.round(data.cpu_temp) + '°C' : '--',
        });
      }
    } catch (e) {}
  };

  const handleColorChange = async (color) => {
    setCustomColor(color);
    await setTheme(color);
  };

  const handleQuickAction = (item) => {
    if (item.path) navigate(item.path);
    else if (item.action === 'openLiveQR') setShowLiveQR(true);
  };

  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(LIVE_CONSOLE_URL); toast.success('Copied!'); } catch (e) {}
  };

  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const totalNodes = nodes.length;
  const isDmxActive = currentScene !== null || currentChase !== null;
  const dmxState = !deviceStatus.systemHealthy ? 'error' : (isDmxActive ? 'active' : 'ready');

  const StatusCard = ({ active, label, icon: Icon, subtitle, greyed = false }) => (
    <div className={'flex items-center gap-2 p-2 rounded-xl border ' + (greyed ? 'opacity-40' : '')}
      style={{ background: greyed ? 'rgba(255,255,255,0.02)' : (active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'), borderColor: greyed ? 'rgba(255,255,255,0.1)' : (active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: greyed ? 'rgba(255,255,255,0.1)' : (active ? '#22c55e' : '#ef4444') }}>
        <Icon size={14} color={greyed ? 'rgba(255,255,255,0.3)' : '#fff'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white truncate">{label}</div>
        <div className="text-[10px]" style={{ color: greyed ? 'var(--text-muted)' : (active ? '#22c55e' : '#ef4444') }}>{subtitle}</div>
      </div>
    </div>
  );

  const DMXCard = () => {
    const cfg = { active: { bg: '#22c55e', label: 'Active' }, ready: { bg: '#f59e0b', label: 'Ready' }, error: { bg: '#ef4444', label: 'Error' } };
    const c = cfg[dmxState];
    return (
      <div className="flex items-center gap-2 p-2 rounded-xl border" style={{ background: c.bg + '15', borderColor: c.bg + '50' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.bg }}><Zap size={14} color="#fff" /></div>
        <div className="flex-1"><div className="text-xs font-bold text-white">DMX Engine</div><div className="text-[10px]" style={{ color: c.bg }}>{c.label}</div></div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10"><ArrowLeft size={18} className="text-white" /></button>
        <span className="text-white font-bold">More</span>
        <div className="w-8" />
      </div>

      {/* Quick Actions Row */}
      <div className="flex gap-2 px-3 py-2 border-b border-white/10 shrink-0">
        {quickActions.map((item) => (
          <button key={item.name} onClick={() => handleQuickAction(item)}
            className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--accent)] active:scale-95 transition-all">
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium text-white/70">{item.name}</span>
          </button>
        ))}
      </div>

      {/* Settings Tabs */}
      <div className="flex gap-1 px-3 py-1.5 border-b border-white/10 shrink-0 overflow-x-auto">
        {settingsTabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ' + (activeTab === tab.id ? 'bg-[var(--accent)] text-white' : 'text-white/50 hover:text-white/80')}>
            <tab.icon size={12} />{tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3">

        {/* STATUS */}
        {activeTab === 'status' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <StatusCard active={deviceStatus.internet} label="Internet" icon={Globe} subtitle={deviceStatus.internet ? 'Available' : 'Not Required'} greyed={!deviceStatus.internet} />
              <StatusCard active={deviceStatus.aetherNetwork} label="Aether" icon={Radio} subtitle={deviceStatus.aetherNetwork ? 'Online' : 'Offline'} />
              <DMXCard />
              <button onClick={() => navigate('/nodes')} className="flex items-center gap-2 p-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 active:scale-95">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--accent)]"><Network size={14} color="#fff" /></div>
                <div className="flex-1 text-left"><div className="text-xs font-bold text-white">Nodes</div><div className="text-[10px] text-[var(--accent)]">{onlineNodes}/{totalNodes} Online</div></div>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <Cpu size={14} className="mx-auto mb-1 text-[var(--accent)]" />
                <div className="text-sm font-bold text-white">{systemStats.cpuLoad}</div>
                <div className="text-[10px] text-white/40">CPU</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <HardDrive size={14} className="mx-auto mb-1 text-[var(--accent)]" />
                <div className="text-sm font-bold text-white">{systemStats.memory}</div>
                <div className="text-[10px] text-white/40">Memory</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <Thermometer size={14} className="mx-auto mb-1 text-[var(--accent)]" />
                <div className="text-sm font-bold text-white">{systemStats.temperature}</div>
                <div className="text-[10px] text-white/40">Temp</div>
              </div>
            </div>
          </div>
        )}

        {/* THEME */}
        {activeTab === 'theme' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <HexColorPicker color={customColor} onChange={handleColorChange} style={{ width: '100%', height: 140 }} />
            </div>
            <div className="w-32 space-y-2">
              <div className="p-2 rounded-xl border-2 text-center" style={{ background: customColor + '20', borderColor: customColor }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-1" style={{ backgroundColor: customColor }} />
                <div className="text-[10px] font-bold text-white">{customColor.toUpperCase()}</div>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {accentColors.map((c) => (
                  <button key={c} onClick={() => handleColorChange(c)}
                    className={'aspect-square rounded-lg border-2 transition-all ' + (customColor === c ? 'border-white scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BACKGROUND */}
        {activeTab === 'background' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--accent)]" />
                <span className="text-xs font-bold text-white">Animation</span>
              </div>
              <div className={'w-10 h-5 rounded-full relative cursor-pointer ' + (enabled ? 'bg-[var(--accent)]' : 'bg-white/20')} onClick={() => setEnabled(!enabled)}>
                <div className={'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ' + (enabled ? 'translate-x-5' : '')} />
              </div>
            </div>
            {enabled && (
              <>
                <div className="grid grid-cols-4 gap-1.5">
                  {bgThemes.map((t) => (
                    <button key={t.id} onClick={() => setPreset(t.id)}
                      className={'p-2 rounded-lg border-2 transition-all ' + (preset === t.id ? 'border-white' : 'border-transparent')}
                      style={{ background: t.colors.length > 1 ? 'linear-gradient(135deg, ' + t.colors.join(', ') + ')' : t.colors[0] }}>
                      <span className="text-[9px] font-bold text-white drop-shadow">{t.label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] font-bold text-white/50 mb-1">SPEED</div>
                    <div className="flex gap-1">
                      {['slow', 'normal', 'fast'].map((s) => (
                        <button key={s} onClick={() => setSpeed(s)} className={'flex-1 py-1 rounded text-[10px] font-bold capitalize ' + (speed === s ? 'bg-[var(--accent)] text-white' : 'bg-white/10 text-white/50')}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] font-bold text-white/50 mb-1">AMOUNT</div>
                    <div className="flex gap-1">
                      {[{ l: 'Few', v: 15 }, { l: 'Med', v: 30 }, { l: 'Many', v: 50 }].map((a) => (
                        <button key={a.v} onClick={() => setBubbleCount(a.v)} className={'flex-1 py-1 rounded text-[10px] font-bold ' + (bubbleCount === a.v ? 'bg-[var(--accent)] text-white' : 'bg-white/10 text-white/50')}>{a.l}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* SYSTEM */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Version', value: '2.0.0' },
              { label: 'Protocol', value: 'sACN' },
              { label: 'Device', value: 'Pi 5' },
              { label: 'OS', value: 'Debian 12' },
            ].map((item) => (
              <div key={item.label} className="p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-white/40 mb-0.5">{item.label}</div>
                <div className="text-xs font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* AI */}
        {activeTab === 'ai' && (
          <div className="space-y-2">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-bold text-white/50 mb-1">API KEY</div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input type={showApiKey ? 'text' : 'password'} value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white font-mono pr-8" />
                  <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40">
                    {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                <button onClick={() => { setApiKey(tempApiKey); toast.success('Saved!'); }} className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold">Save</button>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-bold text-white/50 mb-1">MODEL</div>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs text-white">
                <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                <option value="claude-4-20241220">Claude Opus 4</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmationRules(!confirmationRules)}
                className={'p-2 rounded-xl border flex items-center justify-between ' + (confirmationRules ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/10 bg-white/5')}>
                <span className="text-xs font-bold text-white">Confirmations</span>
                <div className={'w-8 h-4 rounded-full relative ' + (confirmationRules ? 'bg-[var(--accent)]' : 'bg-white/20')}>
                  <div className={'absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ' + (confirmationRules ? 'translate-x-4' : '')} />
                </div>
              </button>
              <button onClick={() => setSafetyWarnings(!safetyWarnings)}
                className={'p-2 rounded-xl border flex items-center justify-between ' + (safetyWarnings ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/10 bg-white/5')}>
                <span className="text-xs font-bold text-white">Safety</span>
                <div className={'w-8 h-4 rounded-full relative ' + (safetyWarnings ? 'bg-[var(--accent)]' : 'bg-white/20')}>
                  <div className={'absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ' + (safetyWarnings ? 'translate-x-4' : '')} />
                </div>
              </button>
            </div>
            <button onClick={() => { if(confirm('Clear AI history?')) clearHistory(); }} className="w-full p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1">
              <Trash2 size={12} /> Clear History
            </button>
          </div>
        )}

        {/* SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <Shield size={14} style={{ color: securityEnabled ? '#22c55e' : 'var(--text-tertiary)' }} />
                <div>
                  <div className="text-xs font-bold text-white">Security</div>
                  <div className="text-[10px] text-white/40">{securityEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
              <div className={'w-10 h-5 rounded-full relative cursor-pointer ' + (securityEnabled ? 'bg-green-500' : 'bg-white/20')}
                onClick={() => { if(confirm(securityEnabled ? 'Disable security?' : 'Enable security?')) setSecurityEnabled(!securityEnabled); }}>
                <div className={'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ' + (securityEnabled ? 'translate-x-5' : '')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-white/50 mb-1">User PIN</div>
                <input type="password" value={tempUserPin} onChange={(e) => setTempUserPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-2 py-1 rounded bg-black/30 border border-white/10 text-xs text-white font-mono text-center" />
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-white/50 mb-1">Admin PIN</div>
                <input type="password" value={tempAdminPin} onChange={(e) => setTempAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-2 py-1 rounded bg-black/30 border border-white/10 text-xs text-white font-mono text-center" />
              </div>
            </div>
            <button onClick={() => { setUserPin(tempUserPin); setAdminPin(tempAdminPin); toast.success('PINs saved!'); }}
              className="w-full p-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold">Save PINs</button>
          </div>
        )}
      </div>

      {/* Live Remote QR Modal */}
      {showLiveQR && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-3" onClick={() => setShowLiveQR(false)}>
          <div className="bg-[#0f1a1f] border border-cyan-500/30 rounded-2xl p-4 w-72" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📱</span>
                <div>
                  <h2 className="text-sm font-bold text-white">Live Remote</h2>
                  <p className="text-[10px] text-cyan-400">Control from phone</p>
                </div>
              </div>
              <button onClick={() => setShowLiveQR(false)} className="p-1 text-white/40"><X size={16} /></button>
            </div>
            <div className="flex flex-col items-center mb-3">
              <div className="p-2 bg-white rounded-xl mb-2"><QRCodeSVG value={LIVE_CONSOLE_URL} size={100} bgColor="#ffffff" fgColor="#000000" level="H" /></div>
              <p className="text-[10px] text-white/50">Scan with phone camera</p>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <code className="text-cyan-400 text-[10px] truncate flex-1">{LIVE_CONSOLE_URL}</code>
              <button onClick={copyToClipboard} className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">Copy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
