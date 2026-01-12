import React, { useState, useEffect, useRef } from 'react';
import usePlaybackStore from '../../store/playbackStore';

/**
 * FadeProgressBar - Visual indicator during scene/look transitions
 *
 * Shows a progress bar during fade transitions with:
 * - Current time / Total time display
 * - Percentage progress bar
 * - Auto-hides when not transitioning
 */
export default function FadeProgressBar({ isDesktop = false }) {
  const { playback, activeFade } = usePlaybackStore();
  const [fadeState, setFadeState] = useState(null);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  // Watch for activeFade or playback with fade info
  useEffect(() => {
    // Prefer activeFade from store, fallback to checking playback
    let fadeInfo = activeFade;

    if (!fadeInfo) {
      const activePlayback = Object.values(playback)[0];
      if (activePlayback?.fade_ms && activePlayback.started) {
        fadeInfo = {
          duration_ms: activePlayback.fade_ms,
          started: activePlayback.started,
          name: activePlayback.name || activePlayback.id || 'Transition',
          type: activePlayback.type || 'look'
        };
      }
    }

    if (fadeInfo?.duration_ms && fadeInfo.started) {
      const fadeDuration = fadeInfo.duration_ms;
      const startTime = new Date(fadeInfo.started).getTime();
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed < fadeDuration) {
        setFadeState({
          duration: fadeDuration,
          name: fadeInfo.name || 'Transition',
          type: fadeInfo.type || 'look'
        });
        startTimeRef.current = startTime;

        // Start animation loop
        const animate = () => {
          const currentTime = Date.now();
          const elapsedTime = currentTime - startTimeRef.current;
          const newProgress = Math.min(100, (elapsedTime / fadeDuration) * 100);

          setProgress(newProgress);

          if (newProgress < 100) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            // Fade complete, hide after brief delay
            setTimeout(() => {
              setFadeState(null);
              setProgress(0);
            }, 300);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      }
    } else if (!fadeInfo) {
      // No fade active, ensure we're cleared
      setFadeState(null);
      setProgress(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playback, activeFade]);

  // Don't render if no active fade
  if (!fadeState) return null;

  const elapsedMs = (progress / 100) * fadeState.duration;
  const elapsedSec = (elapsedMs / 1000).toFixed(1);
  const totalSec = (fadeState.duration / 1000).toFixed(1);

  return (
    <div
      className={`fade-progress-container ${isDesktop ? 'desktop' : ''}`}
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: isDesktop ? 12 : 8,
        padding: isDesktop ? '12px 16px' : '8px 12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: isDesktop ? 12 : 8,
      }}
    >
      {/* Label row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
      }}>
        <span style={{
          fontSize: isDesktop ? 11 : 9,
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          Fading to
        </span>
        <span style={{
          fontSize: isDesktop ? 13 : 11,
          fontWeight: 600,
          color: 'var(--accent)',
        }}>
          {fadeState.name}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: isDesktop ? 8 : 6,
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
      }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--accent), #22c55e)',
            borderRadius: 4,
            transition: 'width 50ms linear',
          }}
        />
      </div>

      {/* Time display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: isDesktop ? 11 : 9,
        color: 'rgba(255, 255, 255, 0.4)',
        fontFamily: 'monospace',
      }}>
        <span>{elapsedSec}s</span>
        <span>{Math.round(progress)}%</span>
        <span>{totalSec}s</span>
      </div>
    </div>
  );
}
