import React, { useEffect, useState } from 'react';
import { Square, Moon } from 'lucide-react';
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
    try {
      await fetch(backendUrl + '/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: v })
      });
    } catch(e) { /* ignore */ }
  };

  const cur = Object.values(playback)[0];
  const qs = scenes.slice(0, 6);
  const qc = chases.slice(0, 4);

  return (
    <div className="mobile-live">
      {/* Now Playing + Stop */}
      <div className="mobile-now-playing">
        <div className="mobile-now-playing-info">
          <span className="mobile-now-playing-label">NOW PLAYING</span>
          <span className="mobile-now-playing-title">
            {cur ? cur.id.replace('scene_','').replace('chase_','').replace(/_/g,' ') : 'Nothing'}
          </span>
        </div>
        <button onClick={stopAll} className="mobile-stop-btn" aria-label="Stop all">
          <Square size={18} color="#ef4444" />
        </button>
      </div>

      {/* Master + Controls */}
      <div className="mobile-master-row">
        <input
          type="range"
          min="0"
          max="100"
          value={master}
          onChange={e => handleMaster(+e.target.value)}
          aria-label="Master fader"
        />
        <span className="mobile-master-value">{master}%</span>
        <button onClick={() => handleMaster(0)} className="mobile-master-btn" aria-label="Dim to zero">
          <Moon size={16} />
        </button>
        <button onClick={blackoutAll} className="mobile-blackout-btn">
          OFF
        </button>
      </div>

      {/* Scenes */}
      <div className="mobile-section">
        <div className="section-title">SCENES</div>
        <div className="grid-3">
          {qs.map(s => (
            <button
              key={s.id}
              onClick={() => playScene(s.id, 1)}
              className="mobile-grid-item"
            >
              {s.name.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Chases */}
      <div className="mobile-section">
        <div className="section-title">CHASES</div>
        <div className="grid-2">
          {qc.map(c => (
            <button
              key={c.id}
              onClick={() => playChase(c.id, 1)}
              className="mobile-grid-item chase"
            >
              {c.name.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
