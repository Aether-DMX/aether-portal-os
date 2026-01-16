import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Play, Square, Trash2, Edit3, ChevronLeft, ChevronRight,
  Grid3X3, Layers, Waves, Zap, Settings2, Power
} from 'lucide-react';
import usePixelArrayStore from '../store/pixelArrayStore';
import { useDesktop } from '../components/desktop/DesktopShell';

// Effect types available
const EFFECT_TYPES = [
  { id: 'none', label: 'None', icon: Power },
  { id: 'wave', label: 'Wave', icon: Waves },
  { id: 'chase', label: 'Chase', icon: Zap },
  { id: 'bounce', label: 'Bounce', icon: Layers },
  { id: 'rainbow_wave', label: 'Rainbow', icon: Grid3X3 },
];

// Mode types
const MODE_TYPES = [
  { id: 'grouped', label: 'Grouped', description: 'All fixtures same color' },
  { id: 'pixel_array', label: 'Pixel Array', description: 'Independent control' },
];

// Color presets for quick selection
const COLOR_PRESETS = [
  { r: 255, g: 0, b: 0, w: 0, label: 'Red' },
  { r: 0, g: 255, b: 0, w: 0, label: 'Green' },
  { r: 0, g: 0, b: 255, w: 0, label: 'Blue' },
  { r: 255, g: 255, b: 0, w: 0, label: 'Yellow' },
  { r: 255, g: 0, b: 255, w: 0, label: 'Magenta' },
  { r: 0, g: 255, b: 255, w: 0, label: 'Cyan' },
  { r: 255, g: 255, b: 255, w: 0, label: 'White RGB' },
  { r: 0, g: 0, b: 0, w: 255, label: 'White W' },
];

// Pixel Array Card Component
function PixelArrayCard({ array, arrayId, isRunning, onEdit, onPlay, onStop, onDelete, onLongPress }) {
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const fixtureCount = array.fixture_count || 0;
  const universe = array.universe || 1;
  const mode = array.mode || 'grouped';

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(array, arrayId);
    }, 500);
  };

  const handleEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(pressTimer.current);
    if (!didLongPress.current) {
      if (isRunning) {
        onStop(arrayId);
      } else {
        onPlay(array, arrayId);
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
      className={`control-card ${isRunning ? 'active playing' : ''}`}
    >
      <div className="card-icon">
        {isRunning ? <Square size={18} /> : <Play size={20} className="ml-0.5" />}
      </div>
      <div className="card-info">
        <div className="card-title">{arrayId}</div>
        <div className="card-meta">
          <span>U{universe}</span>
          <span>•</span>
          <span>{fixtureCount} fixtures</span>
          <span>•</span>
          <span>{mode}</span>
        </div>
      </div>
    </div>
  );
}

