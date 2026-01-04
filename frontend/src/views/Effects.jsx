import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Sparkles, TreePine, Stars, Waves, X, Palette } from 'lucide-react';
import ApplyTargetModal from '../components/ApplyTargetModal';

// Color presets for effects
const COLOR_PRESETS = [
  { name: 'Red', color: '#ff0000', rgb: { r: 255, g: 0, b: 0 } },
  { name: 'Orange', color: '#ff8000', rgb: { r: 255, g: 128, b: 0 } },
  { name: 'Yellow', color: '#ffff00', rgb: { r: 255, g: 255, b: 0 } },
  { name: 'Green', color: '#00ff00', rgb: { r: 0, g: 255, b: 0 } },
  { name: 'Cyan', color: '#00ffff', rgb: { r: 0, g: 255, b: 255 } },
  { name: 'Blue', color: '#0000ff', rgb: { r: 0, g: 0, b: 255 } },
  { name: 'Purple', color: '#8000ff', rgb: { r: 128, g: 0, b: 255 } },
  { name: 'Magenta', color: '#ff00ff', rgb: { r: 255, g: 0, b: 255 } },
  { name: 'White', color: '#ffffff', rgb: { r: 255, g: 255, b: 255 } },
  { name: 'Warm', color: '#ffaa55', rgb: { r: 255, g: 170, b: 85 } },
];

// Color schemes for effects
const COLOR_SCHEMES = [
  { name: 'Christmas', colors: ['#ff0000', '#00ff00'], description: 'Red & Green' },
  { name: 'Ocean', colors: ['#0066ff', '#00ffff'], description: 'Blue & Cyan' },
  { name: 'Sunset', colors: ['#ff4500', '#ffff00'], description: 'Orange & Yellow' },
  { name: 'Galaxy', colors: ['#8000ff', '#ff00ff'], description: 'Purple & Magenta' },
  { name: 'Fire', colors: ['#ff0000', '#ff8000'], description: 'Red & Orange' },
  { name: 'Ice', colors: ['#00ffff', '#ffffff'], description: 'Cyan & White' },
  { name: 'Rainbow', colors: ['#ff0000', '#00ff00', '#0000ff'], description: 'RGB' },
  { name: 'Warm White', colors: ['#ffaa55', '#ffffff'], description: 'Amber & White' },
];

// Available effects from the backend
const EFFECTS = [
  {
    id: 'christmas',
    name: 'Christmas Stagger',
    description: 'Staggered holiday light pattern',
    icon: TreePine,
    iconColor: 'text-green-400',
    endpoint: '/api/effects/christmas',
    supportsScheme: true,
    defaultScheme: 'Christmas',
  },
  {
    id: 'twinkle',
    name: 'Random Twinkle',
    description: 'Sparkling random lights',
    icon: Stars,
    iconColor: 'text-yellow-400',
    endpoint: '/api/effects/twinkle',
    supportsScheme: true,
    supportsColor: true,
    defaultScheme: 'Rainbow',
  },
  {
    id: 'smooth',
    name: 'Smooth Chase',
    description: 'Flowing color wave',
    icon: Sparkles,
    iconColor: 'text-purple-400',
    endpoint: '/api/effects/smooth',
    supportsScheme: true,
    supportsColor: true,
    defaultScheme: 'Ocean',
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Cascading wave effect',
    icon: Waves,
    iconColor: 'text-cyan-400',
    endpoint: '/api/effects/wave',
    supportsScheme: true,
    supportsColor: true,
    defaultScheme: 'Sunset',
  },
];

const AETHER_CORE_URL = `http://${window.location.hostname}:8891`;

// Effect Card Component
function EffectCard({ effect, isActive, onPlay, onStop, onLongPress }) {
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const IconComponent = effect.icon;

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress?.(effect);
    }, 500);
  };

  const handleEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(pressTimer.current);
    if (!didLongPress.current) {
      if (isActive) {
        onStop(effect);
      } else {
        onPlay(effect);
      }
    }
  };

  const handleCancel = () => clearTimeout(pressTimer.current);

  return (
    <div
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchMove={handleCancel}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      style={{ touchAction: 'manipulation' }}
      className={`control-card ${isActive ? 'active playing' : ''}`}
    >
      <div className="card-icon">
        {isActive ? (
          <Square size={18} />
        ) : (
          <IconComponent size={20} className={effect.iconColor} />
        )}
      </div>
      <div className="card-info">
        <div className="card-title">{effect.name}</div>
        <div className="card-meta">
          <span>{effect.description}</span>
        </div>
      </div>
    </div>
  );
}

