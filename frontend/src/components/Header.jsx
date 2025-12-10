import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

export default function Header({ onLock }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [nodeCount, setNodeCount] = useState({ online: 0, total: 0 });
  const [fps, setFps] = useState(44);

  // Determine if we're on home/dashboard
  const isHome = location.pathname === '/' || location.pathname === '/dashboard';

  // Fetch nodes for status display
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/nodes`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const nodes = Array.isArray(data) ? data : [];
        setNodeCount({
          online: nodes.filter(n => n.status === 'online').length,
          total: nodes.length
        });
      } catch (e) {
        console.error('Node fetch error:', e);
      }
    };

    fetchNodes();
    const nodeInterval = setInterval(fetchNodes, 10000);
    const timeInterval = setInterval(() => setTime(new Date()), 1000);

    return () => {
      clearInterval(nodeInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleBack = () => navigate(-1);
  const handleHome = () => navigate('/');
  const handleNodesClick = () => navigate('/nodes');
  const handleLock = () => onLock?.();

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <header className="launcher-header">
      {/* Left Section - Back Button + Logo */}
      <div className="launcher-logo">
        {/* Back Button - only show when NOT on home */}
        {!isHome && (
          <button
            type="button"
            onClick={handleBack}
            className="back-btn mr-2"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Logo - Click to go home */}
        <button
          type="button"
          onClick={handleHome}
          className="flex items-center gap-2 hover:opacity-80 active:opacity-60 transition-opacity"
          aria-label="Go to Dashboard"
        >
          <img src="/Aether_LogoN1.png" alt="AETHER" className="launcher-logo-icon" style={{ width: "clamp(32px, 8vw, 44px)", height: "clamp(32px, 8vw, 44px)" }} />
          <div className="launcher-logo-text">
            <span className="launcher-logo-aether">AETHER</span>
            <span className="launcher-logo-dmx">DMX</span>
          </div>
        </button>
      </div>

      {/* Right Section - Status Indicators */}
      <div className="header-status">
        {/* Node Status */}
        <button
          type="button"
          onClick={handleNodesClick}
          className="status-item cursor-pointer hover:opacity-80"
          aria-label="Node Management"
        >
          <div className={`status-dot ${nodeCount.online === 0 ? 'error' : nodeCount.online < nodeCount.total ? 'warning' : ''}`} />
          <span>{nodeCount.online} Nodes</span>
        </button>

        {/* FPS Status */}
        <div className="status-item">
          <div className="status-dot" />
          <span>{fps}fps</span>
        </div>

        {/* Time */}
        <span className="header-time">{formatTime(time)}</span>

        {/* Lock Button */}
        <button
          type="button"
          onClick={handleLock}
          className="header-lock"
          aria-label="Lock Screen"
        >
          {'\uD83D\uDD12'}
        </button>
      </div>
    </header>
  );
}