// Create/Edit Modal
function PixelArrayEditor({ array, arrayId, onClose, onSave }) {
  const [config, setConfig] = useState({
    array_id: arrayId || '',
    fixture_count: array?.fixture_count || 5,
    universe: array?.universe || 1,
    start_channel: array?.start_channel || 1,
    channel_spacing: array?.channel_spacing || 4,
  });

  const handleSave = () => {
    if (!config.array_id.trim()) {
      alert('Please enter an array ID');
      return;
    }
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-white/10">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">
            {arrayId ? 'Edit Pixel Array' : 'Create Pixel Array'}
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Array ID */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Array ID</label>
            <input
              type="text"
              value={config.array_id}
              onChange={(e) => setConfig({ ...config, array_id: e.target.value })}
              placeholder="e.g., stage-front"
              disabled={!!arrayId}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 disabled:opacity-50"
            />
          </div>

          {/* Universe */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Universe</label>
            <input
              type="number"
              min="1"
              max="64"
              value={config.universe}
              onChange={(e) => setConfig({ ...config, universe: parseInt(e.target.value) || 1 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Fixture Count */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Fixture Count</label>
            <input
              type="number"
              min="1"
              max="128"
              value={config.fixture_count}
              onChange={(e) => setConfig({ ...config, fixture_count: parseInt(e.target.value) || 1 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Start Channel */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Start Channel</label>
            <input
              type="number"
              min="1"
              max="512"
              value={config.start_channel}
              onChange={(e) => setConfig({ ...config, start_channel: parseInt(e.target.value) || 1 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Channel Spacing */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Channel Spacing (per fixture)</label>
            <input
              type="number"
              min="1"
              max="64"
              value={config.channel_spacing}
              onChange={(e) => setConfig({ ...config, channel_spacing: parseInt(e.target.value) || 4 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            />
            <p className="text-xs text-white/40 mt-1">
              DMX addresses: {config.start_channel}, {config.start_channel + config.channel_spacing}, {config.start_channel + config.channel_spacing * 2}...
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold"
          >
            {arrayId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Control Panel for a pixel array
function PixelArrayControlPanel({ array, arrayId, onClose }) {
  const { setMode, setAllPixels, setEffect, startEffect, stopEffect, blackout, fetchPixelArrays } = usePixelArrayStore();
  const [selectedMode, setSelectedMode] = useState(array?.mode || 'grouped');
  const [selectedEffect, setSelectedEffect] = useState(array?.effect_type || 'none');
  const [effectSpeed, setEffectSpeed] = useState(1.0);
  const [selectedColor, setSelectedColor] = useState({ r: 255, g: 0, b: 0, w: 0 });
  const isRunning = array?.is_running || false;

  const handleModeChange = async (mode) => {
    setSelectedMode(mode);
    await setMode(arrayId, mode);
  };

  const handleColorApply = async (color) => {
    setSelectedColor(color);
    await setAllPixels(arrayId, color.r, color.g, color.b, color.w);
  };

  const handleEffectChange = async (effectType) => {
    setSelectedEffect(effectType);
    if (effectType === 'none') {
      await stopEffect(arrayId);
    } else {
      await setEffect(arrayId, effectType, {
        color: selectedColor,
        speed: effectSpeed,
      });
    }
  };

  const handleStartStop = async () => {
    if (isRunning) {
      await stopEffect(arrayId);
    } else {
      await startEffect(arrayId);
    }
  };

  const handleBlackout = async () => {
    await blackout(arrayId);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{arrayId}</h3>
            <p className="text-sm text-white/50">
              U{array?.universe} • {array?.fixture_count} fixtures • Ch {array?.start_channel}
            </p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {MODE_TYPES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedMode === mode.id
                      ? 'bg-[var(--theme-primary)] text-black'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  <div className="font-bold text-sm">{mode.label}</div>
                  <div className="text-xs opacity-60">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Color Presets</label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => handleColorApply(color)}
                  className="aspect-square rounded-xl border-2 border-white/10 hover:border-white/30 transition-all relative group"
                  style={{
                    background: color.w > 0
                      ? `rgba(255, 255, 255, ${color.w / 255})`
                      : `rgb(${color.r}, ${color.g}, ${color.b})`
                  }}
                  title={color.label}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-xl">
                    {color.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Effect Selection */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Effect</label>
            <div className="grid grid-cols-3 gap-2">
              {EFFECT_TYPES.map((effect) => {
                const Icon = effect.icon;
                return (
                  <button
                    key={effect.id}
                    onClick={() => handleEffectChange(effect.id)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      selectedEffect === effect.id
                        ? 'bg-[var(--theme-primary)] text-black'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-bold">{effect.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Effect Speed */}
          {selectedEffect !== 'none' && (
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Speed: {effectSpeed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={effectSpeed}
                onChange={(e) => setEffectSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleStartStop}
              className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                isRunning
                  ? 'bg-red-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
            >
              {isRunning ? <Square size={20} /> : <Play size={20} />}
              {isRunning ? 'Stop' : 'Start'}
            </button>
            <button
              onClick={handleBlackout}
              className="py-3 rounded-xl bg-gray-700 text-white font-bold flex items-center justify-center gap-2"
            >
              <Power size={20} />
              Blackout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Context Menu for Long Press
function CardContextMenu({ item, arrayId, onEdit, onDelete, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-72 border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-bold truncate">{arrayId}</h3>
          <p className="text-white/50 text-sm">Pixel Array</p>
        </div>
        <div className="p-2">
          <button
            onClick={() => { onEdit(item, arrayId); onClose(); }}
            className="w-full p-3 rounded-xl text-left text-white flex items-center gap-3 hover:bg-white/10"
          >
            <Edit3 size={20} /> Edit Configuration
          </button>
          <button
            onClick={() => { onDelete(arrayId); onClose(); }}
            className="w-full p-3 rounded-xl text-left text-red-400 flex items-center gap-3 hover:bg-red-500/10"
          >
            <Trash2 size={20} /> Delete Array
          </button>
        </div>
        <div className="p-2 border-t border-white/10">
          <button onClick={onClose} className="w-full p-3 rounded-xl text-white/50 hover:bg-white/5">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Main PixelArrays Component
export default function PixelArrays() {
  const navigate = useNavigate();
  const { pixelArrays, fetchPixelArrays, createPixelArray, deletePixelArray, isEffectRunning, startEffect, stopEffect } = usePixelArrayStore();
  const [editingArray, setEditingArray] = useState(null);
  const [editingArrayId, setEditingArrayId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [controlPanel, setControlPanel] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Responsive detection
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 800);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isDesktop = windowWidth >= 1024;

  const arrayEntries = Object.entries(pixelArrays);
  const ARRAYS_PER_PAGE = isDesktop ? 50 : 15;
  const totalPages = Math.ceil(arrayEntries.length / ARRAYS_PER_PAGE);
  const paginatedArrays = arrayEntries.slice(currentPage * ARRAYS_PER_PAGE, (currentPage + 1) * ARRAYS_PER_PAGE);

  useEffect(() => {
    fetchPixelArrays();
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchPixelArrays, 2000);
    return () => clearInterval(interval);
  }, [fetchPixelArrays]);

  const handleCreate = () => {
    setEditingArray(null);
    setEditingArrayId(null);
    setIsCreating(true);
  };

  const handleEdit = (array, arrayId) => {
    setEditingArray(array);
    setEditingArrayId(arrayId);
    setIsCreating(true);
  };

  const handleSave = async (config) => {
    try {
      await createPixelArray(config);
      setIsCreating(false);
      setEditingArray(null);
      setEditingArrayId(null);
    } catch (err) {
      console.error('Failed to save pixel array:', err);
      alert('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (arrayId) => {
    if (confirm(`Delete pixel array "${arrayId}"?`)) {
      await deletePixelArray(arrayId);
    }
  };

  const handlePlay = (array, arrayId) => {
    setControlPanel({ array, arrayId });
  };

  const handleStop = async (arrayId) => {
    await stopEffect(arrayId);
  };

  // Desktop view
  if (isDesktop) {
    return (
      <DesktopPixelArraysView
        arrayEntries={arrayEntries}
        paginatedArrays={paginatedArrays}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        isEffectRunning={isEffectRunning}
        handleCreate={handleCreate}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handlePlay={handlePlay}
        handleStop={handleStop}
        isCreating={isCreating}
        setIsCreating={setIsCreating}
        editingArray={editingArray}
        editingArrayId={editingArrayId}
        handleSave={handleSave}
        controlPanel={controlPanel}
        setControlPanel={setControlPanel}
        setEditingArray={setEditingArray}
        setEditingArrayId={setEditingArrayId}
      />
    );
  }

  // Kiosk view
  return (
    <div className="fullscreen-view">
      {/* Header */}
      <div className="view-header">
        <div className="flex items-center gap-2">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Pixel Arrays</h1>
            <p className="text-[10px] text-white/50">{arrayEntries.length} arrays</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="px-3 py-2 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-1 text-sm"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Array Grid */}
      <div className="view-content">
        {arrayEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Grid3X3 size={32} className="text-white/30" />
            </div>
            <p className="text-white/50 text-sm mb-1">No pixel arrays yet</p>
            <p className="text-white/30 text-xs mb-4">Configure fixture groups for pixel-style control</p>
            <button
              onClick={handleCreate}
              className="px-5 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-2 text-sm"
            >
              <Plus size={18} /> Create Array
            </button>
          </div>
        ) : (
          <>
            <div className="control-grid">
              {paginatedArrays.map(([arrayId, array]) => (
                <PixelArrayCard
                  key={arrayId}
                  array={array}
                  arrayId={arrayId}
                  isRunning={isEffectRunning(arrayId)}
                  onEdit={handleEdit}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  onDelete={handleDelete}
                  onLongPress={(arr, id) => setContextMenu({ array: arr, arrayId: id })}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="w-11 h-11 rounded-xl bg-white/10 text-white disabled:opacity-30 flex items-center justify-center"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        currentPage === i
                          ? 'bg-[var(--theme-primary)] text-black scale-105'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="w-11 h-11 rounded-xl bg-white/10 text-white disabled:opacity-30 flex items-center justify-center"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Editor Modal */}
      {isCreating && (
        <PixelArrayEditor
          array={editingArray}
          arrayId={editingArrayId}
          onClose={() => { setIsCreating(false); setEditingArray(null); setEditingArrayId(null); }}
          onSave={handleSave}
        />
      )}

      {/* Control Panel */}
      {controlPanel && (
        <PixelArrayControlPanel
          array={controlPanel.array}
          arrayId={controlPanel.arrayId}
          onClose={() => setControlPanel(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <CardContextMenu
          item={contextMenu.array}
          arrayId={contextMenu.arrayId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

// Desktop View Component
function DesktopPixelArraysView({
  arrayEntries,
  paginatedArrays,
  currentPage,
  totalPages,
  setCurrentPage,
  isEffectRunning,
  handleCreate,
  handleEdit,
  handleDelete,
  handlePlay,
  handleStop,
  isCreating,
  setIsCreating,
  editingArray,
  editingArrayId,
  handleSave,
  controlPanel,
  setControlPanel,
  setEditingArray,
  setEditingArrayId,
}) {
  const desktopContext = useDesktop();
  const { setHoveredItem, setSelectedItem, selectedItem } = desktopContext || {};

  return (
    <div className="desktop-pixel-arrays">
      {/* Header */}
      <div className="arrays-header">
        <div className="header-left">
          <h1 className="page-title">Pixel Arrays</h1>
          <span className="page-count">{arrayEntries.length} arrays</span>
        </div>
        <div className="header-right">
          <button className="create-btn" onClick={handleCreate}>
            <Plus size={18} />
            <span>New Array</span>
          </button>
        </div>
      </div>

      {/* Array Grid */}
      <div className="arrays-content">
        {arrayEntries.length === 0 ? (
          <div className="empty-state">
            <Grid3X3 size={48} className="empty-icon" />
            <h3>No pixel arrays yet</h3>
            <p>Configure fixture groups for pixel-style control</p>
            <button className="create-btn" onClick={handleCreate}>
              <Plus size={18} />
              <span>Create Array</span>
            </button>
          </div>
        ) : (
          <div className="arrays-grid">
            {paginatedArrays.map(([arrayId, array]) => {
              const isRunning = isEffectRunning(arrayId);
              const isSelected = selectedItem?.arrayId === arrayId;

              return (
                <div
                  key={arrayId}
                  className={`array-card ${isRunning ? 'running' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedItem?.({ array, arrayId })}
                  onDoubleClick={() => handlePlay(array, arrayId)}
                  onMouseEnter={() => setHoveredItem?.({ array, arrayId })}
                  onMouseLeave={() => setHoveredItem?.(null)}
                >
                  <div className="array-preview">
                    {isRunning ? (
                      <div className="running-indicator">
                        <span className="pulse-ring" />
                        <Square size={24} />
                      </div>
                    ) : (
                      <Grid3X3 size={28} className="array-icon-large" />
                    )}
                  </div>

                  <div className="array-info">
                    <span className="array-name">{arrayId}</span>
                    <div className="array-meta">
                      <span>U{array.universe}</span>
                      <span>•</span>
                      <span>{array.fixture_count} fixtures</span>
                      <span>•</span>
                      <span>Ch {array.start_channel}</span>
                    </div>
                  </div>

                  <div className="array-actions">
                    <button
                      className="action-btn play"
                      onClick={(e) => { e.stopPropagation(); handlePlay(array, arrayId); }}
                      title="Control array"
                    >
                      <Settings2 size={16} />
                    </button>
                    <button
                      className="action-btn"
                      onClick={(e) => { e.stopPropagation(); handleEdit(array, arrayId); }}
                      title="Edit array"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={(e) => { e.stopPropagation(); handleDelete(arrayId); }}
                      title="Delete array"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="page-btn"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="page-info">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="page-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isCreating && (
        <PixelArrayEditor
          array={editingArray}
          arrayId={editingArrayId}
          onClose={() => { setIsCreating(false); setEditingArray(null); setEditingArrayId(null); }}
          onSave={handleSave}
        />
      )}

      {/* Control Panel */}
      {controlPanel && (
        <PixelArrayControlPanel
          array={controlPanel.array}
          arrayId={controlPanel.arrayId}
          onClose={() => setControlPanel(null)}
        />
      )}

      <style>{`
        .desktop-pixel-arrays {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 24px;
        }

        .arrays-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .page-count {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
        }

        .create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--theme-primary, #00ffaa);
          color: #000;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .create-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .arrays-content {
          flex: 1;
          overflow: auto;
        }

        .arrays-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .array-card {
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.15s;
        }

        .array-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .array-card.selected {
          border-color: var(--theme-primary, #00ffaa);
          background: rgba(0, 255, 170, 0.05);
        }

        .array-card.running {
          border-color: #22c55e;
        }

        .array-preview {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(0, 255, 170, 0.1), rgba(255, 255, 255, 0.02));
        }

        .array-icon-large {
          color: rgba(0, 255, 170, 0.5);
        }

        .running-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
        }

        .pulse-ring {
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid #22c55e;
          animation: pulse-ring 1.5s ease-out infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .array-info {
          padding: 12px 14px;
        }

        .array-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .array-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .array-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .array-card:hover .array-actions {
          opacity: 1;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .action-btn:hover {
          background: white;
          color: #000;
          transform: scale(1.05);
        }

        .action-btn.play:hover {
          background: var(--theme-primary, #00ffaa);
          color: #000;
        }

        .action-btn.delete:hover {
          background: #ef4444;
          color: white;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
        }

        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.3;
          color: var(--theme-primary, #00ffaa);
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 8px;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0 0 24px;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .page-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .page-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
