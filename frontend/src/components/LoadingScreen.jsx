import React, { useState, useEffect } from 'react';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

export default function LoadingScreen({ onReady }) {
  const [status, setStatus] = useState('Connecting...');
  const [attempts, setAttempts] = useState(0);
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);
  
  useEffect(() => {
    let cancelled = false;
    const checkBackend = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok && !cancelled) {
          setStatus('Ready!');
          setTimeout(() => onReady?.(), 500);
        }
      } catch (err) {
        if (!cancelled) {
          setAttempts(a => a + 1);
          setStatus('Waiting for Aether Core');
          setTimeout(checkBackend, 2000);
        }
      }
    };
    checkBackend();
    return () => { cancelled = true; };
  }, [onReady]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#030305',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 10000,
    }}>
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, #00ffaa 0%, transparent 70%)',
        opacity: 0.15, filter: 'blur(40px)',
      }} />
      <div style={{
        width: 120, height: 120, marginBottom: 24,
        background: 'linear-gradient(145deg, #e8e8e8, #a0a0a0)',
        maskImage: 'url(/aether_logo.png)',
        WebkitMaskImage: 'url(/aether_logo.png)',
        maskSize: 'contain', WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat', maskPosition: 'center',
      }} />
      <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>
        {status}{dots}
      </div>
      {attempts > 3 && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Attempt {attempts}
        </div>
      )}
    </div>
  );
}
