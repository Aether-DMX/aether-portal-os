import { useState } from 'react';

/**
 * TapTempo - Shared BPM detection component
 *
 * Tracks rapid taps to calculate BPM from average intervals.
 * Used in ChaseEditor and LookSequenceEditor for tempo matching.
 *
 * @param {function} onBpmChange - Callback with calculated BPM (30-300 range)
 * @param {string} className - Optional additional CSS classes
 * @param {string} size - 'sm' | 'md' (default: 'md')
 *
 * Algorithm:
 * - Tracks last 4 taps within 2-second window
 * - Calculates average interval between taps
 * - Converts to BPM: 60000 / avgInterval
 * - Clamps result to [30, 300] range
 */
export default function TapTempo({ onBpmChange, className = '', size = 'md' }) {
  const [taps, setTaps] = useState([]);
  const [lastTap, setLastTap] = useState(0);
  const [flash, setFlash] = useState(false);

  const handleTap = () => {
    const now = Date.now();
    setFlash(true);
    setTimeout(() => setFlash(false), 100);

    // Reset if more than 2 seconds since last tap
    if (now - lastTap > 2000) {
      setTaps([now]);
    } else {
      // Keep last 4 taps for averaging
      const newTaps = [...taps, now].slice(-4);
      setTaps(newTaps);

      // Calculate BPM from intervals
      if (newTaps.length >= 2) {
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = Math.min(300, Math.max(30, Math.round(60000 / avgInterval)));
        onBpmChange(bpm);
      }
    }
    setLastTap(now);
  };

  const sizeClasses = size === 'sm'
    ? 'px-3 py-2 text-xs'
    : 'px-4 py-2 text-sm';

  return (
    <button
      onClick={handleTap}
      className={`rounded-lg font-bold transition-all ${sizeClasses} ${
        flash
          ? 'bg-[var(--accent,var(--theme-primary))] text-black scale-95'
          : 'bg-white/10 text-white hover:bg-white/20'
      } ${className}`}
    >
      TAP
    </button>
  );
}
