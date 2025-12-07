import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

// All available presets with their colors and descriptions
const themePresets = {
  default: {
    name: 'Default',
    description: 'Auto-contrasts with your accent color',
    emoji: '🎯',
    category: 'smart',
    colors: null, // Will be calculated dynamically
  },
  warm: {
    name: 'Warm',
    description: 'Cozy reds, oranges & yellows',
    emoji: '🔥',
    category: 'temperature',
    colors: ['#ef4444', '#f97316', '#fbbf24', '#fb923c'],
  },
  cool: {
    name: 'Cool',
    description: 'Calm blues, cyans & teals',
    emoji: '❄️',
    category: 'temperature',
    colors: ['#3b82f6', '#0ea5e9', '#06b6d4', '#6366f1'],
  },
  sunset: {
    name: 'Sunset',
    description: 'Golden hour vibes',
    emoji: '🌅',
    category: 'nature',
    colors: ['#f97316', '#fb923c', '#f59e0b', '#ef4444'],
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep sea tranquility',
    emoji: '🌊',
    category: 'nature',
    colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#0891b2'],
  },
  forest: {
    name: 'Forest',
    description: 'Lush green canopy',
    emoji: '🌲',
    category: 'nature',
    colors: ['#22c55e', '#10b981', '#059669', '#34d399'],
  },
  aurora: {
    name: 'Aurora',
    description: 'Northern lights magic',
    emoji: '🌌',
    category: 'nature',
    colors: ['#22d3ee', '#a855f7', '#6366f1', '#14b8a6'],
  },
  cosmic: {
    name: 'Cosmic',
    description: 'Deep space purple',
    emoji: '💜',
    category: 'vibes',
    colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
  },
  cyberpunk: {
    name: 'Cyberpunk',
    description: 'Neon dystopia',
    emoji: '🤖',
    category: 'vibes',
    colors: ['#f0abfc', '#e879f9', '#22d3ee', '#a855f7'],
  },
  neon: {
    name: 'Neon',
    description: 'Electric nightlife',
    emoji: '💡',
    category: 'vibes',
    colors: ['#f0abfc', '#c084fc', '#818cf8', '#22d3ee'],
  },
  fire: {
    name: 'Fire',
    description: 'Blazing intensity',
    emoji: '🔥',
    category: 'vibes',
    colors: ['#ef4444', '#dc2626', '#f97316', '#fbbf24'],
  },
  midnight: {
    name: 'Midnight',
    description: 'Deep blue night',
    emoji: '🌙',
    category: 'vibes',
    colors: ['#1e3a5f', '#3b82f6', '#6366f1', '#8b5cf6'],
  },
};

// Generate contrasting colors for default theme
const generateContrastingColors = (themeColor) => {
  try {
    // Convert hex to HSL
    const r = parseInt(themeColor.slice(1, 3), 16) / 255;
    const g = parseInt(themeColor.slice(3, 5), 16) / 255;
    const b = parseInt(themeColor.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    h = h * 360;
    
    // HSL to Hex helper
    const hslToHex = (h, s, l) => {
      s /= 100; l /= 100;
      const a = s * Math.min(l, 1 - l);
      const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };
    
    return [
      hslToHex((h + 180) % 360, 70, 55),
      hslToHex((h + 120) % 360, 65, 50),
      hslToHex((h + 240) % 360, 60, 60),
      hslToHex((h + 30) % 360, 75, 45),
    ];
  } catch (e) {
    return ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];
  }
};

