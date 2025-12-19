import React, { useState, useEffect } from 'react';
import { Play, Plus, X, Trash2 } from 'lucide-react';
import useSceneStore from '../store/sceneStore';

export default function MobileScenes() {
  const { scenes, fetchScenes, playScene, saveScene, deleteScene } = useSceneStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ff6b6b');
  const [brightness, setBrightness] = useState(100);

  useEffect(() => { fetchScenes(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const hex = color.replace('#','');
    const r = parseInt(hex.substr(0,2),16), g = parseInt(hex.substr(2,2),16), b = parseInt(hex.substr(4,2),16);
    const ch = { 1: Math.round(r*brightness/100), 2: Math.round(g*brightness/100), 3: Math.round(b*brightness/100) };
    await saveScene({ name: name.replace(/\s+/g,'_').toLowerCase(), channels: ch });
    setCreating(false); setName(''); fetchScenes();
  };

  if (creating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>New Scene</span>
          <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none' }}><X size={20} color="#fff" /></button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Scene name" 
          style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Color</span>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 50, height: 32, border: 'none', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Brightness</span>
          <input type="range" min="0" max="100" value={brightness} onChange={e => setBrightness(+e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#fff' }}>{brightness}%</span>
        </div>
        <button onClick={handleCreate} style={{ padding: 12, borderRadius: 8, background: '#a855f7', border: 'none', color: '#fff', fontWeight: 600 }}>Create Scene</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Scenes</span>
        <button onClick={() => setCreating(true)} style={{ padding: '6px 12px', borderRadius: 6, background: '#a855f7', border: 'none', color: '#fff', fontSize: 11 }}>
          <Plus size={14} /> New
        </button>
      </div>
      {scenes.map(s => (
        <div key={s.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#fff', textTransform: 'capitalize' }}>{s.name.replace(/_/g,' ')}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => playScene(s.id, 1)} style={{ width: 32, height: 32, borderRadius: 16, background: '#22c55e', border: 'none' }}><Play size={14} color="#fff" /></button>
            <button onClick={() => { deleteScene(s.id); fetchScenes(); }} style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(239,68,68,0.2)', border: 'none' }}><Trash2 size={14} color="#ef4444" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
