import React, { useEffect } from 'react';
const getApiUrl = () => `http://${window.location.hostname}:8891`;

export default function BootLoader({ onReady }) {
  console.log('[BOOT] BootLoader component mounted');

  useEffect(() => {
    console.log('[BOOT] BootLoader useEffect starting');

    const checkBackend = async () => {
      const url = `${getApiUrl()}/api/health`;
      console.log('[BOOT] Checking backend at:', url);
      try {
        const res = await fetch(url, { timeout: 2000 });
        console.log('[BOOT] Backend response status:', res.status);
        if (res.ok) {
          console.log('[BOOT] Backend ready! Calling onReady...');
          onReady();
          return true;
        }
      } catch (e) {
        console.log('[BOOT] Backend check failed:', e.message);
      }
      return false;
    };

    const poll = async () => {
      console.log('[BOOT] Starting backend poll loop');
      let attempts = 0;
      while (!(await checkBackend())) {
        attempts++;
        console.log('[BOOT] Backend not ready, attempt:', attempts);
        await new Promise(r => setTimeout(r, 500));
      }
      console.log('[BOOT] Poll loop ended after', attempts, 'attempts');
    };
    poll();
  }, [onReady]);

  console.log('[BOOT] BootLoader rendering black div');
  // Minimal loading state - just black screen while checking backend
  return (
    <div style={{
      position:'fixed',inset:0,zIndex:99999,background:'#000'
    }} />
  );
}
