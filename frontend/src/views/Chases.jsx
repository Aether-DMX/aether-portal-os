import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Square, Trash2, Edit3, ChevronLeft, ChevronRight, Repeat, Zap, Copy } from 'lucide-react';
import usePlaybackStore from '../store/playbackStore';
import useChaseStore from '../store/chaseStore';
import useSceneStore from '../store/sceneStore';
import ApplyTargetModal from '../components/ApplyTargetModal';
import ChaseEditor from '../components/common/ChaseEditor';
import ContextMenu, { chaseContextMenu } from '../components/desktop/ContextMenu';
import { useDesktop } from '../components/desktop/DesktopShell';

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
  const [desktopContextMenu, setDesktopContextMenu] = useState(null);

  // Responsive: detect desktop vs kiosk
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 800);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isDesktop = windowWidth >= 1024;

  const CHASES_PER_PAGE = isDesktop ? 50 : 15;
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

  // Handle right-click context menu for desktop
  const handleContextMenu = (e, chase) => {
    e.preventDefault();
    setDesktopContextMenu({
      x: e.clientX,
      y: e.clientY,
      chase,
    });
  };

  // Handle duplicate chase
  const handleDuplicate = async (chase) => {
    const newChase = {
      ...chase,
      name: `${chase.name} (copy)`,
      chase_id: undefined,
      id: undefined,
    };
    await createChase(newChase);
    fetchChases();
  };

  // Desktop view
  if (isDesktop) {
    return (
      <DesktopChasesView
        chases={chases}
        paginatedChases={paginatedChases}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        isChasePlaying={isChasePlaying}
        handleCreate={handleCreate}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleDuplicate={handleDuplicate}
        setPlayModalChase={setPlayModalChase}
        handleContextMenu={handleContextMenu}
        desktopContextMenu={desktopContextMenu}
        setDesktopContextMenu={setDesktopContextMenu}
        isCreating={isCreating}
        setIsCreating={setIsCreating}
        editingChase={editingChase}
        setEditingChase={setEditingChase}
        handleSave={handleSave}
        playModalChase={playModalChase}
        handlePlayWithOptions={handlePlayWithOptions}
        scenes={scenes}
        stopChase={stopChase}
      />
    );
  }

  // Kiosk view (original)
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

