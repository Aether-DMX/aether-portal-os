import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Pause, Trash2, Edit3, Save, Camera, MessageSquare, X, Sparkles, Loader, Sliders, Zap, Sun, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import useDMXStore from '../store/dmxStore';
import useNodeStore from '../store/nodeStore';
import FaderModal from '../components/FaderModal';

// AI command processing
const processAICommand = (prompt, currentChannels = {}) => {
  const p = prompt.toLowerCase().trim();
  const channels = { ...currentChannels };
  const channelKeys = Object.keys(channels);
  let message = '';
  
  // Ensure we have channels to work with
  if (channelKeys.length === 0) {
    for (let i = 1; i <= 12; i++) channels[`1:${i}`] = 128;
  }
  const keys = Object.keys(channels);
  
  if (p.includes('warm') || p.includes('sunset') || p.includes('cozy')) {
    keys.forEach((key, idx) => {
      const mod = idx % 3;
      if (mod === 0) channels[key] = 255;
      else if (mod === 1) channels[key] = 150;
      else channels[key] = 80;
    });
    message = '🌅 Warm sunset vibes!';
  } else if (p.includes('cool') || p.includes('blue') || p.includes('ice')) {
    keys.forEach((key, idx) => {
      const mod = idx % 3;
      if (mod === 0) channels[key] = 80;
      else if (mod === 1) channels[key] = 150;
      else channels[key] = 255;
    });
    message = '❄️ Cool blue!';
  } else if (p.includes('red') || p.includes('fire')) {
    keys.forEach((key, idx) => { channels[key] = idx % 3 === 0 ? 255 : 0; });
    message = '🔥 Red hot!';
  } else if (p.includes('green') || p.includes('forest')) {
    keys.forEach((key, idx) => { channels[key] = idx % 3 === 1 ? 255 : 30; });
    message = '🌲 Forest green!';
  } else if (p.includes('purple') || p.includes('party')) {
    keys.forEach((key, idx) => {
      const mod = idx % 3;
      channels[key] = mod === 0 ? 180 : mod === 1 ? 0 : 255;
    });
    message = '🎉 Party purple!';
  } else if (p.includes('white') || p.includes('bright') || p.includes('full')) {
    keys.forEach(key => channels[key] = 255);
    message = '💡 Full bright!';
  } else if (p.includes('dim') || p.includes('low')) {
    keys.forEach(key => channels[key] = Math.round((channels[key] || 128) * 0.5));
    message = '🔅 Dimmed!';
  } else if (p.includes('off') || p.includes('black')) {
    keys.forEach(key => channels[key] = 0);
    message = '🌑 Blacked out!';
  } else if (p.includes('half') || p.includes('50')) {
    keys.forEach(key => channels[key] = 128);
    message = '⚡ 50%!';
  } else {
    const pctMatch = p.match(/(\d+)\s*%/);
    if (pctMatch) {
      const val = Math.round(parseInt(pctMatch[1]) * 2.55);
      keys.forEach(key => channels[key] = val);
      message = `✨ Set to ${pctMatch[1]}%!`;
    } else {
      message = "💡 Try: 'warm', 'cool', 'party', '50%'";
    }
  }
  return { channels, message };
};

const suggestSceneName = (channels) => {
  const values = Object.values(channels);
  if (values.length === 0) return '';
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg < 50) return 'Dim Mood';
  if (avg > 220) return 'Full Bright';
  return 'Custom Scene';
};

const PRESETS = [
  { name: 'Warm', icon: '🌅', cmd: 'warm' },
  { name: 'Cool', icon: '❄️', cmd: 'cool' },
  { name: 'Party', icon: '🎉', cmd: 'party' },
  { name: 'Dim', icon: '🌙', cmd: 'dim' },
  { name: 'Bright', icon: '☀️', cmd: 'full' },
  { name: 'Red', icon: '🔥', cmd: 'red' },
];

