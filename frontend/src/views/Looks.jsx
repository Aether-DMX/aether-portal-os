import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Play, Square, Trash2, Edit3, ChevronLeft, ChevronRight,
  Eye, Activity, Zap, Sparkles, Repeat, Check
} from 'lucide-react';
import useLookStore from '../store/lookStore';
import usePlaybackStore from '../store/playbackStore';
import LookSequenceEditor from '../components/common/LookSequenceEditor';
import ApplyTargetModal from '../components/ApplyTargetModal';

// ============================================================
// Look Card Component
// ============================================================
function LookCard({ look, isActive, onPlay, onLongPress }) {
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const modifierCount = look.modifiers?.length || 0;
  const channelCount = Object.keys(look.channels || {}).length;

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(look);
    }, 500);
  };

  const handleEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(pressTimer.current);
    if (!didLongPress.current) {
      onPlay(look);
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
        {isActive ? <Check size={20} /> : <Eye size={20} />}
      </div>
      <div className="card-info">
        <div className="card-title">{look.name}</div>
        <div className="card-meta">
          <span>{channelCount} ch</span>
          {modifierCount > 0 && (
            <>
              <span>•</span>
              <span>{modifierCount} mod</span>
              <Activity size={10} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sequence Card Component
// ============================================================
function SequenceCard({ sequence, isActive, onPlay, onLongPress }) {
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const stepCount = sequence.steps?.length || 0;
  const bpm = sequence.bpm || 120;

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(sequence);
    }, 500);
  };

  const handleEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(pressTimer.current);
    if (!didLongPress.current) {
      onPlay(sequence);
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
        {isActive ? <Square size={18} /> : <Zap size={20} />}
      </div>
      <div className="card-info">
        <div className="card-title">{sequence.name}</div>
        <div className="card-meta">
          <span>{stepCount} steps</span>
          <span>•</span>
          <span>{bpm} BPM</span>
          {sequence.loop_mode !== 'one_shot' && <Repeat size={10} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Context Menu for Long Press
// ============================================================
function CardContextMenu({ item, type, onEdit, onDelete, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-72 border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-bold truncate">{item.name}</h3>
          <p className="text-white/50 text-sm">{type}</p>
        </div>
        <div className="p-2">
          <button
            onClick={() => { onEdit(item); onClose(); }}
            className="w-full p-3 rounded-xl text-left text-white flex items-center gap-3 hover:bg-white/10"
          >
            <Edit3 size={20} /> Edit {type}
          </button>
          <button
            onClick={() => { onDelete(item); onClose(); }}
            className="w-full p-3 rounded-xl text-left text-red-400 flex items-center gap-3 hover:bg-red-500/10"
          >
            <Trash2 size={20} /> Delete {type}
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

// ============================================================
// Main Looks Component
// ============================================================
export default function Looks() {
  const navigate = useNavigate();
  const {
    looks,
    sequences,
    fetchLooks,
    fetchSequences,
    createLook,
    updateLook,
    deleteLook,
    createSequence,
    updateSequence,
    deleteSequence,
    playLook,
    playSequence,
    stopLook,
    stopSequence,
    isLookPlaying,
    isSequencePlaying,
    initialize,
  } = useLookStore();

  const { syncStatus } = usePlaybackStore();

  // UI state
  const [activeTab, setActiveTab] = useState('looks'); // 'looks' or 'sequences'
  const [currentPage, setCurrentPage] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [playModalItem, setPlayModalItem] = useState(null);
  const [playModalMode, setPlayModalMode] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [contextMenuType, setContextMenuType] = useState(null);

  const ITEMS_PER_PAGE = 15;

  // Get current items based on tab
  const currentItems = activeTab === 'looks' ? looks : sequences;
  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
  const paginatedItems = currentItems.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Initialize on mount
  useEffect(() => {
    initialize();
    const interval = setInterval(syncStatus, 2000);
    return () => clearInterval(interval);
  }, [initialize, syncStatus]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  // ─────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingItem({
      name: '',
      channels: {},
      modifiers: [],
      steps: activeTab === 'sequences' ? [] : undefined,
      bpm: 120,
      loop_mode: 'loop',
    });
    setIsEditorOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const handleSave = async (data, type) => {
    try {
      if (type === 'look') {
        if (data.look_id) {
          await updateLook(data.look_id, data);
        } else {
          await createLook(data);
        }
        await fetchLooks();
      } else {
        if (data.sequence_id) {
          await updateSequence(data.sequence_id, data);
        } else {
          await createSequence(data);
        }
        await fetchSequences();
      }
      setIsEditorOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleDelete = async (item) => {
    const name = item.name || 'item';
    const type = item.look_id ? 'Look' : 'Sequence';
    if (confirm(`Delete "${name}"?`)) {
      if (item.look_id) {
        await deleteLook(item.look_id);
        await fetchLooks();
      } else if (item.sequence_id) {
        await deleteSequence(item.sequence_id);
        await fetchSequences();
      }
    }
  };

  const handlePlayLook = (look) => {
    setPlayModalItem(look);
    setPlayModalMode('look');
  };

  const handlePlaySequence = (sequence) => {
    setPlayModalItem(sequence);
    setPlayModalMode('sequence');
  };

  const handlePlayWithOptions = async (item, options) => {
    setPlayModalItem(null);
    setPlayModalMode(null);

    try {
      if (playModalMode === 'look') {
        await playLook(item.look_id || item.id, {
          universes: options.universes,
          fade_ms: options.fadeMs || 1000,
        });
      } else {
        await playSequence(item.sequence_id || item.id, {
          universes: options.universes,
          loop_mode: item.loop_mode || 'loop',
        });
      }
    } catch (err) {
      console.error('Play failed:', err);
    }
  };

  const handleLongPress = (item, type) => {
    setContextMenu(item);
    setContextMenuType(type);
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="fullscreen-view">
      {/* Header */}
      <div className="view-header">
        <div className="flex items-center gap-2">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Looks & Sequences</h1>
            <p className="text-[10px] text-white/50">
              {looks.length} looks • {sequences.length} sequences
            </p>
          </div>
        </div>
        <button
          onTouchEnd={(e) => { e.preventDefault(); handleCreate(); }}
          onClick={handleCreate}
          className="px-3 py-2 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-1 text-sm"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('looks')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'looks'
                ? 'bg-[var(--theme-primary)] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Eye size={14} className="inline mr-1" /> Looks ({looks.length})
          </button>
          <button
            onClick={() => setActiveTab('sequences')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'sequences'
                ? 'bg-[var(--theme-primary)] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Zap size={14} className="inline mr-1" /> Sequences ({sequences.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="view-content">
        {currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              {activeTab === 'looks' ? (
                <Eye size={32} className="text-white/30" />
              ) : (
                <Zap size={32} className="text-white/30" />
              )}
            </div>
            <p className="text-white/50 text-sm mb-1">
              No {activeTab === 'looks' ? 'looks' : 'sequences'} yet
            </p>
            <p className="text-white/30 text-xs mb-4 max-w-[200px]">
              {activeTab === 'looks'
                ? 'Looks are static lighting states with optional modifiers'
                : 'Sequences are timed step patterns with BPM control'}
            </p>
            <button
              onTouchEnd={(e) => { e.preventDefault(); handleCreate(); }}
              onClick={handleCreate}
              className="px-5 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-2 text-sm"
            >
              <Plus size={18} /> Create {activeTab === 'looks' ? 'Look' : 'Sequence'}
            </button>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="control-grid">
              {activeTab === 'looks'
                ? paginatedItems.map((look) => (
                    <LookCard
                      key={look.look_id || look.id}
                      look={look}
                      isActive={isLookPlaying(look.look_id || look.id)}
                      onPlay={handlePlayLook}
                      onLongPress={(l) => handleLongPress(l, 'Look')}
                    />
                  ))
                : paginatedItems.map((sequence) => (
                    <SequenceCard
                      key={sequence.sequence_id || sequence.id}
                      sequence={sequence}
                      isActive={isSequencePlaying(sequence.sequence_id || sequence.id)}
                      onPlay={handlePlaySequence}
                      onLongPress={(s) => handleLongPress(s, 'Sequence')}
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
      <LookSequenceEditor
        item={editingItem}
        mode={activeTab}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />

      {/* Play Modal - Uses unified ApplyTargetModal */}
      {playModalItem && (
        <ApplyTargetModal
          mode={playModalMode}
          item={playModalItem}
          onConfirm={handlePlayWithOptions}
          onCancel={() => {
            setPlayModalItem(null);
            setPlayModalMode(null);
          }}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <CardContextMenu
          item={contextMenu}
          type={contextMenuType}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => {
            setContextMenu(null);
            setContextMenuType(null);
          }}
        />
      )}
    </div>
  );
}

export const LooksHeaderExtension = () => null;
