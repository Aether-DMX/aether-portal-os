import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wifi, WifiOff, Activity, ArrowLeft, Lock, MessageSquare } from 'lucide-react';

const getApiUrl = () => `http://${window.location.hostname}:8891`;
const getBackendUrl = getApiUrl;

export default function Header({ currentUniverse, onLock, onAIClick, headerExtension }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [nodeCount, setNodeCount] = useState({ online: 0, total: 0 });
  const [connected, setConnected] = useState(true);

  // Determine if we're on home/dashboard
  const isHome = location.pathname === '/' || location.pathname === '/dashboard';

  // Fetch nodes for status display
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/nodes`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const nodes = Array.isArray(data) ? data : [];
        setNodeCount({ 
          online: nodes.filter(n => n.status === 'online').length, 
          total: nodes.length 
        });
        setConnected(true);
      } catch (e) {
        console.error('Node fetch error:', e);
        setConnected(false);
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

  const allOnline = nodeCount.online === nodeCount.total && nodeCount.total > 0;

  // Navigation handlers
  const handleBack = () => {
    console.log('Back button clicked');
    navigate(-1);
  };

  const handleHome = () => {
    console.log('Logo clicked - navigating home');
    navigate('/');
  };

  const handleNodesClick = () => {
    console.log('Nodes clicked - navigating to /nodes');
    navigate('/nodes');
  };

  const handleLock = () => {
    console.log('Lock clicked');
    if (onLock) {
      onLock();
    }
  };

  const handleAIClick = () => {
    console.log('AI clicked');
    if (onAIClick) {
      onAIClick();
    }
  };

  return (
    <header className="glass-panel relative z-20">
      <div className="px-4 py-2 flex items-center justify-between">
        {/* Left Section - Back Button + Logo */}
        <div className="flex items-center gap-3">
          {/* Back Button - only show when NOT on home */}
          {!isHome && (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Logo - Click to go home */}
          <button
            type="button"
            onClick={handleHome}
            className="flex items-center gap-3 hover:opacity-80 active:opacity-60 transition-opacity"
            aria-label="Go to Dashboard"
          >
            <img 
              src="/Aether_LogoN1.png" 
              alt="AETHER" 
              className="h-10 w-auto"
            />
            <div className="hidden sm:block text-left">
              <h1 className="text-lg font-bold text-white">AETHER DMX</h1>
              <p className="text-xs text-slate-400">Lighting Control System</p>
            </div>
          </button>
        </div>

        {/* Center - Time */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-xl font-bold text-white tabular-nums">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Right Section - Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Button */}
          {onAIClick && (
            <button
              type="button"
              onClick={handleAIClick}
              className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 transition-colors"
              aria-label="AI Assistant"
            >
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </button>
          )}

          {/* Node Status - Clickable */}
          <button
            type="button"
            onClick={handleNodesClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 active:bg-black/70 transition-colors"
            aria-label="Node Management"
          >
            {allOnline ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : nodeCount.online === 0 ? (
              <WifiOff className="w-4 h-4 text-red-400" />
            ) : (
              <Wifi className="w-4 h-4 text-yellow-400" />
            )}
            <span className="text-sm font-medium">
              <span className={
                allOnline ? 'text-green-400' : 
                nodeCount.online === 0 ? 'text-red-400' : 
                'text-yellow-400'
              }>
                {nodeCount.online}
              </span>
              <span className="text-slate-500">/{nodeCount.total}</span>
            </span>
          </button>

          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            connected ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <Activity className={`w-4 h-4 ${connected ? 'text-green-400' : 'text-red-400'}`} />
            <span className={`text-xs font-medium ${connected ? 'text-green-400' : 'text-red-400'}`}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>


          {/* Lock Button */}
          <button
            type="button"
            onClick={handleLock}
            className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 active:bg-red-500/30 hover:text-red-400 transition-colors"
            aria-label="Lock Screen"
          >
            <Lock className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Second Row - Header Extension (only if provided and not null) */}
      {headerExtension && (
        <div className="px-4 py-2 border-t border-white/10">
          {headerExtension}
        </div>
      )}
    </header>
  );
}
