import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Play, Square, Trash2, Edit3, ChevronLeft, ChevronRight,
  Layers, SkipBack, SkipForward, List, Check, Clock
} from 'lucide-react';
import useCueStackStore from '../store/cueStackStore';
import useLookStore from '../store/lookStore';

// ============================================================
// Cue Stack Card Component - Adapts to desktop/kiosk
// ============================================================
function CueStackCard({ stack, isActive, onSelect, onLongPress, isDesktop = false }) {
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const cueCount = stack.cues?.length || 0;

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(stack);
    }, 500);
  };

  const handleEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(pressTimer.current);
    if (!didLongPress.current) {
      onSelect(stack);
    }
  };

  const handleCancel = () => clearTimeout(pressTimer.current);

  if (isDesktop) {
    return (
      <div
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleCancel}
        className={`group p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
          isActive
            ? 'border-[var(--theme-primary)]/50 bg-[var(--theme-primary)]/10'
            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
        }`}
        style={{ minHeight: '90px' }}
      >
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isActive ? 'bg-[var(--theme-primary)] text-black' : 'bg-white/10 text-white/70'
          }`}>
            {isActive ? <Check size={24} /> : <Layers size={24} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm truncate group-hover:text-white/90">
              {stack.name}
            </div>
            <div className="text-white/50 text-xs mt-1 flex items-center gap-2">
              <span>{cueCount} cue{cueCount !== 1 ? 's' : ''}</span>
              {stack.color && (
                <>
                  <span>•</span>
                  <span className="capitalize">{stack.color}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Kiosk mode
  return (
    <div
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchMove={handleCancel}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      style={{ touchAction: 'manipulation' }}
      className={`control-card ${isActive ? 'active' : ''}`}
    >
      <div className="card-icon">
        {isActive ? <Check size={20} /> : <Layers size={20} />}
      </div>
      <div className="card-info">
        <div className="card-title">{stack.name}</div>
        <div className="card-meta">
          <span>{cueCount} cue{cueCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Cue Stack Player Component (Go/Back Controls)
// ============================================================
function CueStackPlayer({ stack, onClose }) {
  const {
    loadStack, go, back, goto, stop,
    getCurrentCue, getNextCue, getPrevCue,
    getCurrentIndex, getTotalCues, isPlaying,
    isAtEnd, isAtStart, refreshStatus, playbackStatus
  } = useCueStackStore();

  const { looks } = useLookStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStack(stack.stack_id);
    return () => stop();
  }, [stack.stack_id]);

  // Refresh status periodically
  useEffect(() => {
    const interval = setInterval(() => refreshStatus(), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGo = async () => {
    setLoading(true);
    try {
      await go();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    setLoading(true);
    try {
      await back();
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    await stop();
    onClose();
  };

  const currentCue = getCurrentCue();
  const nextCue = getNextCue();
  const prevCue = getPrevCue();
  const currentIndex = getCurrentIndex();
  const totalCues = getTotalCues();

  // Get look name for a cue
  const getLookName = (lookId) => {
    const look = looks.find(l => l.look_id === lookId);
    return look?.name || '';
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          onClick={handleStop}
          className="glass-button flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Exit</span>
        </button>
        <h2 className="text-lg font-semibold text-white">{stack.name}</h2>
        <div className="text-white/60 text-sm">
          {currentIndex >= 0 ? currentIndex + 1 : 0} / {totalCues}
        </div>
      </div>

      {/* Main Player Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        {/* Previous Cue (small) */}
        <div className="w-full max-w-md opacity-50">
          {prevCue ? (
            <div className="glass-card p-3 text-center">
              <div className="text-white/40 text-xs mb-1">Previous</div>
              <div className="text-white/70">
                Cue {prevCue.cue_number} - {prevCue.name || getLookName(prevCue.look_id) || 'Untitled'}
              </div>
            </div>
          ) : (
            <div className="h-16" />
          )}
        </div>

        {/* Current Cue (large) */}
        <div className="w-full max-w-md">
          <div className="glass-card p-6 text-center border-2 border-[var(--accent)]">
            {currentCue ? (
              <>
                <div className="text-[var(--accent)] text-sm font-medium mb-2">CURRENT</div>
                <div className="text-3xl font-bold text-white mb-2">
                  Cue {currentCue.cue_number}
                </div>
                <div className="text-xl text-white/80 mb-3">
                  {currentCue.name || getLookName(currentCue.look_id) || 'Untitled'}
                </div>
                <div className="flex justify-center gap-4 text-white/50 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    Fade: {(currentCue.fade_time_ms / 1000).toFixed(1)}s
                  </span>
                  {currentCue.wait_time_ms > 0 && (
                    <span className="text-yellow-400">
                      Auto: {(currentCue.wait_time_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-white/50 py-4">
                Press GO to start
              </div>
            )}
          </div>
        </div>

        {/* Next Cue (small) */}
        <div className="w-full max-w-md opacity-50">
          {nextCue ? (
            <div className="glass-card p-3 text-center">
              <div className="text-white/40 text-xs mb-1">Next</div>
              <div className="text-white/70">
                Cue {nextCue.cue_number} - {nextCue.name || getLookName(nextCue.look_id) || 'Untitled'}
              </div>
              {nextCue.wait_time_ms > 0 && (
                <div className="text-yellow-400 text-xs mt-1">
                  Auto-follow: {(nextCue.wait_time_ms / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          ) : currentCue ? (
            <div className="glass-card p-3 text-center">
              <div className="text-white/40 text-xs">End of cue stack</div>
            </div>
          ) : (
            <div className="h-16" />
          )}
        </div>
      </div>

      {/* Go/Back Controls */}
      <div className="p-4 border-t border-white/10">
        <div className="flex justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={handleBack}
            disabled={loading || isAtStart()}
            className="flex-1 py-6 px-8 rounded-xl bg-white/10 hover:bg-white/20
                       disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center justify-center gap-3 text-white text-xl font-semibold
                       transition-all active:scale-95"
          >
            <SkipBack size={28} />
            BACK
          </button>
          <button
            onClick={handleGo}
            disabled={loading}
            className="flex-1 py-6 px-8 rounded-xl bg-[var(--accent)] hover:brightness-110
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-3 text-white text-xl font-semibold
                       transition-all active:scale-95"
          >
            GO
            <SkipForward size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Cue Stack Editor Component
// ============================================================
function CueStackEditor({ stack, onSave, onCancel }) {
  const { looks } = useLookStore();
  const [name, setName] = useState(stack?.name || '');
  const [cues, setCues] = useState(stack?.cues || []);
  const [editingCue, setEditingCue] = useState(null);

  const handleAddCue = () => {
    const nextNum = cues.length > 0
      ? String(Math.max(...cues.map(c => parseFloat(c.cue_number) || 0)) + 1)
      : '1';

    const newCue = {
      cue_id: `cue_${Date.now()}`,
      cue_number: nextNum,
      name: '',
      look_id: looks[0]?.look_id || null,
      channels: null,
      fade_time_ms: 1000,
      wait_time_ms: 0,
      notes: ''
    };
    setCues([...cues, newCue]);
    setEditingCue(newCue.cue_id);
  };

  const handleUpdateCue = (cueId, updates) => {
    setCues(cues.map(c => c.cue_id === cueId ? { ...c, ...updates } : c));
  };

  const handleDeleteCue = (cueId) => {
    setCues(cues.filter(c => c.cue_id !== cueId));
  };

  const handleSave = () => {
    onSave({
      name,
      cues,
      color: stack?.color || 'purple'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={onCancel} className="glass-button">
          <ArrowLeft size={18} />
          <span>Cancel</span>
        </button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cue Stack Name"
          className="bg-transparent text-lg font-semibold text-white text-center border-none outline-none"
        />
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="glass-button bg-[var(--accent)]"
        >
          <Check size={18} />
          <span>Save</span>
        </button>
      </div>

      {/* Cue List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2 max-w-2xl mx-auto">
          {cues.map((cue, index) => (
            <div key={cue.cue_id} className="glass-card p-3">
              {editingCue === cue.cue_id ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cue.cue_number}
                      onChange={(e) => handleUpdateCue(cue.cue_id, { cue_number: e.target.value })}
                      placeholder="Cue #"
                      className="w-20 bg-white/10 rounded px-2 py-1 text-white"
                    />
                    <input
                      type="text"
                      value={cue.name}
                      onChange={(e) => handleUpdateCue(cue.cue_id, { name: e.target.value })}
                      placeholder="Cue Name"
                      className="flex-1 bg-white/10 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-white/60 text-sm">Look:</label>
                    <select
                      value={cue.look_id || ''}
                      onChange={(e) => handleUpdateCue(cue.cue_id, { look_id: e.target.value || null })}
                      className="flex-1 bg-white/10 rounded px-2 py-1 text-white"
                    >
                      <option value="">None</option>
                      {looks.map(look => (
                        <option key={look.look_id} value={look.look_id}>
                          {look.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex gap-2 items-center">
                      <label className="text-white/60 text-sm">Fade:</label>
                      <input
                        type="number"
                        value={cue.fade_time_ms / 1000}
                        onChange={(e) => handleUpdateCue(cue.cue_id, { fade_time_ms: parseFloat(e.target.value) * 1000 })}
                        min="0"
                        step="0.1"
                        className="w-20 bg-white/10 rounded px-2 py-1 text-white"
                      />
                      <span className="text-white/40 text-sm">s</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <label className="text-white/60 text-sm">Wait:</label>
                      <input
                        type="number"
                        value={cue.wait_time_ms / 1000}
                        onChange={(e) => handleUpdateCue(cue.cue_id, { wait_time_ms: parseFloat(e.target.value) * 1000 })}
                        min="0"
                        step="0.1"
                        className="w-20 bg-white/10 rounded px-2 py-1 text-white"
                      />
                      <span className="text-white/40 text-sm">s</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleDeleteCue(cue.cue_id)}
                      className="glass-button text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => setEditingCue(null)}
                      className="glass-button"
                    >
                      <Check size={16} />
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingCue(cue.cue_id)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-12 text-center">
                    <div className="text-lg font-bold text-white">{cue.cue_number}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-white">
                      {cue.name || looks.find(l => l.look_id === cue.look_id)?.name || 'Untitled'}
                    </div>
                    <div className="text-white/50 text-xs">
                      Fade: {(cue.fade_time_ms / 1000).toFixed(1)}s
                      {cue.wait_time_ms > 0 && ` • Wait: ${(cue.wait_time_ms / 1000).toFixed(1)}s`}
                    </div>
                  </div>
                  <Edit3 size={16} className="text-white/30" />
                </div>
              )}
            </div>
          ))}

          {/* Add Cue Button */}
          <button
            onClick={handleAddCue}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-white/60 hover:text-white hover:bg-white/10"
          >
            <Plus size={20} />
            Add Cue
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main CueStacks View
// ============================================================
export default function CueStacks() {
  const navigate = useNavigate();
  const { cueStacks, loading, fetchCueStacks, createCueStack, updateCueStack, deleteCueStack, activeStack } = useCueStackStore();
  const { looks, fetchLooks } = useLookStore();

  const [selectedStack, setSelectedStack] = useState(null);
  const [editingStack, setEditingStack] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Responsive: track window width
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 800);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;

  // Dynamic grid config based on screen width
  const getGridCols = () => {
    if (windowWidth >= 1920) return 5;
    if (windowWidth >= 1440) return 4;
    if (windowWidth >= 1024) return 3;
    return 2; // Kiosk/tablet default
  };

  useEffect(() => {
    fetchCueStacks();
    fetchLooks();
  }, []);

  const handleSelectStack = (stack) => {
    setSelectedStack(stack);
    setShowPlayer(true);
  };

  const handleLongPress = (stack) => {
    setEditingStack(stack);
  };

  const handleCreateNew = () => {
    setEditingStack({ name: '', cues: [] });
  };

  const handleSaveStack = async (data) => {
    if (editingStack?.stack_id) {
      await updateCueStack(editingStack.stack_id, data);
    } else {
      await createCueStack(data);
    }
    setEditingStack(null);
  };

  const handleDeleteStack = async (stackId) => {
    if (confirm('Delete this cue stack?')) {
      await deleteCueStack(stackId);
    }
  };

  // Show player if active
  if (showPlayer && selectedStack) {
    return (
      <CueStackPlayer
        stack={selectedStack}
        onClose={() => {
          setShowPlayer(false);
          setSelectedStack(null);
        }}
      />
    );
  }

  // Show editor if editing
  if (editingStack) {
    return (
      <CueStackEditor
        stack={editingStack}
        onSave={handleSaveStack}
        onCancel={() => setEditingStack(null)}
      />
    );
  }

  return (
    <div className={`pb-24 space-y-4 ${isDesktop ? 'p-6' : 'p-4'}`}>
      {/* Header - Responsive */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className={`glass-button flex items-center gap-2 ${isDesktop ? 'px-4 py-2.5 hover:bg-white/15' : ''}`}
        >
          <ArrowLeft size={isDesktop ? 20 : 18} />
          {isDesktop ? 'Back' : ''}
        </button>
        <div className="text-center">
          <h1 className={`font-semibold text-white ${isDesktop ? 'text-2xl' : 'text-xl'}`}>
            Cue Stacks
          </h1>
          {isDesktop && (
            <p className="text-white/50 text-xs mt-1">
              {cueStacks.length} stack{cueStacks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={handleCreateNew}
          className={`glass-button bg-[var(--accent)] flex items-center gap-2 ${
            isDesktop ? 'px-5 py-2.5 hover:brightness-110' : ''
          }`}
        >
          <Plus size={isDesktop ? 20 : 18} />
          {isDesktop ? 'New Stack' : 'New'}
        </button>
      </div>

      {/* Description - Responsive */}
      <p className={`text-white/60 ${isDesktop ? 'text-sm max-w-xl' : 'text-sm'}`}>
        Cue stacks for manual theatrical cueing with Go/Back controls.
        {isDesktop && ' Long-press a stack to edit.'}
      </p>

      {/* Stack List - Dynamic Grid */}
      {loading ? (
        <div className={`text-center text-white/50 ${isDesktop ? 'py-16' : 'py-8'}`}>
          Loading...
        </div>
      ) : cueStacks.length === 0 ? (
        <div className={`text-center ${isDesktop ? 'py-16' : 'py-8'}`}>
          <div className={`mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4 ${
            isDesktop ? 'w-20 h-20' : 'w-16 h-16'
          }`}>
            <Layers size={isDesktop ? 40 : 32} className="text-white/30" />
          </div>
          <p className="text-white/50 text-sm mb-1">No cue stacks yet</p>
          <p className="text-white/30 text-xs mb-4">Create one to get started</p>
          <button
            onClick={handleCreateNew}
            className={`inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] text-white font-semibold ${
              isDesktop ? 'px-6 py-3 text-sm' : 'px-4 py-2 text-sm'
            }`}
          >
            <Plus size={18} /> Create Cue Stack
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${getGridCols()}, 1fr)`,
            gap: isDesktop ? '16px' : '12px',
          }}
        >
          {cueStacks.map((stack) => (
            <CueStackCard
              key={stack.stack_id}
              stack={stack}
              isActive={activeStack === stack.stack_id}
              onSelect={handleSelectStack}
              onLongPress={handleLongPress}
              isDesktop={isDesktop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
