import React, { useMemo } from 'react';
import useBackgroundStore from '../store/backgroundStore';

const generateBubbles = (count, colors, speedMultiplier, intensity, sizeMultiplier) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: (40 + Math.random() * 120) * sizeMultiplier,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: (0.2 + Math.random() * 0.35) * intensity,
    blur: (15 + Math.random() * 30) * sizeMultiplier,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: (20 + Math.random() * 25) * speedMultiplier,
    delay: Math.random() * 10,
  }));
};

export default function AetherBackground() {
  const { enabled, preset, speed, bubbleCount, intensity, size, getColors, getSpeedMultiplier } = useBackgroundStore();

  const bubbles = useMemo(() => {
    if (!enabled) return [];
    const colors = getColors(preset);
    const speedMult = getSpeedMultiplier(speed);
    return generateBubbles(bubbleCount, colors, speedMult, intensity, size);
  }, [enabled, preset, speed, bubbleCount, intensity, size, getColors, getSpeedMultiplier]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute"
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
