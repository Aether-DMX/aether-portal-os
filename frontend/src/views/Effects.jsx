import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Square, Sparkles, TreePine, Stars, Waves, X, Zap, Sun, Moon, Flame, Settings, ChevronDown, Check, Wifi, WifiOff, Layers } from 'lucide-react';
import useNodeStore from '../store/nodeStore';

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
  { name: 'White', color: '#ffffff', rgb: [255, 255, 255, 255] },
  { name: 'Warm', color: '#ffaa55', rgb: [255, 170, 85, 0] },
];

// Color schemes for effects
const COLOR_SCHEMES = [
  { name: 'Christmas', colors: ['#ff0000', '#00ff00'], rgb: [[255,0,0,0], [0,255,0,0]], description: 'Red & Green' },
  { name: 'Ocean', colors: ['#0066ff', '#00ffff'], rgb: [[0,102,255,0], [0,255,255,0]], description: 'Blue & Cyan' },
  { name: 'Sunset', colors: ['#ff4500', '#ffff00'], rgb: [[255,69,0,0], [255,255,0,0]], description: 'Orange & Yellow' },
  { name: 'Galaxy', colors: ['#8000ff', '#ff00ff'], rgb: [[128,0,255,0], [255,0,255,0]], description: 'Purple & Magenta' },
  { name: 'Fire', colors: ['#ff0000', '#ff8000'], rgb: [[255,0,0,0], [255,128,0,0]], description: 'Red & Orange' },
  { name: 'Ice', colors: ['#00ffff', '#ffffff'], rgb: [[0,255,255,0], [255,255,255,255]], description: 'Cyan & White' },
  { name: 'Rainbow', colors: ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'], rgb: [[255,0,0,0], [255,128,0,0], [255,255,0,0], [0,255,0,0], [0,255,255,0], [0,0,255,0], [255,0,255,0]], description: 'Full Spectrum' },
  { name: 'Warm White', colors: ['#ffaa55', '#ffffff'], rgb: [[255,170,85,0], [255,255,255,255]], description: 'Amber & White' },
  { name: 'Cool Blue', colors: ['#0044ff', '#00aaff', '#00ffff'], rgb: [[0,68,255,0], [0,170,255,0], [0,255,255,0]], description: 'Blues' },
  { name: 'Purple Haze', colors: ['#4400ff', '#8800ff', '#ff00ff'], rgb: [[68,0,255,0], [136,0,255,0], [255,0,255,0]], description: 'Purples' },
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
    hasColors: false,
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
    singleColor: true,
    hasSpeed: true,
    defaultParams: { wave_speed_ms: 2000, tail_length: 2 },
  },
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
    hasColors: false,
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

// Full-screen Effect Configuration Modal with Universe Selection
function EffectConfigModal({ effect, onConfirm, onCancel }) {
  const { nodes: rawNodes } = useNodeStore();
  const nodes = Array.isArray(rawNodes) ? rawNodes : [];

  // Step: 'config' or 'universe'
  const [step, setStep] = useState('config');

  // Config state
  const [colorMode, setColorMode] = useState('presets'); // 'presets' or 'schemes'
  const [selectedPreset, setSelectedPreset] = useState(COLOR_PRESETS[0]);
  const [selectedScheme, setSelectedScheme] = useState(COLOR_SCHEMES[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fixturesPerUniverse, setFixturesPerUniverse] = useState(2);
  const [channelsPerFixture, setChannelsPerFixture] = useState(4);
  const [speed, setSpeed] = useState('normal');

  // Universe state
  const [selectedUniverses, setSelectedUniverses] = useState([]);

  const speedMultipliers = { slow: 2, normal: 1, fast: 0.5 };

  // Build universe info
  const universeInfo = React.useMemo(() => {
    const fromNodes = [...new Set(nodes.map(n => n.universe || 1))].sort((a, b) => a - b);
    const allUniverses = fromNodes.length > 0 ? fromNodes : [1, 2, 3, 4, 5];

    return allUniverses.map(u => {
      const universeNodes = nodes.filter(n => n.universe === u);
      const onlineNodes = universeNodes.filter(n => n.status === 'online');
      return {
        universe: u,
        onlineCount: onlineNodes.length,
        totalCount: universeNodes.length,
        isOnline: onlineNodes.length > 0,
      };
    });
  }, [nodes]);

  const toggleUniverse = (u) => {
    setSelectedUniverses(prev =>
      prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
    );
  };

  const selectAllUniverses = () => setSelectedUniverses(universeInfo.map(u => u.universe));
  const selectOnlineOnly = () => setSelectedUniverses(universeInfo.filter(u => u.isOnline).map(u => u.universe));
  const selectNone = () => setSelectedUniverses([]);

  const handleNext = () => {
    setStep('universe');
  };

  const handleBack = () => {
    setStep('config');
  };

  const handleConfirm = () => {
    if (selectedUniverses.length === 0) return;

    const config = {
      fixturesPerUniverse,
      channelsPerFixture,
      speedMultiplier: speedMultipliers[speed],
      universes: selectedUniverses,
    };

    // Add colors based on effect type and selection
    if (effect.hasColors) {
      if (effect.singleColor) {
        // Single color effects use preset
        config.color = selectedPreset.rgb;
      } else if (colorMode === 'schemes') {
        // Multi-color effects can use scheme
        config.colors = selectedScheme.rgb;
      } else {
        // Or single preset color repeated
        config.color = selectedPreset.rgb;
      }
    }

    onConfirm(config);
  };

  const IconComponent = effect.icon;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[#0a0a0f] z-[9999] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0d0d12]">
        <div className="flex items-center gap-3">
          <button
            onClick={step === 'universe' ? handleBack : onCancel}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            {step === 'universe' ? <ArrowLeft className="w-5 h-5 text-white/60" /> : <X className="w-5 h-5 text-white/60" />}
          </button>
          <div className="flex items-center gap-2">
            <IconComponent className={`w-5 h-5 ${effect.iconColor}`} />
            <div>
              <h2 className="text-white font-bold text-base">{effect.name}</h2>
              <p className="text-white/50 text-xs">
                {step === 'config' ? 'Configure effect' : 'Select universes'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {step === 'config' ? (
          <div className="space-y-5">
            {/* Speed Selection */}
            {effect.hasSpeed && (
              <div>
                <div className="text-white/50 text-xs font-bold mb-2 uppercase">Speed</div>
                <div className="flex gap-2">
                  {['slow', 'normal', 'fast'].map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${
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
              <div>
                <div className="text-white/50 text-xs font-bold mb-2 uppercase">
                  {effect.singleColor ? 'Color' : 'Colors'}
                </div>

                {/* Mode Toggle for multi-color effects */}
                {!effect.singleColor && (
                  <div className="flex mb-3 border-b border-white/10">
                    <button
                      onClick={() => setColorMode('presets')}
                      className={`flex-1 py-2 text-sm font-bold transition-colors ${
                        colorMode === 'presets'
                          ? 'text-white border-b-2 border-[var(--theme-primary)]'
                          : 'text-white/40'
                      }`}
                    >
                      Single Color
                    </button>
                    <button
                      onClick={() => setColorMode('schemes')}
                      className={`flex-1 py-2 text-sm font-bold transition-colors ${
                        colorMode === 'schemes'
                          ? 'text-white border-b-2 border-[var(--theme-primary)]'
                          : 'text-white/40'
                      }`}
                    >
                      Color Schemes
                    </button>
                  </div>
                )}

                {/* Color Presets Grid */}
                {(effect.singleColor || colorMode === 'presets') && (
                  <div className="grid grid-cols-5 gap-3">
                    {COLOR_PRESETS.map(preset => {
                      const isSelected = selectedPreset.name === preset.name;
                      return (
                        <button
                          key={preset.name}
                          onClick={() => setSelectedPreset(preset)}
                          className={`aspect-square rounded-xl border-3 transition-all flex items-center justify-center ${
                            isSelected ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: preset.color }}
                        >
                          {isSelected && (
                            <Check size={20} className={preset.name === 'White' || preset.name === 'Yellow' || preset.name === 'Cyan' ? 'text-black' : 'text-white'} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Color Schemes Grid */}
                {!effect.singleColor && colorMode === 'schemes' && (
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
                              : 'border-transparent bg-white/5'
                          }`}
                        >
                          <div className="flex gap-1 mb-2 justify-center">
                            {scheme.colors.slice(0, 5).map((color, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full border border-white/20"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                            {scheme.colors.length > 5 && (
                              <span className="text-white/40 text-xs self-center">+{scheme.colors.length - 5}</span>
                            )}
                          </div>
                          <div className="text-white text-sm font-bold">{scheme.name}</div>
                          <div className="text-white/40 text-xs">{scheme.description}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Advanced Settings */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-white/50" />
                <span className="text-white/70 text-sm font-bold">Fixture Settings</span>
              </div>
              <ChevronDown
                size={18}
                className={`text-white/50 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {showAdvanced && (
              <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-white/50 text-xs mb-2">Fixtures per Universe</div>
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
                  <div className="text-white/50 text-xs mb-2">Channels per Fixture</div>
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
        ) : (
          /* Universe Selection */
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={selectAllUniverses}
                className="flex-1 py-2 px-3 rounded-xl bg-white/5 text-white/70 text-xs font-bold hover:bg-white/10 transition-colors"
              >
                All
              </button>
              <button
                onClick={selectOnlineOnly}
                className="flex-1 py-2 px-3 rounded-xl bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-colors"
              >
                Online Only
              </button>
              <button
                onClick={selectNone}
                className="flex-1 py-2 px-3 rounded-xl bg-white/5 text-white/70 text-xs font-bold hover:bg-white/10 transition-colors"
              >
                None
              </button>
            </div>

            {/* Universe Grid */}
            <div className="grid grid-cols-2 gap-3">
              {universeInfo.map(info => {
                const isSelected = selectedUniverses.includes(info.universe);
                return (
                  <button
                    key={info.universe}
                    onClick={() => toggleUniverse(info.universe)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]'
                        : 'bg-white/5 border-transparent hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-white">U{info.universe}</span>
                      <div className="flex items-center gap-1">
                        {isSelected && <Check size={16} className="text-[var(--theme-primary)]" />}
                        {info.isOnline ? (
                          <Wifi size={14} className="text-green-400" />
                        ) : (
                          <WifiOff size={14} className="text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-white/50">
                        {info.onlineCount}/{info.totalCount} nodes online
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-[#0d0d12] p-4 space-y-3">
        {step === 'universe' && (
          <div className="text-center text-xs">
            {selectedUniverses.length === 0 ? (
              <span className="text-red-400">Select at least one universe</span>
            ) : (
              <span className="text-white/50">
                {selectedUniverses.length} universe{selectedUniverses.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={step === 'universe' ? handleBack : onCancel}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold text-sm"
          >
            {step === 'universe' ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={step === 'config' ? handleNext : handleConfirm}
            disabled={step === 'universe' && selectedUniverses.length === 0}
            className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              step === 'universe' && selectedUniverses.length === 0
                ? 'bg-white/20 text-white/40 cursor-not-allowed'
                : 'bg-[var(--theme-primary)] text-black'
            }`}
          >
            {step === 'config' ? (
              <>
                <Layers size={16} /> Select Universes
              </>
            ) : (
              <>
                <Play size={16} /> Start Effect
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Main Effects Page
export default function Effects() {
  const navigate = useNavigate();
  const [activeEffects, setActiveEffects] = useState([]);
  const [selectedEffect, setSelectedEffect] = useState(null);

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

  // Handle config confirmed - start the effect
  const handleConfigConfirm = async (config) => {
    const effect = selectedEffect;
    if (!effect) return;

    setSelectedEffect(null);

    // Build request body
    const body = {
      universes: config.universes,
      fixtures_per_universe: config.fixturesPerUniverse,
      channels_per_fixture: config.channelsPerFixture,
    };

    // Apply speed multiplier to timing parameters
    const speedMult = config.speedMultiplier || 1;
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
    if (config.colors) {
      body.colors = config.colors;
    } else if (config.color) {
      body.color = config.color;
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
  };

  // Cancel modal
  const handleConfigCancel = () => setSelectedEffect(null);

  // Check if an effect is active
  const isEffectActive = (effectId) => {
    return activeEffects.some(id => id.includes(effectId));
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

      {/* Effect Config Modal (Fullscreen) */}
      {selectedEffect && (
        <EffectConfigModal
          effect={selectedEffect}
          onConfirm={handleConfigConfirm}
          onCancel={handleConfigCancel}
        />
      )}
    </div>
  );
}

export const EffectsHeaderExtension = () => null;
