import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function Screensaver({ onExit, isLocked = false }) {
  const [time, setTime] = useState(new Date());
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClick = () => {
    setIsExiting(true);
    setTimeout(() => onExit(), 600);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        cursor: 'pointer',
        background: '#030305',
      }}
    >
      {/* Subtle theme glow behind logo */}
      <div style={{
        position: 'absolute',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--theme-primary) 0%, transparent 70%)',
        opacity: 0.15,
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      {/* Large metallic logo */}
      <div
        className={isExiting ? 'logo-docking' : ''}
        style={{ position: 'relative', marginBottom: 32 }}
      >
        <div style={{
          width: 320,
          height: 320,
          background: 'linear-gradient(145deg, #e8e8e8 0%, #a0a0a0 25%, #ffffff 50%, #909090 75%, #c0c0c0 100%)',
          maskImage: 'url(/aether_logo.png)',
          WebkitMaskImage: 'url(/aether_logo.png)',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }} />
        {isLocked && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--theme-primary)',
            boxShadow: '0 0 40px var(--theme-primary)'
          }}>
            <Lock size={32} color="#000" />
          </div>
        )}
      </div>

      {/* Time */}
      <div style={{
        fontSize: 56,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 12,
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.3s'
      }}>
        {formatTime(time)}
      </div>

      {/* Hint */}
      <div style={{
        fontSize: 14,
        color: 'rgba(255,255,255,0.35)',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.3s',
        animation: 'hint-pulse 3s ease-in-out infinite'
      }}>
        {isLocked ? 'Tap to unlock' : 'Tap anywhere to continue'}
      </div>

      <style>{`
        .logo-docking {
          animation: dock-to-header 0.6s ease-in-out forwards;
        }
        @keyframes dock-to-header {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50vw + 60px), calc(-50vh + 40px)) scale(0.12); opacity: 0.8; }
        }
        @keyframes hint-pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
