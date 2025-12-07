import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function Screensaver({ onExit, isLocked = false }) {
  const [particles, setParticles] = useState([]);
  const [time, setTime] = useState(new Date());
  const [isExiting, setIsExiting] = useState(false);
  const [fadeLevel, setFadeLevel] = useState(0);
  const [timeOnScreen, setTimeOnScreen] = useState(0);

  useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      color: ['#64c8ff', '#a064ff', '#ff6496', '#ffc864', '#64ffa0'][Math.floor(Math.random() * 5)]
    }));
    setParticles(newParticles);

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fadeTimer = setInterval(() => {
      setTimeOnScreen(prev => {
        const newTime = prev + 1;
        const newFadeLevel = Math.floor(newTime / 180);
        setFadeLevel(Math.min(newFadeLevel, 5));
        return newTime;
      });
    }, 1000);

    return () => clearInterval(fadeTimer);
  }, []);

  const handleClick = () => {
    console.log('🚀 SCREENSAVER CLICKED - STARTING EXIT ANIMATION');
    setIsExiting(true);
    setTimeout(() => {
      console.log('✅ DOCKING COMPLETE - CALLING onExit');
      onExit();
    }, 1200);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const contentOpacity = Math.max(0, 1 - (fadeLevel * 0.2));
  const showOnlyLogo = fadeLevel >= 1;

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: `linear-gradient(135deg, #0a0a0a 0%, #${Math.floor(26 - fadeLevel * 3).toString(16).padStart(2, '0')}${Math.floor(26 - fadeLevel * 3).toString(16).padStart(2, '0')}${Math.floor(26 - fadeLevel * 3).toString(16).padStart(2, '0')} 50%, #0a0a0a 100%)`,
        transition: 'background 2s ease'
      }}
    >
      {/* PARTICLES - STAY VISIBLE DURING EXIT */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          opacity: showOnlyLogo ? 0 : (isExiting ? 1 : contentOpacity),
          transition: 'opacity 0.5s',
          pointerEvents: 'none'
        }}
      >
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: '50%',
              opacity: 0.6,
              animation: `particle-float-${particle.id} ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center'
        }}
      >
        {!showOnlyLogo ? (
          <>
            {/* ORBIT PARTICLES - STAY VISIBLE DURING EXIT */}
            <div
              style={{
                position: 'relative',
                marginBottom: '32px',
                opacity: isExiting ? 1 : contentOpacity,
                transition: isExiting ? 'none' : 'opacity 0.5s'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-80px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '192px',
                height: '128px',
                pointerEvents: 'none'
              }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: '16px',
                      height: '16px',
                      backgroundColor: ['#64c8ff', '#a064ff', '#ff6496', '#ffc864', '#64ffa0'][i],
                      borderRadius: '50%',
                      left: `${20 * i}%`,
                      animation: `orbit-float-${i} ${2 + i * 0.3}s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                      boxShadow: `0 0 20px ${['#64c8ff', '#a064ff', '#ff6496', '#ffc864', '#64ffa0'][i]}`
                    }}
                  />
                ))}
              </div>

              {/* BIG FLOATING LOGO - DOCKS TO HEADER */}
              <div
                className={`logo-wrapper ${isExiting ? 'logo-docking' : ''}`}
                style={{
                  display: 'inline-block',
                  position: 'relative'
                }}
              >
                <img
                  src="/Aether_LogoN1.png"
                  alt="AETHER"
                  style={{
                    width: '160px',
                    height: '160px',
                    display: 'block',
                    filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.6))'
                  }}
                />

                {isLocked && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      right: '-8px',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--theme-primary)',
                      boxShadow: '0 0 20px var(--theme-primary)'
                    }}
                  >
                    <Lock size={20} style={{ color: '#ffffff' }} />
                  </div>
                )}
              </div>
            </div>

            {/* TEXT CONTENT - FADES OUT DURING EXIT */}
            <div style={{
              opacity: isExiting ? 0 : contentOpacity,
              transition: 'opacity 0.3s'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#ffffff'
                }}>
                  ÆTHER <span style={{ color: 'var(--theme-primary)' }}>DMX</span>
                </h1>
                <p style={{
                  fontSize: '1.125rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {isLocked ? 'System Locked' : 'Professional Lighting Control'}
                </p>
              </div>

              <div style={{
                fontSize: '2.25rem',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                marginBottom: '32px',
                color: 'var(--theme-primary)'
              }}>
                {formatTime(time)}
              </div>

              <div
                style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  animation: 'hint-pulse 2s ease-in-out infinite'
                }}
              >
                {isLocked ? 'Tap to unlock' : 'Tap anywhere to continue'}
              </div>
            </div>
          </>
        ) : (
          <div style={{ opacity: contentOpacity }}>
            <h1 style={{
              fontSize: '3.75rem',
              fontWeight: 'bold',
              color: '#ffffff'
            }}>
              ÆTHER <span style={{ color: 'var(--theme-primary)' }}>DMX</span>
            </h1>
          </div>
        )}
      </div>

      <style>{`
        /* Background particle animations */
        ${particles.map((p, i) => `
          @keyframes particle-float-${i} {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(10px, -20px); }
            50% { transform: translate(-10px, -10px); }
            75% { transform: translate(5px, -30px); }
          }
        `).join('\n')}

        /* Orbit particle animations */
        ${[0, 1, 2, 3, 4].map(i => `
          @keyframes orbit-float-${i} {
            0% { transform: translateY(0) scale(1); opacity: 0.8; }
            50% { opacity: 1; }
            100% { transform: translateY(-100px) scale(0.3); opacity: 0; }
          }
        `).join('\n')}

        /* Logo floating when NOT exiting */
        .logo-wrapper:not(.logo-docking) {
          animation: logo-float 3s ease-in-out infinite;
        }

        @keyframes logo-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        /* LOGO DOCKING ANIMATION - THE MAGIC! */
        .logo-docking {
          animation: dock-to-header 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards !important;
        }

        @keyframes dock-to-header {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(50vw - 100px), calc(-50vh + 30px)) scale(0.0625);
            opacity: 1;
          }
        }

        /* Tap hint pulse */
        @keyframes hint-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
