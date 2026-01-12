import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Trash2, Edit3, X, Sparkles, ChevronLeft, ChevronRight, Check, Copy, Star } from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import useDMXStore from '../store/dmxStore';
import usePlaybackStore from '../store/playbackStore';
import ApplyTargetModal from '../components/ApplyTargetModal';
import SceneEditor from '../components/common/SceneEditor';
import ContextMenu, { sceneContextMenu } from '../components/desktop/ContextMenu';
import { useDesktop } from '../components/desktop/DesktopShell';

// Helper to get RGB from scene channels (assumes RGB on channels 1,2,3)
function getSceneColor(scene) {
  // First check if scene has a stored color
  if (scene.color) return scene.color;

  // Otherwise derive from channels
  const ch = scene.channels || {};
  const r = ch['1:1'] ?? ch['1'] ?? ch[1] ?? 0;
  const g = ch['1:2'] ?? ch['2'] ?? ch[2] ?? 0;
  const b = ch['1:3'] ?? ch['3'] ?? ch[3] ?? 0;

  // If all zeros or very dim, return a default
  if (r + g + b < 30) return null;

  return `rgb(${r}, ${g}, ${b})`;
}

// Scene Card - Tap to Play (always opens modal), Long Press for Menu
function SceneCard({ scene, isActive, onPlay, onStop, onLongPress }) {
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);
  const sceneColor = getSceneColor(scene);

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => { didLongPress.current = true; onLongPress(scene); }, 500);
  };
  const handleEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(pressTimer.current);
    // Always open play modal on tap (even if active) - user can reapply or change settings
    if (!didLongPress.current) { onPlay(scene); }
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
        '--card-color': sceneColor || 'var(--theme-primary)',
      }}
      className={`control-card ${isActive ? 'active playing' : ''} ${sceneColor ? 'has-color' : ''}`}
    >
      {/* Color accent bar */}
      {sceneColor && (
        <div
          className="card-color-bar"
          style={{ background: sceneColor }}
        />
      )}
      <div className="card-icon" style={sceneColor ? {
        background: `linear-gradient(145deg, ${sceneColor}33, ${sceneColor}15)`,
        color: sceneColor
      } : undefined}>
        {isActive ? <Check size={20} /> : <Play size={20} className="ml-0.5" />}
      </div>
      <div className="card-info">
        <div className="card-title">{scene.name}</div>
        <div className="card-meta">{Object.keys(scene.channels || {}).length} ch</div>
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

