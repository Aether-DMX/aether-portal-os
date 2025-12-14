import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Play, X, RefreshCw } from 'lucide-react';

const API = `http://${window.location.hostname}:8891`;

export default function ResumeSessionModal() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch(`${API}/api/session/resume`);
      const data = await res.json();
      if (data.has_session && data.playback) {
        setSession(data.playback);
      }
    } catch (err) {
      console.error('Failed to check session:', err);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      await fetch(`${API}/api/session/resume`, { method: 'POST' });
      setSession(null);
    } catch (err) {
      console.error('Failed to resume:', err);
    }
    setLoading(false);
  };

  const handleDismiss = async () => {
    try {
      await fetch(`${API}/api/session/dismiss`, { method: 'POST' });
      setSession(null);
    } catch (err) {
      console.error('Failed to dismiss:', err);
    }
  };

  if (!session) return null;

  const typeLabel = session.type === 'scene' ? 'Scene' : 'Chase';
  const typeEmoji = session.type === 'scene' ? '🎭' : '⚡';

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: '#1a1a2e',
        border: '1px solid rgba(139,92,246,0.4)',
        borderRadius: 16,
        padding: 24,
        maxWidth: 320,
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{typeEmoji}</div>
        <h2 style={{ color: 'white', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Resume Previous Session?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20 }}>
          {typeLabel} "<strong style={{ color: 'white' }}>{session.name || session.id}</strong>" was running on Universe {session.universe}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleDismiss}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10,
              color: 'white',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <X size={16} /> Start Fresh
          </button>
          <button
            onClick={handleResume}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 0',
              background: '#8b5cf6',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
            Resume
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
