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
      <div className="mobile-form">
        <div className="mobile-form-header">
          <span className="mobile-form-title">New Scene</span>
          <button onClick={() => setCreating(false)} className="mobile-form-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Scene name"
          autoFocus
        />
        <div className="mobile-form-row">
          <span className="mobile-form-label">Color</span>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} />
        </div>
        <div className="mobile-form-row">
          <span className="mobile-form-label">Brightness</span>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={e => setBrightness(+e.target.value)}
          />
          <span className="mobile-master-value">{brightness}%</span>
        </div>
        <button onClick={handleCreate} className="mobile-form-submit">
          Create Scene
        </button>
      </div>
    );
  }

  return (
    <div className="mobile-scenes">
      <div className="mobile-section-header">
        <span className="mobile-section-title">Scenes</span>
        <button onClick={() => setCreating(true)} className="mobile-add-btn">
          <Plus size={14} /> New
        </button>
      </div>

      {scenes.length === 0 ? (
        <div className="mobile-empty">
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 16px' }}>
            No scenes yet. Tap "New" to create one.
          </p>
        </div>
      ) : (
        scenes.map(s => (
          <div key={s.id} className="mobile-list-item">
            <span className="mobile-list-item-name">{s.name.replace(/_/g,' ')}</span>
            <div className="mobile-list-item-actions">
              <button
                onClick={() => playScene(s.id, 1)}
                className="mobile-action-btn play"
                aria-label={`Play ${s.name}`}
              >
                <Play size={16} color="#fff" />
              </button>
              <button
                onClick={() => { deleteScene(s.id); fetchScenes(); }}
                className="mobile-action-btn delete"
                aria-label={`Delete ${s.name}`}
              >
                <Trash2 size={16} color="#ef4444" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
