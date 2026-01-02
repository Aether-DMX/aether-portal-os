import React, { useEffect } from 'react';
const getApiUrl = () => `http://${window.location.hostname}:8891`;

export default function BootLoader({ onReady }) {
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/health`, { timeout: 2000 });
        if (res.ok) { onReady(); return true; }
      } catch (e) {}
      return false;
    };

    const poll = async () => {
      while (!(await checkBackend())) await new Promise(r => setTimeout(r, 500));
    };
    poll();
  }, [onReady]);

  // Minimal loading state - just black screen while checking backend
  return (
    <div style={{
      position:'fixed',inset:0,zIndex:99999,background:'#0a0a0a'
    }} />
  );
}
