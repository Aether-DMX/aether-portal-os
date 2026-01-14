import React, { useState, useEffect } from 'react';
import { Play, Plus, X } from 'lucide-react';
import useChaseStore from '../store/chaseStore';
import useSceneStore from '../store/sceneStore';

export default function MobileChases() {
  const { chases, fetchChases, playChase, saveChase } = useChaseStore();
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
      <div className="mobile-form">
        <div className="mobile-form-header">
          <span className="mobile-form-title">New Chase</span>
          <button onClick={() => setCreating(false)} className="mobile-form-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Chase name"
          autoFocus
        />
        <div className="mobile-form-row">
          <span className="mobile-form-label">BPM</span>
          <input
            type="range"
            min="30"
            max="240"
            value={bpm}
            onChange={e => setBpm(+e.target.value)}
          />
          <span className="mobile-master-value">{bpm}</span>
        </div>
        <div className="section-title" style={{ marginTop: 8 }}>Select scenes (min 2):</div>
        <div className="grid-2">
          {scenes.map(s => (
            <button
              key={s.id}
              onClick={() => toggleScene(s.id)}
              className={`mobile-grid-item ${selectedScenes.includes(s.id) ? 'chase' : ''}`}
              style={selectedScenes.includes(s.id) ? { background: 'var(--accent, #a855f7)' } : {}}
            >
              {s.name.replace(/_/g,' ')}
            </button>
          ))}
        </div>
        <button
          onClick={handleCreate}
          className="mobile-form-submit"
          disabled={selectedScenes.length < 2}
        >
          Create Chase
        </button>
      </div>
    );
  }

  return (
    <div className="mobile-chases">
      <div className="mobile-section-header">
        <span className="mobile-section-title">Chases</span>
        <button onClick={() => setCreating(true)} className="mobile-add-btn">
          <Plus size={14} /> New
        </button>
      </div>

      {chases.length === 0 ? (
        <div className="mobile-empty">
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 16px' }}>
            No chases yet. Tap "New" to create one.
          </p>
        </div>
      ) : (
        chases.map(c => (
          <div key={c.id} className="mobile-list-item chase" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <div>
              <span className="mobile-list-item-name">{c.name.replace(/_/g,' ')}</span>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {c.steps?.length || 0} steps • {c.bpm || 120} BPM
              </div>
            </div>
            <div className="mobile-list-item-actions">
              <button
                onClick={() => playChase(c.id, 1)}
                className="mobile-action-btn"
                style={{ background: 'var(--accent, #a855f7)' }}
                aria-label={`Play ${c.name}`}
              >
                <Play size={16} color="#fff" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
