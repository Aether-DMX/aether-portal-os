import React, { useState, useEffect } from 'react';
const getApiUrl = () => `http://${window.location.hostname}:8891`;

export default function BootLoader({ onReady }) {
  const [status, setStatus] = useState('Initializing...');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);

    const checkBackend = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/health`, { timeout: 2000 });
        if (res.ok) { setStatus('Ready'); setTimeout(onReady, 300); return true; }
      } catch (e) {}
      return false;
    };

    const poll = async () => {
      setStatus('Connecting to AETHER Core');
      while (!(await checkBackend())) await new Promise(r => setTimeout(r, 1500));
    };
    poll();
    return () => clearInterval(dotInterval);
  }, [onReady]);

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:99999,background:'#0a0a0f',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'
    }}>
      <div style={{
        width:120,height:120,background:'var(--theme-primary,#00d4ff)',
        mask:"url('/aether_logo.png') center/contain no-repeat",
        WebkitMask:"url('/aether_logo.png') center/contain no-repeat",
        animation:'bootPulse 2s ease-in-out infinite'
      }} />
      <div style={{marginTop:24,color:'rgba(255,255,255,0.5)',fontSize:14}}>
        {status}{dots}
      </div>
      <style>{`@keyframes bootPulse {0%,100%{opacity:0.6;transform:scale(1);}50%{opacity:1;transform:scale(1.05);}}`}</style>
    </div>
  );
}
