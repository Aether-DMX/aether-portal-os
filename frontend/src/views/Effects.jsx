import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Sparkles, TreePine, Stars, Waves, X, Palette, Zap, Sun, Moon, Flame, Settings, ChevronDown } from 'lucide-react';
import ApplyTargetModal from '../components/ApplyTargetModal';

// Color presets for effects
const COLOR_PRESETS = [
  { name: 'Red', color: '#ff0000', rgb: [255, 0, 0, 0] },
  { name: 'Orange', color: '#ff8000', rgb: [255, 128, 0, 0] },
  { name: 'Yellow', color: '#ffff00', rgb: [255, 255, 0, 0] },
  { name: 'Green', color: '#00ff00', rgb: [0, 255, 0, 0] },
  { name: 'Cyan', color: '#00ffff', rgb: [0, 255, 255, 0] },
  { name: 'Blue', color: '#0000ff', rgb: [0, 0, 255, 0] },
  { name: 'Purple', color: '#8000ff', rgb: [128, 0, 255, 0] },
  { name: 'Magenta', color: '#ff00ff', rgb: [255, 0, 255, 0] },
  { name: 'White', color: '#ffffff', rgb: [255, 255, 255, 0] },
  { name: 'Warm', color: '#ffaa55', rgb: [255, 170, 85, 0] },
];

