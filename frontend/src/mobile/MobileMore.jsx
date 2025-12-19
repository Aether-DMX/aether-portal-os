import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Radio, Users } from 'lucide-react';

export default function MobileMore() {
  const navigate = useNavigate();
  const btn = { display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: 'none', width: '100%' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>More</span>
      <button onClick={() => navigate('/mobile/schedules')} style={btn}><Calendar size={20} color="#a855f7" /><span style={{ color: '#fff' }}>Schedules</span></button>
      <button onClick={() => navigate('/mobile/nodes')} style={btn}><Radio size={20} color="#a855f7" /><span style={{ color: '#fff' }}>Nodes</span></button>
    </div>
  );
}