// Color/Scheme Selection Modal
function ColorSchemeModal({ effect, onConfirm, onCancel }) {
  const [mode, setMode] = useState('scheme'); // 'scheme' or 'color'
  const [selectedScheme, setSelectedScheme] = useState(
    COLOR_SCHEMES.find(s => s.name === effect.defaultScheme) || COLOR_SCHEMES[0]
  );
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);

  const handleConfirm = () => {
    if (mode === 'scheme') {
      onConfirm({ type: 'scheme', scheme: selectedScheme });
    } else {
      onConfirm({ type: 'color', color: selectedColor });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[9998] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#0d0d1a] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <effect.icon className={`w-6 h-6 ${effect.iconColor}`} />
            <div>
              <h3 className="text-white font-bold">{effect.name}</h3>
              <p className="text-white/50 text-xs">Choose colors</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-white/10"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setMode('scheme')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              mode === 'scheme'
                ? 'text-white border-b-2 border-[var(--theme-primary)]'
                : 'text-white/40'
            }`}
          >
            Color Schemes
          </button>
          {effect.supportsColor && (
            <button
              onClick={() => setMode('color')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                mode === 'color'
                  ? 'text-white border-b-2 border-[var(--theme-primary)]'
                  : 'text-white/40'
              }`}
            >
              Single Color
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 max-h-[50vh] overflow-auto">
          {mode === 'scheme' ? (
            <div className="grid grid-cols-2 gap-3">
              {COLOR_SCHEMES.map(scheme => {
                const isSelected = selectedScheme.name === scheme.name;
                return (
                  <button
                    key={scheme.name}
                    onClick={() => setSelectedScheme(scheme)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10'
                        : 'border-transparent bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex gap-1 mb-2 justify-center">
                      {scheme.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="text-white text-sm font-bold">{scheme.name}</div>
                    <div className="text-white/40 text-xs">{scheme.description}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {COLOR_PRESETS.map(preset => {
                const isSelected = selectedColor.name === preset.name;
                return (
                  <button
                    key={preset.name}
                    onClick={() => setSelectedColor(preset)}
                    className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${
                      isSelected
                        ? 'border-white scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.color }}
                  >
                    <span className="text-[10px] font-bold text-shadow"
                      style={{
                        color: ['White', 'Yellow', 'Cyan', 'Warm'].includes(preset.name) ? '#000' : '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/10">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center justify-center gap-2"
          >
            <Palette size={16} /> Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Effects Page
export default function Effects() {
  const navigate = useNavigate();
  const [activeEffect, setActiveEffect] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState(null); // For color modal
  const [pendingEffect, setPendingEffect] = useState(null); // Preserved for target modal
  const [colorSelection, setColorSelection] = useState(null);
  const [showTargetModal, setShowTargetModal] = useState(false);

  // Stop all effects
  const handleStop = async () => {
    try {
      await fetch(`${AETHER_CORE_URL}/api/effects/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setActiveEffect(null);
    } catch (e) {
      console.error('Failed to stop effect:', e);
    }
  };

  // Handle effect card tap - show color selection
  const handlePlay = (effect) => {
    setSelectedEffect(effect);
  };

  // Handle color/scheme selected - show target modal
  const handleColorConfirm = (selection) => {
    setColorSelection(selection);
    setPendingEffect(selectedEffect); // Preserve effect for target modal
    setSelectedEffect(null);
    setShowTargetModal(true);
  };

  // Handle target confirmed - start the effect
  const handleTargetConfirm = async (item, options) => {
    const effect = pendingEffect;
    if (!effect) return;

    setShowTargetModal(false);

    // Build request body based on color selection
    const body = {
      universes: options.universes,
    };

    if (colorSelection?.type === 'scheme') {
      body.colors = colorSelection.scheme.colors;
    } else if (colorSelection?.type === 'color') {
      body.color = colorSelection.color.rgb;
    }

    try {
      const response = await fetch(`${AETHER_CORE_URL}${effect.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setActiveEffect(effect.id);
      }
    } catch (e) {
      console.error('Failed to start effect:', e);
    }

    setColorSelection(null);
    setPendingEffect(null);
  };

  // Cancel target modal
  const handleTargetCancel = () => {
    setShowTargetModal(false);
    setColorSelection(null);
    setPendingEffect(null);
  };

  return (
    <div className="fullscreen-view">
      {/* Header */}
      <div className="view-header">
        <div className="flex items-center gap-2">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Effects</h1>
            <p className="text-[10px] text-white/50">{EFFECTS.length} available</p>
          </div>
        </div>
        {activeEffect && (
          <button
            onClick={handleStop}
            className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 font-bold flex items-center gap-1 text-sm"
          >
            <Square size={16} /> Stop
          </button>
        )}
      </div>

      {/* Effects Grid */}
      <div className="view-content">
        <div className="control-grid">
          {EFFECTS.map(effect => (
            <EffectCard
              key={effect.id}
              effect={effect}
              isActive={activeEffect === effect.id}
              onPlay={handlePlay}
              onStop={handleStop}
            />
          ))}
        </div>
      </div>

      {/* Color/Scheme Selection Modal */}
      {selectedEffect && (
        <ColorSchemeModal
          effect={selectedEffect}
          onConfirm={handleColorConfirm}
          onCancel={() => setSelectedEffect(null)}
        />
      )}

      {/* Apply Target Modal */}
      {showTargetModal && pendingEffect && (
        <ApplyTargetModal
          mode="scene"
          item={{
            id: pendingEffect.id,
            name: pendingEffect.name,
          }}
          onConfirm={handleTargetConfirm}
          onCancel={handleTargetCancel}
        />
      )}
    </div>
  );
}

export const EffectsHeaderExtension = () => null;