// Desktop Chases View
function DesktopChasesView({
  chases,
  paginatedChases,
  currentPage,
  totalPages,
  setCurrentPage,
  isChasePlaying,
  handleCreate,
  handleEdit,
  handleDelete,
  handleDuplicate,
  setPlayModalChase,
  handleContextMenu,
  desktopContextMenu,
  setDesktopContextMenu,
  isCreating,
  setIsCreating,
  editingChase,
  setEditingChase,
  handleSave,
  playModalChase,
  handlePlayWithOptions,
  scenes,
  stopChase,
}) {
  const desktopContext = useDesktop();
  const { setHoveredItem, setSelectedItem, selectedItem } = desktopContext || {};
  const { playChase } = useChaseStore();

  const handleChaseHover = (chase) => {
    if (setHoveredItem) setHoveredItem(chase);
  };

  const handleChaseLeave = () => {
    if (setHoveredItem) setHoveredItem(null);
  };

  const handleChaseSelect = (chase) => {
    if (setSelectedItem) setSelectedItem(chase);
  };

  const handleChaseDoubleClick = (chase) => {
    // Double-click = play immediately
    playChase(chase.chase_id || chase.id);
  };

  return (
    <div className="desktop-chases">
      {/* Header */}
      <div className="chases-header">
        <div className="header-left">
          <h1 className="page-title">Chases</h1>
          <span className="page-count">{chases.length} chases</span>
        </div>
        <div className="header-right">
          <button className="create-btn" onClick={handleCreate}>
            <Plus size={18} />
            <span>New Chase</span>
          </button>
        </div>
      </div>

      {/* Chase Grid */}
      <div className="chases-content">
        {chases.length === 0 ? (
          <div className="empty-state">
            <Zap size={48} className="empty-icon" />
            <h3>No chases yet</h3>
            <p>Create animated lighting sequences</p>
            <button className="create-btn" onClick={handleCreate}>
              <Plus size={18} />
              <span>Create Chase</span>
            </button>
          </div>
        ) : (
          <div className="chases-grid">
            {paginatedChases.map((chase) => {
              const chaseId = chase.chase_id || chase.id;
              const isPlaying = isChasePlaying(chaseId);
              const isSelected = selectedItem?.chase_id === chaseId || selectedItem?.id === chaseId;
              const chaseColors = getChaseColors(chase);
              const stepCount = chase.steps?.length || 0;
              const bpm = chase.bpm || 120;

              return (
                <div
                  key={chaseId}
                  className={`chase-card ${isPlaying ? 'playing' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleChaseSelect(chase)}
                  onDoubleClick={() => handleChaseDoubleClick(chase)}
                  onContextMenu={(e) => handleContextMenu(e, chase)}
                  onMouseEnter={() => handleChaseHover(chase)}
                  onMouseLeave={handleChaseLeave}
                >
                  {/* Color preview */}
                  <div
                    className="chase-color-preview"
                    style={{ background: chaseColors?.gradient || 'linear-gradient(135deg, #22c55e33, rgba(255,255,255,0.05))' }}
                  >
                    {isPlaying && (
                      <div className="playing-indicator">
                        <span className="pulse-ring" />
                        <Square size={24} />
                      </div>
                    )}
                    {!isPlaying && (
                      <Zap size={28} className="chase-icon-large" />
                    )}
                  </div>

                  {/* Chase info */}
                  <div className="chase-info">
                    <span className="chase-name">{chase.name}</span>
                    <div className="chase-meta">
                      <span>{stepCount} steps</span>
                      <span>•</span>
                      <span>{bpm} BPM</span>
                      {chase.loop !== false && <Repeat size={12} />}
                    </div>
                  </div>

                  {/* Quick actions (visible on hover) */}
                  <div className="chase-actions">
                    <button
                      className="action-btn play"
                      onClick={(e) => { e.stopPropagation(); setPlayModalChase(chase); }}
                      title="Play chase"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      className="action-btn"
                      onClick={(e) => { e.stopPropagation(); handleEdit(chase); }}
                      title="Edit chase"
                    >
                      <Edit3 size={16} />
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

      {/* Right-click Context Menu */}
      {desktopContextMenu && (
        <ContextMenu
          x={desktopContextMenu.x}
          y={desktopContextMenu.y}
          items={chaseContextMenu(desktopContextMenu.chase, {
            onPlay: (c) => setPlayModalChase(c),
            onEdit: handleEdit,
            onDuplicate: handleDuplicate,
            onDelete: handleDelete,
          })}
          onClose={() => setDesktopContextMenu(null)}
        />
      )}

      {/* Chase Editor */}
      {isCreating && (
        <ChaseEditor
          chase={editingChase}
          scenes={scenes}
          onClose={() => { setIsCreating(false); setEditingChase(null); }}
          onSave={handleSave}
        />
      )}

      {/* Play Chase Modal */}
      {playModalChase && (
        <ApplyTargetModal
          mode="chase"
          item={playModalChase}
          onConfirm={handlePlayWithOptions}
          onCancel={() => setPlayModalChase(null)}
        />
      )}

      <style>{`
        .desktop-chases {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 24px;
        }

        .chases-header {
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

        .chases-content {
          flex: 1;
          overflow: auto;
        }

        .chases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        @media (min-width: 1400px) {
          .chases-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          }
        }

        .chase-card {
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.15s;
        }

        .chase-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .chase-card.selected {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.05);
        }

        .chase-card.playing {
          border-color: #22c55e;
        }

        .chase-color-preview {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .chase-icon-large {
          color: rgba(34, 197, 94, 0.6);
        }

        .playing-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
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

        .chase-info {
          padding: 12px 14px;
        }

        .chase-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chase-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .chase-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .chase-card:hover .chase-actions {
          opacity: 1;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: rgba(0, 0, 0, 0.8);
          color: white;
        }

        .action-btn.play:hover {
          background: #22c55e;
          color: #000;
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
          color: #22c55e;
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
