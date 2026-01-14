import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Radio, Timer, Info, ChevronRight } from 'lucide-react';

export default function MobileMore() {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Calendar, label: 'Schedules', path: '/schedules', description: 'Automated lighting schedules' },
    { icon: Radio, label: 'Nodes', path: '/nodes', description: 'PULSE node management' },
    { icon: Timer, label: 'Timers', path: '/schedules', description: 'Countdown & interval timers' },
  ];

  return (
    <div className="mobile-more">
      <div className="mobile-section-header">
        <span className="mobile-section-title">More</span>
      </div>

      <div className="mobile-menu-list">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.path)}
            className="mobile-menu-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              padding: '16px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: 12,
              marginBottom: 10,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(168,85,247,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <item.icon size={22} color="var(--accent, #a855f7)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{item.description}</div>
            </div>
            <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 24,
        padding: 16,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <Info size={18} color="rgba(255,255,255,0.4)" />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          AETHER DMX Mobile Interface
        </div>
      </div>
    </div>
  );
}
