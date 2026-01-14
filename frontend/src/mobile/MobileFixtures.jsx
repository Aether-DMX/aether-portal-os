import React, { useState, useEffect } from 'react';
import { Lightbulb, FolderOpen } from 'lucide-react';

export default function MobileFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [groups, setGroups] = useState([]);
  const backendUrl = `http://${window.location.hostname}:8891`;

  useEffect(() => {
    fetch(backendUrl + '/api/fixtures').then(r => r.json()).then(setFixtures).catch(console.error);
    fetch(backendUrl + '/api/groups').then(r => r.json()).then(setGroups).catch(console.error);
  }, []);

  return (
    <div className="mobile-fixtures">
      <div className="mobile-section-header">
        <span className="mobile-section-title">Fixtures</span>
      </div>

      <div className="mobile-stats" style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        padding: '12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 10
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{fixtures.length}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Fixtures</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent, #a855f7)' }}>{groups.length}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Groups</div>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="mobile-section" style={{ marginBottom: 16 }}>
          <div className="section-title">GROUPS</div>
          {groups.map(g => (
            <div key={g.id} className="mobile-list-item" style={{ borderLeft: '3px solid var(--accent, #a855f7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FolderOpen size={18} color="var(--accent, #a855f7)" />
                <span className="mobile-list-item-name">{g.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mobile-section">
        <div className="section-title">FIXTURES</div>
        {fixtures.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '32px 16px' }}>
            No fixtures patched yet.
          </p>
        ) : (
          fixtures.map(f => (
            <div key={f.id} className="mobile-list-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Lightbulb size={18} color="rgba(255,255,255,0.5)" />
                <div>
                  <span className="mobile-list-item-name">{f.name}</span>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    Ch {f.start_channel} • {f.type}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
