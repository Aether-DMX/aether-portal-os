/**
 * ColorBar - Colored accent bar for cards
 *
 * Used to visually distinguish different element types or custom colors.
 */
import React, { memo } from 'react';

// Predefined color mappings
const COLOR_MAP = {
  blue: 'linear-gradient(90deg, #3b82f6, #2563eb)',
  purple: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
  cyan: 'linear-gradient(90deg, #06b6d4, #0891b2)',
  green: 'linear-gradient(90deg, #22c55e, #16a34a)',
  red: 'linear-gradient(90deg, #ef4444, #dc2626)',
  orange: 'linear-gradient(90deg, #f97316, #ea580c)',
  amber: 'linear-gradient(90deg, #f59e0b, #d97706)',
  pink: 'linear-gradient(90deg, #ec4899, #db2777)',
  indigo: 'linear-gradient(90deg, #6366f1, #4f46e5)',
  teal: 'linear-gradient(90deg, #14b8a6, #0d9488)',
  // Element type defaults
  scene: 'linear-gradient(90deg, #22c55e, #16a34a)',
  chase: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
  group: 'linear-gradient(90deg, #3b82f6, #2563eb)',
  fixture: 'linear-gradient(90deg, #f59e0b, #d97706)',
  show: 'linear-gradient(90deg, #ec4899, #db2777)',
  schedule: 'linear-gradient(90deg, #06b6d4, #0891b2)',
  node: 'linear-gradient(90deg, #14b8a6, #0d9488)',
};

const ColorBar = memo(function ColorBar({
  color,
  position = 'top', // 'top' | 'left' | 'bottom' | 'right'
  size = 3, // thickness in pixels
  className = '',
  style = {},
}) {
  // Determine the actual color/gradient
  let background = color;
  if (COLOR_MAP[color]) {
    background = COLOR_MAP[color];
  } else if (color && !color.startsWith('#') && !color.startsWith('rgb') && !color.startsWith('linear')) {
    // Assume it's a hex color without #
    background = `#${color}`;
  }

  const positionStyles = {
    top: {
      top: 0,
      left: 0,
      right: 0,
      height: size,
      width: '100%',
    },
    bottom: {
      bottom: 0,
      left: 0,
      right: 0,
      height: size,
      width: '100%',
    },
    left: {
      top: 0,
      left: 0,
      bottom: 0,
      width: size,
      height: '100%',
    },
    right: {
      top: 0,
      right: 0,
      bottom: 0,
      width: size,
      height: '100%',
    },
  };

  return (
    <div
      className={`color-bar color-bar--${position} ${className}`}
      style={{
        position: 'absolute',
        background,
        ...positionStyles[position],
        ...style,
      }}
    />
  );
});

export default ColorBar;