// Mini bubble preview component
const BubblePreview = ({ colors, isDefault, themeColor }) => {
  const displayColors = isDefault ? generateContrastingColors(themeColor || '#888888') : colors;
  
  return (
    <div className="relative w-full h-20 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
      {displayColors?.map((color, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            width: `${25 + i * 8}px`,
            height: `${25 + i * 8}px`,
            background: `radial-gradient(circle, ${color}, transparent)`,
            opacity: 0.7,
            filter: 'blur(8px)',
            left: `${15 + i * 20}%`,
            top: `${20 + (i % 2) * 30}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${2 + i * 0.3}s`,
          }}
        />
      ))}
      {/* Color swatches at bottom */}
      <div className="absolute bottom-1 left-1 right-1 flex gap-1 justify-center">
        {displayColors?.map((color, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border border-white/30"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};

export default function BackgroundThemeModal({ isOpen, onClose, currentPreset, onSelect, themeColor }) {
  const [hoveredPreset, setHoveredPreset] = useState(null);
  
  if (!isOpen) return null;

  const categories = {
    smart: { label: '✨ Smart', presets: ['default'] },
    temperature: { label: '🌡️ Temperature', presets: ['warm', 'cool'] },
    nature: { label: '🌿 Nature', presets: ['sunset', 'ocean', 'forest', 'aurora'] },
    vibes: { label: '🎭 Vibes', presets: ['cosmic', 'cyberpunk', 'neon', 'fire', 'midnight'] },
  };

  const handleSelect = (preset) => {
    onSelect(preset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(20, 20, 35, 0.98))',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-black/30 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-white">Background Theme</h2>
            <p className="text-sm text-slate-400">Choose your bubble style</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-4 border-b border-white/10">
          <div className="text-xs text-slate-400 mb-2">Preview</div>
          <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
            {(() => {
              const previewKey = hoveredPreset || currentPreset;
              const preset = themePresets[previewKey];
              const colors = previewKey === 'default' 
                ? generateContrastingColors(themeColor || '#888888')
                : preset?.colors || [];
              
              return colors.map((color, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${60 + i * 20}px`,
                    height: `${60 + i * 20}px`,
                    background: `radial-gradient(circle, ${color}, transparent)`,
                    opacity: 0.6,
                    filter: 'blur(15px)',
                    left: `${10 + i * 22}%`,
                    top: `${15 + (i % 2) * 25}%`,
                    animation: `float-${i} ${3 + i * 0.5}s ease-in-out infinite`,
                  }}
                />
              ));
            })()}
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="text-lg font-bold text-white drop-shadow-lg">
                {themePresets[hoveredPreset || currentPreset]?.emoji} {themePresets[hoveredPreset || currentPreset]?.name}
              </span>
            </div>
          </div>
          <style>{`
            @keyframes float-0 { 0%, 100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-10px) translateX(5px); } }
            @keyframes float-1 { 0%, 100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(8px) translateX(-8px); } }
            @keyframes float-2 { 0%, 100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-12px) translateX(-5px); } }
            @keyframes float-3 { 0%, 100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(6px) translateX(10px); } }
          `}</style>
        </div>

        {/* Theme Grid */}
        <div className="p-4 space-y-4">
          {Object.entries(categories).map(([catKey, cat]) => (
            <div key={catKey}>
              <div className="text-sm font-medium text-slate-300 mb-2">{cat.label}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cat.presets.map((presetKey) => {
                  const preset = themePresets[presetKey];
                  const isSelected = currentPreset === presetKey;
                  
                  return (
                    <button
                      key={presetKey}
                      onClick={() => handleSelect(presetKey)}
                      onMouseEnter={() => setHoveredPreset(presetKey)}
                      onMouseLeave={() => setHoveredPreset(null)}
                      className="relative p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: isSelected 
                          ? 'rgba(var(--theme-primary-rgb), 0.15)' 
                          : 'rgba(255, 255, 255, 0.03)',
                        borderColor: isSelected 
                          ? 'var(--theme-primary)' 
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--theme-primary)' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      
                      {/* Preview bubbles */}
                      <BubblePreview 
                        colors={preset.colors} 
                        isDefault={presetKey === 'default'}
                        themeColor={themeColor}
                      />
                      
                      {/* Label */}
                      <div className="mt-2 text-left">
                        <div className="text-sm font-semibold text-white">
                          {preset.emoji} {preset.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 border-t border-white/10 bg-black/30 backdrop-blur-md">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--theme-primary)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
