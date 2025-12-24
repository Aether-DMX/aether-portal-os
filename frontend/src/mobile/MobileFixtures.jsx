import React, { useState, useEffect } from 'react';

export default function MobileFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [groups, setGroups] = useState([]);
  const backendUrl = `http://${window.location.hostname}:8891`;

  useEffect(() => {
    fetch(backendUrl + '/api/fixtures').then(r => r.json()).then(setFixtures).catch(console.error);
    fetch(backendUrl + '/api/groups').then(r => r.json()).then(setGroups).catch(console.error);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Fixtures</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{fixtures.length} fixtures, {groups.length} groups</div>

      {groups.map(g => (
        <div key={g.id} style={{ background: 'rgba(168,85,247,0.1)', borderRadius: 8, padding: 12, borderLeft: '3px solid #a855f7' }}>
          <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{g.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Group</div>
        </div>
      ))}

      {fixtures.map(f => (
        <div key={f.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 14, color: '#fff' }}>{f.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Ch {f.start_channel} • {f.type}</div>
        </div>
      ))}
    </div>
  );
}
