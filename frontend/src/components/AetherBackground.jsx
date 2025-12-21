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
  return [
    baseColor,
    rgbToHex(Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40)),
    rgbToHex(r * 0.6, g * 0.6, b * 0.6),
    rgbToHex(Math.min(255, r + 20), g, Math.max(0, b - 20)),
  ];
};

const extractChaseColors = (chase) => {
  if (!chase?.steps?.length) return null;
  const colors = [];
  for (const step of chase.steps) {
    const color = extractColorsFromChannels(step.channels);
    if (color && !colors.includes(color)) colors.push(color);
  }
  if (colors.length > 0) {
    const variations = [];
    colors.forEach(c => {
      variations.push(c);
      const hex = c.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      variations.push(rgbToHex(r * 0.5, g * 0.5, b * 0.5));
    });
    return variations;
  }
  return null;
};

const generateBubbles = (count, colors, speedMultiplier, intensity, sizeMultiplier, isChase = false) => {
  const chaseBoost = isChase ? 0.85 : 1.0;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: (40 + Math.random() * 120) * sizeMultiplier,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: (0.25 + Math.random() * 0.4) * intensity,
    blur: (15 + Math.random() * 30) * sizeMultiplier,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: (35 + Math.random() * 35) * speedMultiplier * chaseBoost,
    delay: Math.random() * 15,
  }));
};

export default function AetherBackground() {
  const { enabled, preset, speed, bubbleCount, intensity, size, getColors, getSpeedMultiplier } = useBackgroundStore();
  const playback = usePlaybackStore(state => state.playback);
  const scenes = useSceneStore(state => state.scenes);
  const chases = useChaseStore(state => state.chases);
  const [liveColors, setLiveColors] = useState(null);
  const [isChase, setIsChase] = useState(false);

  useEffect(() => {
    if (preset !== 'live') { setLiveColors(null); setIsChase(false); return; }
    const activePlayback = Object.values(playback).find(p => p?.type);
    if (!activePlayback) { setLiveColors(null); setIsChase(false); return; }
    if (activePlayback.type === 'scene') {
      const scene = scenes.find(s => (s.scene_id || s.id) === activePlayback.id);
      if (scene?.color) { setLiveColors(generateColorVariations(scene.color)); setIsChase(false); }
      else if (scene?.channels) {
        const color = extractColorsFromChannels(scene.channels);
        setLiveColors(color ? generateColorVariations(color) : null); setIsChase(false);
      }
    } else if (activePlayback.type === 'chase') {
      const chase = chases.find(c => (c.chase_id || c.id) === activePlayback.id);
      setLiveColors(extractChaseColors(chase)); setIsChase(true);
    }
  }, [preset, playback, scenes, chases]);

  const bubbles = useMemo(() => {
    if (!enabled) return [];
    let colors;
    let speedMult = getSpeedMultiplier(speed);
    let currentIsChase = false;
    if (preset === 'live' && liveColors) {
      colors = liveColors; currentIsChase = isChase;
      if (isChase) speedMult *= 0.8;
    } else {
      colors = getColors(preset === 'live' ? 'default' : preset);
    }
    return generateBubbles(bubbleCount, colors, speedMult, intensity, size, currentIsChase);
  }, [enabled, preset, speed, bubbleCount, intensity, size, getColors, getSpeedMultiplier, liveColors, isChase]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute transition-all duration-1000"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            background: `radial-gradient(circle, ${bubble.color}, transparent)`,
            opacity: bubble.opacity,
            filter: `blur(${bubble.blur}px)`,
            left: `${bubble.left}%`,
            top: `${bubble.top}%`,
            animation: `float-random-${bubble.id % 5} ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </div>
  );
}
