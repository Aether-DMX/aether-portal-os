import React, { useState, useEffect } from 'react';
import { Plus, X, Clock } from 'lucide-react';

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
      <div className="mobile-form">
        <div className="mobile-form-header">
          <span className="mobile-form-title">New Schedule</span>
          <button onClick={() => setCreating(false)} className="mobile-form-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Schedule name"
          autoFocus
        />
        <div className="mobile-form-row">
          <span className="mobile-form-label">Time</span>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 16
            }}
          />
        </div>
        <button onClick={handleCreate} className="mobile-form-submit">
          Create Schedule
        </button>
      </div>
    );
  }

  return (
    <div className="mobile-schedules">
      <div className="mobile-section-header">
        <span className="mobile-section-title">Schedules</span>
        <button onClick={() => setCreating(true)} className="mobile-add-btn">
          <Plus size={14} /> New
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="mobile-empty">
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 16px' }}>
            No schedules yet. Tap "New" to create one.
          </p>
        </div>
      ) : (
        schedules.map(s => (
          <div key={s.id} className="mobile-list-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={18} color="var(--accent, #a855f7)" />
              <div>
                <span className="mobile-list-item-name">{s.name}</span>
                {s.action && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {s.action}
                  </div>
                )}
              </div>
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.1)'
            }}>
              {s.time}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
