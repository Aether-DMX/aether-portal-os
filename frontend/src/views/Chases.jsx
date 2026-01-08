import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Square, Trash2, Edit3, ChevronLeft, ChevronRight, Repeat, Zap } from 'lucide-react';
import usePlaybackStore from '../store/playbackStore';
import useChaseStore from '../store/chaseStore';
import useSceneStore from '../store/sceneStore';
import ApplyTargetModal from '../components/ApplyTargetModal';
import ChaseEditor from '../components/common/ChaseEditor';

// Helper to get colors from chase steps
function getChaseColors(chase) {
  const steps = chase.steps || [];
  if (steps.length === 0) return null;

  // Get colors from first few steps
  const colors = steps.slice(0, 4).map(step => {
    // Step might have a color property or channels
    if (step.color) return step.color;
    const ch = step.channels || {};
    const r = ch['1:1'] ?? ch['1'] ?? ch[1] ?? 0;
    const g = ch['1:2'] ?? ch['2'] ?? ch[2] ?? 0;
    const b = ch['1:3'] ?? ch['3'] ?? ch[3] ?? 0;
    if (r + g + b < 30) return null;
    return `rgb(${r}, ${g}, ${b})`;
  }).filter(Boolean);

  if (colors.length === 0) return null;
  if (colors.length === 1) return { gradient: colors[0], primary: colors[0] };

  // Create gradient from step colors
  const gradient = `linear-gradient(90deg, ${colors.join(', ')})`;
  return { gradient, primary: colors[0] };
}

// Chase Card - Tap to Play, Long Press for Menu (matches SceneCard structure)
function ChaseCard({ chase, isActive, onPlay, onStop, onLongPress }) {
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const stepCount = chase.steps?.length || 0;
  const bpm = chase.bpm || 120;
  const chaseColors = getChaseColors(chase);

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => { didLongPress.current = true; onLongPress(chase); }, 500);
  };
  const handleEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(pressTimer.current);
    // Always open play modal on tap (even if active) - user can reapply or change settings
    if (!didLongPress.current) { onPlay(chase); }
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
      style={{
        touchAction: 'manipulation',
        '--card-color': chaseColors?.primary || 'var(--theme-primary)',
      }}
      className={`control-card ${isActive ? 'active playing' : ''} ${chaseColors ? 'has-color' : ''}`}
    >
      {/* Multi-color gradient bar for chase steps */}
      {chaseColors && (
        <div
          className="card-color-bar"
          style={{ background: chaseColors.gradient }}
        />
      )}
      <div className="card-icon" style={chaseColors ? {
        background: `linear-gradient(145deg, ${chaseColors.primary}33, ${chaseColors.primary}15)`,
        color: chaseColors.primary
      } : undefined}>
        {isActive ? <Square size={18} /> : <Play size={20} className="ml-0.5" />}
      </div>
      <div className="card-info">
        <div className="card-title">{chase.name}</div>
        <div className="card-meta">
          <span>{stepCount} steps</span>
          <span>•</span>
          <span>{bpm} BPM</span>
          {chase.loop !== false && <Repeat size={10} />}
        </div>
      </div>
    </div>
  );
}


// Context Menu for Long Press
function CardContextMenu({ item, type, onEdit, onDelete, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-72 border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-bold truncate">{item.name}</h3>
          <p className="text-white/50 text-sm">{type}</p>
        </div>
        <div className="p-2">
          <button onClick={() => { onEdit(item); onClose(); }} 
            className="w-full p-3 rounded-xl text-left text-white flex items-center gap-3 hover:bg-white/10">
            <Edit3 size={20} /> Edit {type}
          </button>
          <button onClick={() => { onDelete(item); onClose(); }} 
            className="w-full p-3 rounded-xl text-left text-red-400 flex items-center gap-3 hover:bg-red-500/10">
            <Trash2 size={20} /> Delete {type}
          </button>
        </div>
        <div className="p-2 border-t border-white/10">
          <button onClick={onClose} className="w-full p-3 rounded-xl text-white/50 hover:bg-white/5">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Main Chases Component
export default function Chases() {
  const navigate = useNavigate();
  const { chases, fetchChases, isChasePlaying, playChase, stopChase, createChase, updateChase, deleteChase } = useChaseStore();
  const { scenes, fetchScenes } = useSceneStore();
  const [editingChase, setEditingChase] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [playModalChase, setPlayModalChase] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const CHASES_PER_PAGE = 15;
  const totalPages = Math.ceil(chases.length / CHASES_PER_PAGE);
  const paginatedChases = chases.slice(currentPage * CHASES_PER_PAGE, (currentPage + 1) * CHASES_PER_PAGE);

  useEffect(() => { 
    fetchChases(); 
    fetchScenes(); 
  }, [fetchChases, fetchScenes]);

  const handleEdit = (chase) => { setEditingChase(chase); setIsCreating(true); };
  const handleCreate = () => { setEditingChase({ name: '', steps: [], bpm: 120, loop: true }); setIsCreating(true); };

  const handleSave = async (chaseData) => {
    try {
      if (chaseData.chase_id) await updateChase(chaseData.chase_id, chaseData);
      else await createChase(chaseData);
      setIsCreating(false);
      setEditingChase(null);
      fetchChases();
    } catch (err) { console.error('Failed to save chase:', err); }
  };

  const handlePlayWithOptions = async (chase, options) => {
    const chaseId = chase.chase_id || chase.id;
    setPlayModalChase(null);

    // Send single API call with universes array (backend handles all universes at once)
    await playChase(chaseId, {
      universes: options.universes,  // Send array of universes
      fade_ms: options.fadeMs
    });
  };

  const handleDelete = async (chase) => {
    if (confirm(`Delete "${chase.name}"?`)) {
      await deleteChase(chase.chase_id || chase.id);
      fetchChases();
    }
  };


  return (
    <div className="fullscreen-view">
      {/* Header */}
      <div className="view-header">
        <div className="flex items-center gap-2">
          <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-lg font-bold text-white">Chases</h1>
          <p className="text-[10px] text-white/50">{chases.length} saved</p>
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

      {/* Chase Grid */}
      <div className="view-content">
        {chases.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Zap size={32} className="text-white/30" />
            </div>
            <p className="text-white/50 text-sm mb-1">No chases yet</p>
            <p className="text-white/30 text-xs mb-4">Create animated lighting sequences</p>
            <button
              onTouchEnd={(e) => { e.preventDefault(); handleCreate(); }}
              onClick={handleCreate}
              className="px-5 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-2 text-sm"
            >
              <Plus size={18} /> Create Chase
            </button>
          </div>
        ) : (
          <>
            <div className="control-grid">
              {paginatedChases.map(chase => (
                <ChaseCard
                  key={chase.chase_id || chase.id}
                  chase={chase}
                  isActive={isChasePlaying(chase.chase_id || chase.id)}
                  onPlay={(c) => setPlayModalChase(c)}
                  onStop={stopChase}
                  onLongPress={(c) => setContextMenu(c)}
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

      {/* Chase Editor */}
      {isCreating && (
        <ChaseEditor
          chase={editingChase}
          scenes={scenes}
          onClose={() => { setIsCreating(false); setEditingChase(null); }}
          onSave={handleSave}
        />
      )}

      {/* Play Chase Modal - Uses unified ApplyTargetModal */}
      {playModalChase && (
        <ApplyTargetModal
          mode="chase"
          item={playModalChase}
          onConfirm={handlePlayWithOptions}
          onCancel={() => setPlayModalChase(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <CardContextMenu
          item={contextMenu}
          type="Chase"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export const ChasesHeaderExtension = () => null;
