import React, { useEffect, useState } from 'react';
import { Square, Sun, Moon } from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import usePlaybackStore from '../store/playbackStore';
import useDMXStore from '../store/dmxStore';

export default function MobileLive() {
  const { scenes, fetchScenes, playScene } = useSceneStore();
  const { chases, fetchChases, playChase } = useChaseStore();
  const { playback, syncStatus, stopAll } = usePlaybackStore();
  const { blackoutAll } = useDMXStore();
  const [master, setMaster] = useState(100);
  const backendUrl = 'http://' + window.location.hostname + ':8891';

  useEffect(() => {
    fetchScenes(); fetchChases(); syncStatus();
    const i = setInterval(syncStatus, 2000);
    return () => clearInterval(i);
  }, []);

  const handleMaster = async (v) => {
    setMaster(v);
    try { await fetch(backendUrl + '/api/master', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: v }) }); } catch(e) {}
  };

  const cur = Object.values(playback)[0];
  const qs = scenes.slice(0, 6);
  const qc = chases.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      {/* Now Playing + Stop */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>NOW PLAYING</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>
            {cur ? cur.id.replace('scene_','').replace('chase_','').replace(/_/g,' ') : 'Nothing'}
          </div>
        </div>
        <button onClick={stopAll} style={{ width: 38, height: 38, borderRadius: 19, background: 'rgba(239,68,68,0.2)', border: 'none' }}>
          <Square size={16} color="#ef4444" />
        </button>
      </div>

      {/* Master + Controls */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="range" min="0" max="100" value={master} onChange={e => handleMaster(+e.target.value)} style={{ flex: 1, accentColor: '#a855f7' }} />
        <span style={{ fontSize: 10, color: '#fff', width: 30 }}>{master}%</span>
        <button onClick={() => handleMaster(0)} style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.1)', border: 'none' }}><Moon size={14} color="#fff" /></button>
        <button onClick={blackoutAll} style={{ padding: '0 10px', height: 32, borderRadius: 6, background: 'rgba(239,68,68,0.2)', border: 'none', color: '#ef4444', fontSize: 9, fontWeight: 700 }}>OFF</button>
      </div>

      {/* Scenes */}
      <div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>SCENES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {qs.map(s => (
            <button key={s.id} onClick={() => playScene(s.id, 1)} style={{ padding: 10, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 10, textTransform: 'capitalize' }}>
              {s.name.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Chases */}
      <div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>CHASES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {qc.map(c => (
            <button key={c.id} onClick={() => playChase(c.id, 1)} style={{ padding: 10, borderRadius: 6, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#fff', fontSize: 10, textTransform: 'capitalize' }}>
              {c.name.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