// Scene Card
function SceneCard({ scene, isActive, onPlay, onStop, onEdit, onDelete }) {
  return (
    <div className={`bg-white/5 rounded-xl p-3 flex flex-col transition-all ${isActive ? 'ring-2 ring-[var(--theme-primary)] bg-[var(--theme-primary)]/10' : 'hover:bg-white/10'}`}>
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => isActive ? onStop() : onPlay()}
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isActive ? 'bg-[var(--theme-primary)] text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          {isActive ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm truncate">{scene.name}</h3>
          <p className="text-[10px] text-white/40">{Object.keys(scene.channels || {}).length} ch</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(scene)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium flex items-center justify-center gap-1">
          <Edit3 size={12} /> Edit
        </button>
        <button onClick={() => onDelete(scene)} className="py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/60">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// Scene Creator Modal
function SceneCreatorModal({ scene, isOpen, onClose, onSave }) {
  const { universes, setChannels: sendDMX, fetchUniverseState } = useDMXStore();
  
  const [name, setName] = useState('');
  const [channels, setChannels] = useState({});
  const [fadeTime, setFadeTime] = useState(1000);
  const [intensity, setIntensity] = useState(100);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [baseChannels, setBaseChannels] = useState({});
  const [showFaders, setShowFaders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(scene?.name || '');
      setChannels(scene?.channels || {});
      setBaseChannels(scene?.channels || {});
      setFadeTime(scene?.fade_time || 1000);
      setAiMessage('');
      setAiPrompt('');
      const vals = Object.values(scene?.channels || {});
      setIntensity(vals.length > 0 ? Math.round((Math.max(...vals) / 255) * 100) : 100);
    }
  }, [scene, isOpen]);

  const sendPreview = (newChannels) => {
    const byUniverse = {};
    Object.entries(newChannels).forEach(([key, value]) => {
      const [u, ch] = key.includes(':') ? key.split(':').map(Number) : [1, parseInt(key)];
      if (!byUniverse[u]) byUniverse[u] = {};
      byUniverse[u][ch] = value;
    });
    Object.entries(byUniverse).forEach(([universe, chs]) => {
      sendDMX(parseInt(universe), chs, 100);
    });
  };

  const handleCapture = async () => {
    setAiLoading(true);
    try {
      await fetchUniverseState(1);
      const currentState = universes[1] || [];
      const captured = {};
      currentState.forEach((value, idx) => {
        if (value > 0) captured[`1:${idx + 1}`] = value;
      });
      if (Object.keys(captured).length === 0) {
        for (let i = 1; i <= 12; i++) captured[`1:${i}`] = 200;
      }
      setChannels(captured);
      setBaseChannels(captured);
      setIntensity(100);
      if (!name) setName(suggestSceneName(captured));
      setAiMessage('📸 Captured!');
    } catch (err) {
      setAiMessage('❌ Capture failed');
    }
    setAiLoading(false);
  };

  const handleAiCommand = (cmd = aiPrompt) => {
    if (!cmd.trim()) return;
    setAiLoading(true);
    const result = processAICommand(cmd, channels);
    setChannels(result.channels);
    setBaseChannels(result.channels);
    sendPreview(result.channels);
    setAiMessage(result.message);
    setAiPrompt('');
    if (!name) setName(suggestSceneName(result.channels));
    const vals = Object.values(result.channels);
    setIntensity(vals.length > 0 ? Math.round((Math.max(...vals) / 255) * 100) : 100);
    setAiLoading(false);
  };

  const handleIntensityChange = (newIntensity) => {
    setIntensity(newIntensity);
    if (Object.keys(baseChannels).length === 0) return;
    const scale = newIntensity / 100;
    const scaled = {};
    Object.entries(baseChannels).forEach(([key, value]) => {
      scaled[key] = Math.round(value * scale);
    });
    setChannels(scaled);
    sendPreview(scaled);
  };

  const handleFaderApply = (faderChannels) => {
    setChannels(faderChannels);
    setBaseChannels(faderChannels);
    sendPreview(faderChannels);
    if (!name) setName(suggestSceneName(faderChannels));
    setAiMessage('✅ Faders applied!');
  };

  const handleSave = () => {
    if (!name.trim()) { setAiMessage('⚠️ Enter a name'); return; }
    if (Object.keys(channels).length === 0) { setAiMessage('⚠️ No channels set'); return; }
    onSave({ ...scene, name: name.trim(), channels, fade_time: fadeTime, channel_count: Object.keys(channels).length });
  };

  if (!isOpen) return null;

  return (
    <div className="screen-overlay open">
      <div className="screen-glow" />
      <div className="screen-header">
        <button className="back-btn" onClick={onClose}><ArrowLeft className="w-5 h-5" /></button>
        <div className="screen-title">{scene?.scene_id ? 'Edit Scene' : 'New Scene'}</div>
        <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-[var(--theme-primary)] text-black font-bold text-sm flex items-center gap-1">
          <Save size={16} /> Save
        </button>
      </div>

      <div className="screen-content" style={{ padding: '12px' }}>
        {/* Name Input */}
        <div className="glass-card p-3 mb-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Scene name..."
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold placeholder:text-white/30 outline-none focus:border-[var(--theme-primary)]"
          />
        </div>

        {/* AI Bar + Capture + Faders */}
        <div className="glass-card p-3 mb-3">
          <div className="flex gap-2 mb-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              {aiLoading ? <Loader size={16} className="text-[var(--theme-primary)] animate-spin" /> : <MessageSquare size={16} className="text-[var(--theme-primary)]" />}
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
                placeholder="'warm' 'party' '50%'..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
              />
            </div>
            <button onClick={handleCapture} className="px-3 py-2 rounded-xl bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] font-bold">
              <Camera size={18} />
            </button>
            <button onClick={() => setShowFaders(true)} className="px-3 py-2 rounded-xl bg-white/10 text-white/70 font-bold">
              <Sliders size={18} />
            </button>
          </div>
          
          {/* Presets */}
          <div className="grid grid-cols-6 gap-1.5">
            {PRESETS.map(p => (
              <button key={p.name} onClick={() => handleAiCommand(p.cmd)} className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-center">
                <span className="text-base block">{p.icon}</span>
                <span className="text-[9px] text-white/50">{p.name}</span>
              </button>
            ))}
          </div>
          
          {aiMessage && <div className="mt-2 px-2 py-1.5 rounded-lg bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] text-xs">{aiMessage}</div>}
        </div>

        {/* Intensity */}
        <div className="glass-card p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50 uppercase">Intensity</span>
            <span className="text-xl font-bold text-white">{intensity}%</span>
          </div>
          <input
            type="range" min="0" max="100" value={intensity}
            onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-white/10 accent-[var(--theme-primary)]"
          />
          <div className="flex justify-between mt-2">
            {[0, 25, 50, 75, 100].map(v => (
              <button key={v} onClick={() => handleIntensityChange(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${intensity === v ? 'bg-[var(--theme-primary)] text-black' : 'bg-white/5 text-white/40'}`}>
                {v}%
              </button>
            ))}
          </div>
        </div>

        {/* Fade Time */}
        <div className="glass-card p-3 mb-3">
          <span className="text-xs text-white/50 uppercase block mb-2">Fade Time</span>
          <div className="flex gap-1.5">
            {[0, 500, 1000, 2000, 3000].map(ms => (
              <button key={ms} onClick={() => setFadeTime(ms)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold ${fadeTime === ms ? 'bg-[var(--theme-primary)] text-black' : 'bg-white/5 text-white/40'}`}>
                {ms === 0 ? 'Snap' : ms < 1000 ? `${ms}ms` : `${ms/1000}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Channel Preview */}
        <div className="glass-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50 uppercase">Channels ({Object.keys(channels).length})</span>
            <button onClick={() => setShowFaders(true)} className="text-xs text-[var(--theme-primary)] font-bold">Edit Faders</button>
          </div>
          {Object.keys(channels).length === 0 ? (
            <div className="text-center py-4 text-white/30 text-sm">No channels yet - use Capture or Faders</div>
          ) : (
            <div className="grid grid-cols-12 gap-0.5">
              {Object.entries(channels).slice(0, 24).map(([key, val]) => {
                const ch = key.includes(':') ? key.split(':')[1] : key;
                return (
                  <div key={key} className="aspect-square rounded bg-white/5 flex items-center justify-center"
                    style={{ background: `linear-gradient(to top, var(--theme-primary) ${Math.round(val/255*100)}%, rgba(255,255,255,0.05) ${Math.round(val/255*100)}%)` }}>
                    <span className="text-[7px] text-white/70">{ch}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fader Modal */}
      <FaderModal availableUniverses={[1, 2, 3]} 
        isOpen={showFaders}
        onClose={() => setShowFaders(false)}
        onApply={handleFaderApply}
        initialChannels={channels}
        universe={1}
      />
    </div>
  );
}

// Main Scenes Component
export default function Scenes() {
  const { scenes, currentScene, fetchScenes, playScene, stopScene, createScene, updateScene, deleteScene } = useSceneStore();
  const [editingScene, setEditingScene] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const SCENES_PER_PAGE = 8;
  const totalPages = Math.ceil(scenes.length / SCENES_PER_PAGE);
  const paginatedScenes = scenes.slice(currentPage * SCENES_PER_PAGE, (currentPage + 1) * SCENES_PER_PAGE);

  useEffect(() => { fetchScenes(); }, [fetchScenes]);

  const handleEdit = (scene) => { setEditingScene(scene); setIsCreating(true); };
  const handleCreate = () => { setEditingScene({ name: '', channels: {}, fade_time: 1000 }); setIsCreating(true); };

  const handleSave = async (sceneData) => {
    try {
      if (sceneData.scene_id) await updateScene(sceneData.scene_id, sceneData);
      else await createScene(sceneData);
      setIsCreating(false);
      setEditingScene(null);
      fetchScenes();
    } catch (err) { console.error('Save failed:', err); }
  };

  const handleDelete = async (scene) => {
    if (confirm(`Delete "${scene.name}"?`)) {
      await deleteScene(scene.scene_id || scene.id);
      fetchScenes();
    }
  };

  return (
    <div className="h-full flex flex-col p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-white">Scenes</h1>
          <p className="text-[10px] text-white/50">{scenes.length} saved</p>
        </div>
        <button onClick={handleCreate} className="px-3 py-2 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-1 text-sm">
          <Plus size={16} /> New
        </button>
      </div>

      {/* Scene Grid */}
      {scenes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Sparkles size={40} className="text-white/20 mb-2" />
          <p className="text-white/40 text-sm mb-3">No scenes yet</p>
          <button onClick={handleCreate} className="px-4 py-2 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-1">
            <Plus size={16} /> Create Scene
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 flex-1 overflow-hidden">
            {paginatedScenes.map(scene => (
              <SceneCard
                key={scene.scene_id || scene.id}
                scene={scene}
                isActive={currentScene?.scene_id === (scene.scene_id || scene.id)}
                onPlay={() => playScene(scene.scene_id || scene.id)}
                onStop={stopScene}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold ${
                      currentPage === i ? 'bg-[var(--theme-primary)] text-black' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Scene Creator Modal */}
      <SceneCreatorModal
        scene={editingScene}
        isOpen={isCreating}
        onClose={() => { setIsCreating(false); setEditingScene(null); }}
        onSave={handleSave}
      />
    </div>
  );
}

export const ScenesHeaderExtension = () => null;
