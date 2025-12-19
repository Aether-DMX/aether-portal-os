import React, { useState, useEffect } from 'react';
import { Play, Plus, X, Trash2 } from 'lucide-react';
import useChaseStore from '../store/chaseStore';
import useSceneStore from '../store/sceneStore';

export default function MobileChases() {
  const { chases, fetchChases, playChase, saveChase, deleteChase } = useChaseStore();
  const { scenes, fetchScenes } = useSceneStore();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [bpm, setBpm] = useState(120);
  const [selectedScenes, setSelectedScenes] = useState([]);

  useEffect(() => { fetchChases(); fetchScenes(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || selectedScenes.length < 2) return;
    const steps = selectedScenes.map(id => ({ scene_id: id, duration: Math.round(60000/bpm) }));
    await saveChase({ name: name.replace(/\s+/g,'_').toLowerCase(), steps, bpm });
    setCreating(false); setName(''); setSelectedScenes([]); fetchChases();
  };

  const toggleScene = (id) => {
    setSelectedScenes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (creating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>New Chase</span>
          <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none' }}><X size={20} color="#fff" /></button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Chase name" 
          style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>BPM</span>
          <input type="range" min="30" max="240" value={bpm} onChange={e => setBpm(+e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#fff' }}>{bpm}</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Select scenes (min 2):</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {scenes.map(s => (
            <button key={s.id} onClick={() => toggleScene(s.id)} 
              style={{ padding: 8, borderRadius: 6, background: selectedScenes.includes(s.id) ? '#a855f7' : 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 10, textTransform: 'capitalize' }}>
              {s.name.replace(/_/g,' ')}
            </button>
          ))}
        </div>
        <button onClick={handleCreate} style={{ padding: 10, borderRadius: 8, background: '#a855f7', border: 'none', color: '#fff', fontWeight: 600 }}>Create Chase</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Chases</span>
        <button onClick={() => setCreating(true)} style={{ padding: '6px 12px', borderRadius: 6, background: '#a855f7', border: 'none', color: '#fff', fontSize: 11 }}>
          <Plus size={14} /> New
        </button>
      </div>
      {chases.map(c => (
        <div key={c.id} style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 13, color: '#fff', textTransform: 'capitalize' }}>{c.name.replace(/_/g,' ')}</span>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{c.steps?.length || 0} steps</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => playChase(c.id, 1)} style={{ width: 32, height: 32, borderRadius: 16, background: '#a855f7', border: 'none' }}><Play size={14} color="#fff" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