// Main Scenes Component
export default function Scenes() {
  const navigate = useNavigate();
  const { scenes, fetchScenes, playScene, stopScene, createScene, updateScene, deleteScene } = useSceneStore();
  const { playback, syncStatus } = usePlaybackStore();
  const [editingScene, setEditingScene] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [playModalScene, setPlayModalScene] = useState(null);
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

  const SCENES_PER_PAGE = isDesktop ? 50 : 15;
  const totalPages = Math.ceil(scenes.length / SCENES_PER_PAGE);
  const paginatedScenes = scenes.slice(currentPage * SCENES_PER_PAGE, (currentPage + 1) * SCENES_PER_PAGE);

  useEffect(() => { 
    fetchScenes(); 
    syncStatus();
    const interval = setInterval(syncStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchScenes, syncStatus]);

  const isScenePlaying = (id) => {
    for (const pb of Object.values(playback)) {
      if (pb?.type === 'scene' && pb?.id === id) return true;
    }
    return false;
  };

  const handleEdit = (scene) => { setEditingScene(scene); setIsCreating(true); };
  const handleCreate = () => { setEditingScene({ name: '', channels: {}, fade_time: 1000 }); setIsCreating(true); };

  const handleSave = async (sceneData) => {
    try {
      if (sceneData.scene_id) await updateScene(sceneData.scene_id, sceneData);
      else await createScene(sceneData);
      setIsCreating(false);
      setEditingScene(null);
      fetchScenes();
    } catch (err) { console.error('Save failed:', err); }
  };

  const handleDelete = async (scene) => {
    if (confirm(`Delete "${scene.name}"?`)) {
      await deleteScene(scene.scene_id || scene.id);
      fetchScenes();
    }
  };

  const handlePlayWithOptions = async (scene, options) => {
    console.log('🎬 handlePlayWithOptions called:', { scene: scene?.name, options });
    setPlayModalScene(null); // Close modal immediately

    try {
      const sceneId = scene.scene_id || scene.id;

      // Send single API call with universes array (backend handles all universes at once)
      const result = await playScene(sceneId, options?.fadeMs || 1000, {
        universes: options.universes,  // Send array of universes
        mergeMode: options?.mergeMode || 'merge',
        scope: options?.scope || 'current'
      });
      console.log('✅ Scene play complete:', result);
    } catch (err) {
      console.error('❌ handlePlayWithOptions error:', err);
    }
  };

  // Handle right-click context menu for desktop
  const handleContextMenu = (e, scene) => {
    e.preventDefault();
    setDesktopContextMenu({
      x: e.clientX,
      y: e.clientY,
      scene,
    });
  };

  // Handle duplicate scene
  const handleDuplicate = async (scene) => {
    const newScene = {
      ...scene,
      name: `${scene.name} (copy)`,
      scene_id: undefined,
      id: undefined,
    };
    await createScene(newScene);
    fetchScenes();
  };

  // Desktop view
  if (isDesktop) {
    return (
      <DesktopScenesView
        scenes={scenes}
        paginatedScenes={paginatedScenes}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        isScenePlaying={isScenePlaying}
        handleCreate={handleCreate}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleDuplicate={handleDuplicate}
        setPlayModalScene={setPlayModalScene}
        handleContextMenu={handleContextMenu}
        desktopContextMenu={desktopContextMenu}
        setDesktopContextMenu={setDesktopContextMenu}
        isCreating={isCreating}
        setIsCreating={setIsCreating}
        editingScene={editingScene}
        setEditingScene={setEditingScene}
        handleSave={handleSave}
        playModalScene={playModalScene}
        handlePlayWithOptions={handlePlayWithOptions}
      />
    );
  }

  // Kiosk view (original)
  return (
    <div className="fullscreen-view">
      <div className="view-header">
        <div className="flex items-center gap-2">
          <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-lg font-bold text-white">Scenes</h1>
          <p className="text-[10px] text-white/50">{scenes.length} saved</p>
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

      {/* Scene Grid */}
      <div className="view-content">
        {scenes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-white/30" />
            </div>
            <p className="text-white/50 text-sm mb-1">No scenes yet</p>
            <p className="text-white/30 text-xs mb-4">Create your first lighting scene</p>
            <button
              onTouchEnd={(e) => { e.preventDefault(); handleCreate(); }}
              onClick={handleCreate}
              className="px-5 py-3 rounded-xl bg-[var(--theme-primary)] text-black font-bold flex items-center gap-2 text-sm"
            >
              <Plus size={18} /> Create Scene
            </button>
          </div>
        ) : (
          <>
            <div className="control-grid">
              {paginatedScenes.map(scene => (
                <SceneCard
                  key={scene.scene_id || scene.id}
                  scene={scene}
                  isActive={isScenePlaying(scene.scene_id || scene.id)}
                  onPlay={(s) => setPlayModalScene(s)}
                  onStop={stopScene}
                  onLongPress={(s) => setContextMenu(s)}
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

      {/* Scene Editor Modal */}
      {isCreating && (
        <SceneEditor
          scene={editingScene}
          onClose={() => { setIsCreating(false); setEditingScene(null); }}
          onSave={(sceneData, isTest) => {
            if (isTest) {
              // Test mode - just send to DMX, don't save
              const { setChannels } = useDMXStore.getState();
              setChannels(sceneData.universe || 1, sceneData.channels, sceneData.fade_ms || 0);
            } else {
              handleSave(sceneData);
            }
          }}
        />
      )}

      {/* Play Scene Modal - Uses unified ApplyTargetModal */}
      {playModalScene && (
        <ApplyTargetModal
          mode="scene"
          item={playModalScene}
          onConfirm={handlePlayWithOptions}
          onCancel={() => setPlayModalScene(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <CardContextMenu
          item={contextMenu}
          type="Scene"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export const ScenesHeaderExtension = () => null;

// Desktop Scenes View
function DesktopScenesView({
  scenes,
  paginatedScenes,
  currentPage,
  totalPages,
  setCurrentPage,
  isScenePlaying,
  handleCreate,
  handleEdit,
  handleDelete,
  handleDuplicate,
  setPlayModalScene,
  handleContextMenu,
  desktopContextMenu,
  setDesktopContextMenu,
  isCreating,
  setIsCreating,
  editingScene,
  setEditingScene,
  handleSave,
  playModalScene,
  handlePlayWithOptions,
}) {
  const desktopContext = useDesktop();
  const { setHoveredItem, setSelectedItem, selectedItem } = desktopContext || {};
  const { playScene, stopScene } = useSceneStore();

  const handleSceneHover = (scene) => {
    if (setHoveredItem) setHoveredItem(scene);
  };

  const handleSceneLeave = () => {
    if (setHoveredItem) setHoveredItem(null);
  };

  const handleSceneSelect = (scene) => {
    if (setSelectedItem) setSelectedItem(scene);
  };

  const handleSceneDoubleClick = (scene) => {
    // Double-click = play immediately with default settings
    playScene(scene.scene_id || scene.id, 1000);
  };

  return (
    <div className="desktop-scenes">
      {/* Header */}
      <div className="scenes-header">
        <div className="header-left">
          <h1 className="page-title">Scenes</h1>
          <span className="page-count">{scenes.length} scenes</span>
        </div>
        <div className="header-right">
          <button className="create-btn" onClick={handleCreate}>
            <Plus size={18} />
            <span>New Scene</span>
          </button>
        </div>
      </div>

      {/* Scene Grid */}
      <div className="scenes-content">
        {scenes.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={48} className="empty-icon" />
            <h3>No scenes yet</h3>
            <p>Create your first lighting scene to get started</p>
            <button className="create-btn" onClick={handleCreate}>
              <Plus size={18} />
              <span>Create Scene</span>
            </button>
          </div>
        ) : (
          <div className="scenes-grid">
            {paginatedScenes.map((scene) => {
              const sceneId = scene.scene_id || scene.id;
              const isPlaying = isScenePlaying(sceneId);
              const isSelected = selectedItem?.scene_id === sceneId || selectedItem?.id === sceneId;
              const sceneColor = getSceneColor(scene);

              return (
                <div
                  key={sceneId}
                  className={`scene-card ${isPlaying ? 'playing' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSceneSelect(scene)}
                  onDoubleClick={() => handleSceneDoubleClick(scene)}
                  onContextMenu={(e) => handleContextMenu(e, scene)}
                  onMouseEnter={() => handleSceneHover(scene)}
                  onMouseLeave={handleSceneLeave}
                >
                  {/* Color preview */}
                  <div
                    className="scene-color-preview"
                    style={{ background: sceneColor || 'linear-gradient(135deg, var(--accent-dim), rgba(255,255,255,0.05))' }}
                  >
                    {isPlaying && (
                      <div className="playing-indicator">
                        <span className="pulse-ring" />
                        <Play size={24} fill="currentColor" />
                      </div>
                    )}
                  </div>

                  {/* Scene info */}
                  <div className="scene-info">
                    <span className="scene-name">{scene.name}</span>
                    <span className="scene-meta">{Object.keys(scene.channels || {}).length} channels</span>
                  </div>

                  {/* Quick actions (visible on hover) */}
                  <div className="scene-actions">
                    <button
                      className="action-btn play"
                      onClick={(e) => { e.stopPropagation(); setPlayModalScene(scene); }}
                      title="Play scene"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      className="action-btn"
                      onClick={(e) => { e.stopPropagation(); handleEdit(scene); }}
                      title="Edit scene"
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
          items={sceneContextMenu(desktopContextMenu.scene, {
            onPlay: (s) => setPlayModalScene(s),
            onEdit: handleEdit,
            onDuplicate: handleDuplicate,
            onDelete: handleDelete,
            onAddToQuick: () => {}, // TODO: implement
          })}
          onClose={() => setDesktopContextMenu(null)}
        />
      )}

      {/* Scene Editor Modal */}
      {isCreating && (
        <SceneEditor
          scene={editingScene}
          onClose={() => { setIsCreating(false); setEditingScene(null); }}
          onSave={(sceneData, isTest) => {
            if (isTest) {
              const { setChannels } = useDMXStore.getState();
              setChannels(sceneData.universe || 1, sceneData.channels, sceneData.fade_ms || 0);
            } else {
              handleSave(sceneData);
            }
          }}
        />
      )}

      {/* Play Scene Modal */}
      {playModalScene && (
        <ApplyTargetModal
          mode="scene"
          item={playModalScene}
          onConfirm={handlePlayWithOptions}
          onCancel={() => setPlayModalScene(null)}
        />
      )}

      <style>{`
        .desktop-scenes {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 24px;
        }

        .scenes-header {
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

        .scenes-content {
          flex: 1;
          overflow: auto;
        }

        .scenes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }

        @media (min-width: 1400px) {
          .scenes-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }

        .scene-card {
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.15s;
        }

        .scene-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .scene-card.selected {
          border-color: var(--theme-primary, #00ffaa);
          background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.05);
        }

        .scene-card.playing {
          border-color: var(--theme-primary, #00ffaa);
        }

        .scene-color-preview {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
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
          border: 2px solid var(--theme-primary, #00ffaa);
          animation: pulse-ring 1.5s ease-out infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .scene-info {
          padding: 12px 14px;
        }

        .scene-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scene-meta {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .scene-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .scene-card:hover .scene-actions {
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
          background: var(--theme-primary, #00ffaa);
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
