import React, { useMemo, useEffect, useState } from 'react';
import useBackgroundStore from '../store/backgroundStore';
import usePlaybackStore from '../store/playbackStore';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';

const rgbToHex = (r, g, b) => {
  const toHex = (n) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const extractColorsFromChannels = (channels) => {
  if (!channels) return null;
  const r = channels['1'] ?? channels[1] ?? 0;
  const g = channels['2'] ?? channels[2] ?? 0;
  const b = channels['3'] ?? channels[3] ?? 0;
  if (r === 0 && g === 0 && b === 0) return null;
  return rgbToHex(r, g, b);
};

const generateColorVariations = (baseColor) => {
  if (!baseColor) return null;
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [baseColor, rgbToHex(r * 0.7, g * 0.7, b * 0.7)];
};

const extractChaseColors = (chase) => {
  if (!chase?.steps?.length) return null;
  const colors = [];
  for (const step of chase.steps) {
    const color = extractColorsFromChannels(step.channels);
    if (color && !colors.includes(color)) colors.push(color);
  }
  return colors.length > 0 ? colors : null;
};

// Fixed bubble data with drift directions
const BUBBLES = [
  { x: 5, y: 15, size: 12, dx: 40, dy: -30 },
  { x: 92, y: 8, size: 10, dx: -35, dy: 25 },
  { x: 20, y: 75, size: 14, dx: 30, dy: -40 },
  { x: 75, y: 85, size: 11, dx: -25, dy: -35 },
  { x: 45, y: 35, size: 9, dx: 35, dy: 30 },
  { x: 12, y: 90, size: 13, dx: 40, dy: -25 },
  { x: 88, y: 45, size: 10, dx: -30, dy: 35 },
  { x: 35, y: 5, size: 12, dx: 25, dy: 40 },
  { x: 60, y: 60, size: 8, dx: -40, dy: -30 },
  { x: 8, y: 50, size: 11, dx: 35, dy: 25 },
  { x: 95, y: 70, size: 9, dx: -30, dy: -35 },
  { x: 55, y: 92, size: 10, dx: 30, dy: -40 },
  { x: 30, y: 40, size: 13, dx: -35, dy: 30 },
  { x: 78, y: 20, size: 11, dx: 25, dy: 35 },
  { x: 48, y: 12, size: 10, dx: -25, dy: 40 },
];

export default function AetherBackground() {
  const { enabled } = useBackgroundStore();
  const playback = usePlaybackStore(state => state.playback);
  const scenes = useSceneStore(state => state.scenes);
  const chases = useChaseStore(state => state.chases);
  const [liveColors, setLiveColors] = useState(null);

  const themeColor = useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue('--theme-primary').trim() || '#a855f7';
  }, []);

  useEffect(() => {
    const activePlayback = Object.values(playback).find(p => p?.type);
    if (!activePlayback) { setLiveColors(null); return; }
    
    if (activePlayback.type === 'scene') {
      const scene = scenes.find(s => (s.scene_id || s.id) === activePlayback.id);
      if (scene?.color) setLiveColors(generateColorVariations(scene.color));
      else if (scene?.channels) {
        const color = extractColorsFromChannels(scene.channels);
        setLiveColors(color ? generateColorVariations(color) : null);
      }
    } else if (activePlayback.type === 'chase') {
      const chase = chases.find(c => (c.chase_id || c.id) === activePlayback.id);
      setLiveColors(extractChaseColors(chase));
    }
  }, [playback, scenes, chases]);

  const bubbles = useMemo(() => {
    const colors = liveColors || generateColorVariations(themeColor) || [themeColor];
    return BUBBLES.map((b, i) => ({ ...b, id: i, color: colors[i % colors.length] }));
  }, [liveColors, themeColor]);

  if (!enabled) return null;

  // Generate keyframes for each bubble
  const keyframes = BUBBLES.map((b, i) => `
    @keyframes drift-${i} {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(${b.dx}px, ${b.dy}px); }
    }
  `).join('\n');

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <style>{keyframes}</style>
      {bubbles.map((b, i) => (
        <div key={b.id} className="absolute rounded-full"
          style={{
            width: b.size, height: b.size,
            backgroundColor: b.color,
            opacity: 0.5,
            left: `${b.x}%`,
            top: `${b.y}%`,
            boxShadow: `0 0 ${b.size}px ${b.color}`,
            animation: `drift-${i} ${15 + (i % 5) * 4}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
