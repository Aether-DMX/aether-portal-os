import React from 'react';

/**
 * ColorPresets - Shared color preset data and picker components
 *
 * Used across: SceneEditor, ChaseEditor, LookSequenceEditor, Effects, Faders, PixelArrays
 *
 * Provides:
 * - Standard color preset data in multiple formats
 * - ColorPresetPicker component for grid selection
 * - ColorPresetButton for inline color buttons
 */

// ============================================================
// Standard Color Presets (10 colors)
// ============================================================
export const COLOR_PRESETS = [
  { name: 'Red', shortName: 'R', rgb: [255, 0, 0], rgbw: [255, 0, 0, 0], hex: '#ff0000', tailwind: '#ef4444' },
  { name: 'Orange', shortName: 'O', rgb: [255, 128, 0], rgbw: [255, 128, 0, 0], hex: '#ff8000', tailwind: '#f97316' },
  { name: 'Yellow', shortName: 'Y', rgb: [255, 255, 0], rgbw: [255, 255, 0, 0], hex: '#ffff00', tailwind: '#eab308' },
  { name: 'Green', shortName: 'G', rgb: [0, 255, 0], rgbw: [0, 255, 0, 0], hex: '#00ff00', tailwind: '#22c55e' },
  { name: 'Cyan', shortName: 'C', rgb: [0, 255, 255], rgbw: [0, 255, 255, 0], hex: '#00ffff', tailwind: '#06b6d4' },
  { name: 'Blue', shortName: 'B', rgb: [0, 0, 255], rgbw: [0, 0, 255, 0], hex: '#0000ff', tailwind: '#3b82f6' },
  { name: 'Purple', shortName: 'P', rgb: [128, 0, 255], rgbw: [128, 0, 255, 0], hex: '#8000ff', tailwind: '#8b5cf6' },
  { name: 'Magenta', shortName: 'M', rgb: [255, 0, 255], rgbw: [255, 0, 255, 0], hex: '#ff00ff', tailwind: '#ec4899' },
  { name: 'White', shortName: 'W', rgb: [255, 255, 255], rgbw: [255, 255, 255, 255], hex: '#ffffff', tailwind: '#ffffff' },
  { name: 'Warm', shortName: 'A', rgb: [255, 200, 150], rgbw: [255, 170, 85, 0], hex: '#ffc896', tailwind: '#fcd34d' },
];

// Off preset (separate for explicit use)
export const COLOR_OFF = { name: 'Off', shortName: '-', rgb: [0, 0, 0], rgbw: [0, 0, 0, 0], hex: '#000000', tailwind: '#333333' };

// ============================================================
// Format Converters
// ============================================================

/**
 * Convert preset to channel object format (for LookSequenceEditor)
 * @param {object} preset - Color preset
 * @param {number} startChannel - Starting DMX channel (default 1)
 * @returns {object} Channel values { '1': r, '2': g, '3': b }
 */
export function presetToChannels(preset, startChannel = 1) {
  return {
    [String(startChannel)]: preset.rgb[0],
    [String(startChannel + 1)]: preset.rgb[1],
    [String(startChannel + 2)]: preset.rgb[2],
  };
}

/**
 * Convert preset to RGBW channel object
 * @param {object} preset - Color preset
 * @param {number} startChannel - Starting DMX channel (default 1)
 * @returns {object} Channel values { '1': r, '2': g, '3': b, '4': w }
 */
export function presetToRGBWChannels(preset, startChannel = 1) {
  return {
    [String(startChannel)]: preset.rgbw[0],
    [String(startChannel + 1)]: preset.rgbw[1],
    [String(startChannel + 2)]: preset.rgbw[2],
    [String(startChannel + 3)]: preset.rgbw[3],
  };
}

// ============================================================
// ColorPresetPicker Component
// ============================================================

/**
 * Grid of color preset buttons
 *
 * @param {function} onSelect - Called with preset when selected
 * @param {number} columns - Grid columns (default: 5)
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} showNames - Show color names (default: false)
 * @param {boolean} shortNames - Use short names like 'R', 'G', 'B' (default: false)
 * @param {boolean} includeOff - Include "Off" preset (default: false)
 * @param {number} limit - Limit number of presets shown
 * @param {string} className - Additional CSS classes
 */
export function ColorPresetPicker({
  onSelect,
  columns = 5,
  size = 'md',
  showNames = false,
  shortNames = false,
  includeOff = false,
  limit,
  className = '',
}) {
  const presets = includeOff ? [...COLOR_PRESETS, COLOR_OFF] : COLOR_PRESETS;
  const displayPresets = limit ? presets.slice(0, limit) : presets;

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={`grid gap-1.5 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {displayPresets.map((preset) => (
        <button
          key={preset.name}
          onClick={() => onSelect(preset)}
          className={`${sizeClasses[size]} rounded-md border border-white/20 hover:scale-110 hover:border-white/50 transition-all`}
          style={{ backgroundColor: preset.hex }}
          title={preset.name}
        >
          {showNames && (
            <span
              className="font-bold"
              style={{
                color: preset.name === 'White' || preset.name === 'Yellow' ? '#000' : '#fff',
                textShadow: preset.name === 'White' || preset.name === 'Yellow' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {shortNames ? preset.shortName : preset.name.charAt(0)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// ColorPresetButton Component
// ============================================================

/**
 * Single color preset button
 *
 * @param {object} preset - Color preset object
 * @param {function} onClick - Click handler
 * @param {boolean} selected - Is this preset selected
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} className - Additional CSS classes
 */
export function ColorPresetButton({
  preset,
  onClick,
  selected = false,
  size = 'md',
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <button
      onClick={() => onClick(preset)}
      className={`${sizeClasses[size]} rounded-md border-2 transition-all ${
        selected
          ? 'border-white scale-110 ring-2 ring-white/50'
          : 'border-white/20 hover:border-white/50 hover:scale-105'
      } ${className}`}
      style={{ backgroundColor: preset.hex }}
      title={preset.name}
    />
  );
}

// ============================================================
// Legacy Format Helpers (for gradual migration)
// ============================================================

/**
 * Get presets in SceneEditor format
 * @returns {Array} [{ name, rgb: [r,g,b], color }]
 */
export function getSceneEditorPresets() {
  return COLOR_PRESETS.map(p => ({
    name: p.name,
    rgb: p.rgb,
    color: p.tailwind,
  }));
}

/**
 * Get presets in ChaseEditor format (short names)
 * @returns {Array} [{ name: 'R', rgb: [r,g,b], color }]
 */
export function getChaseEditorPresets() {
  return COLOR_PRESETS.slice(0, 9).map(p => ({
    name: p.shortName,
    rgb: p.rgb,
    color: p.hex,
  }));
}

/**
 * Get presets in LookSequenceEditor format
 * @returns {Array} [{ name, channels: {'1': r, '2': g, '3': b}, color }]
 */
export function getLookEditorPresets() {
  return [...COLOR_PRESETS, COLOR_OFF].map(p => ({
    name: p.name,
    channels: presetToChannels(p),
    color: p.hex,
  }));
}

/**
 * Get presets in Effects format (RGBW)
 * @returns {Array} [{ name, color, rgb: [r,g,b,w] }]
 */
export function getEffectsPresets() {
  return COLOR_PRESETS.map(p => ({
    name: p.name,
    color: p.hex,
    rgb: p.rgbw,
  }));
}

export default ColorPresetPicker;