// Color schemes for effects
const COLOR_SCHEMES = [
  { name: 'Christmas', colors: ['#ff0000', '#00ff00'], description: 'Red & Green' },
  { name: 'Ocean', colors: ['#0066ff', '#00ffff'], description: 'Blue & Cyan' },
  { name: 'Sunset', colors: ['#ff4500', '#ffff00'], description: 'Orange & Yellow' },
  { name: 'Galaxy', colors: ['#8000ff', '#ff00ff'], description: 'Purple & Magenta' },
  { name: 'Fire', colors: ['#ff0000', '#ff8000'], description: 'Red & Orange' },
  { name: 'Ice', colors: ['#00ffff', '#ffffff'], description: 'Cyan & White' },
  { name: 'Rainbow', colors: ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'], description: 'Full Spectrum' },
  { name: 'Warm White', colors: ['#ffaa55', '#ffffff'], description: 'Amber & White' },
  { name: 'Cool Blue', colors: ['#0044ff', '#00aaff', '#00ffff'], description: 'Blues' },
  { name: 'Purple Haze', colors: ['#4400ff', '#8800ff', '#ff00ff'], description: 'Purples' },
];

// Available effects - organized by category
const EFFECTS = [
  // Pattern Effects
  {
    id: 'christmas',
    name: 'Christmas Stagger',
    description: 'Alternating holiday colors',
    icon: TreePine,
    iconColor: 'text-green-400',
    endpoint: '/api/effects/christmas',
    category: 'pattern',
    hasColors: false, // Uses hardcoded red/green
    hasSpeed: true,
    defaultParams: { fade_ms: 1500, hold_ms: 1000, stagger_ms: 300 },
  },
  {
    id: 'twinkle',
    name: 'Random Twinkle',
    description: 'Sparkling random lights',
    icon: Stars,
    iconColor: 'text-yellow-400',
    endpoint: '/api/effects/twinkle',
    category: 'pattern',
    hasColors: true,
    hasSpeed: true,
    defaultParams: { min_fade_ms: 500, max_fade_ms: 2000 },
  },
  {
    id: 'smooth',
    name: 'Smooth Chase',
    description: 'Flowing color transitions',
    icon: Sparkles,
    iconColor: 'text-purple-400',
    endpoint: '/api/effects/smooth',
    category: 'chase',
    hasColors: true,
    hasSpeed: true,
    defaultParams: { fade_ms: 1500, hold_ms: 500 },
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Cascading wave effect',
    icon: Waves,
    iconColor: 'text-cyan-400',
    endpoint: '/api/effects/wave',
    category: 'chase',
    hasColors: true,
    singleColor: true, // Only takes one color
    hasSpeed: true,
    defaultParams: { wave_speed_ms: 2000, tail_length: 2 },
  },
  // Intensity Effects (no colors needed)
  {
    id: 'strobe',
    name: 'Strobe',
    description: 'Fast flashing effect',
    icon: Zap,
    iconColor: 'text-white',
    endpoint: '/api/effects/strobe',
    category: 'intensity',
    hasColors: true,
    singleColor: true,
    hasSpeed: true,
    defaultParams: { on_ms: 50, off_ms: 50 },
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Breathing/pulsing lights',
    icon: Sun,
    iconColor: 'text-amber-400',
    endpoint: '/api/effects/pulse',
    category: 'intensity',
    hasColors: true,
    singleColor: true,
    hasSpeed: true,
    defaultParams: { pulse_ms: 2000, min_brightness: 0, max_brightness: 255 },
  },
  {
    id: 'fade',
    name: 'Color Fade',
    description: 'Slow color cycling',
    icon: Moon,
    iconColor: 'text-indigo-400',
    endpoint: '/api/effects/fade',
    category: 'ambient',
    hasColors: true,
    hasSpeed: true,
    defaultParams: { cycle_ms: 10000 },
  },
  {
    id: 'fire',
    name: 'Fire Flicker',
    description: 'Realistic fire simulation',
    icon: Flame,
    iconColor: 'text-orange-500',
    endpoint: '/api/effects/fire',
    category: 'ambient',
    hasColors: false, // Uses hardcoded fire colors
    hasSpeed: true,
    defaultParams: { intensity: 0.8 },
  },
];

const AETHER_CORE_URL = `http://${window.location.hostname}:8891`;

// Effect Card Component
function EffectCard({ effect, isActive, onPlay, onStop }) {
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const IconComponent = effect.icon;

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
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

// Effect Configuration Modal
function EffectConfigModal({ effect, onConfirm, onCancel }) {
  const [mode, setMode] = useState('scheme');
  const [selectedScheme, setSelectedScheme] = useState(COLOR_SCHEMES[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fixturesPerUniverse, setFixturesPerUniverse] = useState(2);
  const [channelsPerFixture, setChannelsPerFixture] = useState(4);
  const [speed, setSpeed] = useState('normal'); // slow, normal, fast

  const speedMultipliers = { slow: 2, normal: 1, fast: 0.5 };

  const handleConfirm = () => {
    const config = {
      fixturesPerUniverse,
      channelsPerFixture,
      speedMultiplier: speedMultipliers[speed],
    };

    if (effect.hasColors) {
      if (effect.singleColor) {
        config.color = selectedColor.rgb;
        config.colorHex = selectedColor.color;
      } else if (mode === 'scheme') {
        config.colors = selectedScheme.colors;
      } else {
        config.color = selectedColor.rgb;
        config.colorHex = selectedColor.color;
      }
    }

    onConfirm(config);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[9998] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#0d0d1a] rounded-2xl w-full max-w-md border border-white/10 overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <effect.icon className={`w-6 h-6 ${effect.iconColor}`} />
            <div>
              <h3 className="text-white font-bold">{effect.name}</h3>
              <p className="text-white/50 text-xs">{effect.description}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-white/10">
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Speed Selection */}
          {effect.hasSpeed && (
            <div>
              <div className="text-white/50 text-xs font-bold mb-2">SPEED</div>
              <div className="flex gap-2">
                {['slow', 'normal', 'fast'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                      speed === s
                        ? 'bg-[var(--theme-primary)] text-black'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {effect.hasColors && (
            <>
              {/* Mode Toggle (only if not single color) */}
              {!effect.singleColor && (
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => setMode('scheme')}
                    className={`flex-1 py-2 text-sm font-bold transition-colors ${
                      mode === 'scheme'
                        ? 'text-white border-b-2 border-[var(--theme-primary)]'
                        : 'text-white/40'
                    }`}
                  >
                    Color Schemes
                  </button>
                  <button
                    onClick={() => setMode('color')}
                    className={`flex-1 py-2 text-sm font-bold transition-colors ${
                      mode === 'color'
                        ? 'text-white border-b-2 border-[var(--theme-primary)]'
                        : 'text-white/40'
                    }`}
                  >
                    Single Color
                  </button>
                </div>
              )}

              {/* Scheme Selection */}
              {(!effect.singleColor && mode === 'scheme') && (
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_SCHEMES.map(scheme => {
                    const isSelected = selectedScheme.name === scheme.name;
                    return (
                      <button
                        key={scheme.name}
                        onClick={() => setSelectedScheme(scheme)}
                        className={`p-2 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10'
                            : 'border-transparent bg-white/5'
                        }`}
                      >
                        <div className="flex gap-1 mb-1 justify-center">
                          {scheme.colors.slice(0, 4).map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-white/20"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          {scheme.colors.length > 4 && (
                            <span className="text-white/40 text-xs">+{scheme.colors.length - 4}</span>
                          )}
                        </div>
                        <div className="text-white text-xs font-bold">{scheme.name}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Single Color Selection */}
              {(effect.singleColor || mode === 'color') && (
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PRESETS.map(preset => {
                    const isSelected = selectedColor.name === preset.name;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => setSelectedColor(preset)}
                        className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${
                          isSelected ? 'border-white scale-105' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: preset.color }}
                      >
                        <span
                          className="text-[9px] font-bold"
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
            </>
          )}

          {/* Advanced Settings */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full p-3 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-white/50" />
              <span className="text-white/70 text-sm font-bold">Fixture Settings</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-white/50 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>

          {showAdvanced && (
            <div className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <div className="text-white/50 text-xs mb-1">Fixtures per Universe</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 6, 8].map(n => (
                    <button
                      key={n}
                      onClick={() => setFixturesPerUniverse(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                        fixturesPerUniverse === n
                          ? 'bg-[var(--theme-primary)] text-black'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-white/50 text-xs mb-1">Channels per Fixture (RGBW)</div>
                <div className="flex gap-2">
                  {[3, 4, 5, 6, 8].map(n => (
                    <button
                      key={n}
                      onClick={() => setChannelsPerFixture(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                        channelsPerFixture === n
                          ? 'bg-[var(--theme-primary)] text-black'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-white/10 shrink-0">
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
            <Play size={16} /> Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Effects Page
export default function Effects() {
  const navigate = useNavigate();
  const [activeEffects, setActiveEffects] = useState([]);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [pendingEffect, setPendingEffect] = useState(null);
  const [effectConfig, setEffectConfig] = useState(null);
  const [showTargetModal, setShowTargetModal] = useState(false);

  // Poll for running effects
  useEffect(() => {
    const checkRunning = async () => {
      try {
        const res = await fetch(`${AETHER_CORE_URL}/api/effects`);
        const data = await res.json();
        setActiveEffects(data.running || []);
      } catch (e) {}
    };
    checkRunning();
    const interval = setInterval(checkRunning, 2000);
    return () => clearInterval(interval);
  }, []);

  // Stop all effects
  const handleStop = async () => {
    try {
      await fetch(`${AETHER_CORE_URL}/api/effects/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setActiveEffects([]);
    } catch (e) {
      console.error('Failed to stop effects:', e);
    }
  };

  // Handle effect card tap - show config modal
  const handlePlay = (effect) => {
    setSelectedEffect(effect);
  };

  // Handle config confirmed - show target modal
  const handleConfigConfirm = (config) => {
    setEffectConfig(config);
    setPendingEffect(selectedEffect);
    setSelectedEffect(null);
    setShowTargetModal(true);
  };

  // Handle target confirmed - start the effect
  const handleTargetConfirm = async (item, options) => {
    const effect = pendingEffect;
    if (!effect) return;

    setShowTargetModal(false);

    // Build request body
    const body = {
      universes: options.universes,
      fixtures_per_universe: effectConfig.fixturesPerUniverse,
      channels_per_fixture: effectConfig.channelsPerFixture,
    };

    // Apply speed multiplier to timing parameters
    const speedMult = effectConfig.speedMultiplier || 1;
    if (effect.defaultParams) {
      Object.entries(effect.defaultParams).forEach(([key, value]) => {
        if (key.includes('ms') || key.includes('speed')) {
          body[key] = Math.round(value * speedMult);
        } else {
          body[key] = value;
        }
      });
    }

    // Add colors based on effect type
    if (effectConfig.colors) {
      body.colors = effectConfig.colors;
    } else if (effectConfig.color) {
      body.color = effectConfig.color;
    }

    console.log('Starting effect:', effect.id, body);

    try {
      const response = await fetch(`${AETHER_CORE_URL}${effect.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Effect started:', data);
      } else {
        console.error('Effect failed:', await response.text());
      }
    } catch (e) {
      console.error('Failed to start effect:', e);
    }

    setEffectConfig(null);
    setPendingEffect(null);
  };

  // Cancel modals
  const handleConfigCancel = () => setSelectedEffect(null);
  const handleTargetCancel = () => {
    setShowTargetModal(false);
    setEffectConfig(null);
    setPendingEffect(null);
  };

  // Check if an effect is active
  const isEffectActive = (effectId) => {
    return activeEffects.some(id => id.includes(effectId));
  };

  // Group effects by category
  const categories = [
    { id: 'pattern', name: 'Patterns' },
    { id: 'chase', name: 'Chases' },
    { id: 'intensity', name: 'Intensity' },
    { id: 'ambient', name: 'Ambient' },
  ];

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
            <p className="text-[10px] text-white/50">
              {activeEffects.length > 0 ? `${activeEffects.length} running` : `${EFFECTS.length} available`}
            </p>
          </div>
        </div>
        {activeEffects.length > 0 && (
          <button
            onClick={handleStop}
            className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 font-bold flex items-center gap-1 text-sm"
          >
            <Square size={16} /> Stop All
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
              isActive={isEffectActive(effect.id)}
              onPlay={handlePlay}
              onStop={handleStop}
            />
          ))}
        </div>
      </div>

      {/* Effect Config Modal */}
      {selectedEffect && (
        <EffectConfigModal
          effect={selectedEffect}
          onConfirm={handleConfigConfirm}
          onCancel={handleConfigCancel}
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
