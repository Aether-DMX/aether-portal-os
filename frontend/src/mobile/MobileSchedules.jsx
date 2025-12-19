import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Clock } from 'lucide-react';

export default function MobileSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [time, setTime] = useState('07:00');
  const [action, setAction] = useState('');
  const backendUrl = 'http://' + window.location.hostname + ':8891';

  const fetchSchedules = () => fetch(backendUrl + '/api/schedules').then(r => r.json()).then(setSchedules).catch(console.error);
  useEffect(() => { fetchSchedules(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await fetch(backendUrl + '/api/schedules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, time, action, enabled: true })
    });
    setCreating(false); setName(''); fetchSchedules();
  };

  if (creating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>New Schedule</span>
          <button onClick={() => setCreating(false)} style={{ background: 'none', border: 'none' }}><X size={20} color="#fff" /></button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" 
          style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }} />
        <input type="time" value={time} onChange={e => setTime(e.target.value)} 
          style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }} />
        <button onClick={handleCreate} style={{ padding: 10, borderRadius: 8, background: '#a855f7', border: 'none', color: '#fff' }}>Create</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Schedules</span>
        <button onClick={() => setCreating(true)} style={{ padding: '6px 12px', borderRadius: 6, background: '#a855f7', border: 'none', color: '#fff', fontSize: 11 }}>
          <Plus size={14} /> New
        </button>
      </div>
      {schedules.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', padding: 20 }}>No schedules yet</div>}
      {schedules.map(s => (
        <div key={s.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="#a855f7" />
            <span style={{ fontSize: 13, color: '#fff' }}>{s.name}</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.time}</span>
        </div>
      ))}
    </div>
  );
}
