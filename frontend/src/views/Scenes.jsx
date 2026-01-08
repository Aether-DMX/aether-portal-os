import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Trash2, Edit3, X, Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import useDMXStore from '../store/dmxStore';
import usePlaybackStore from '../store/playbackStore';
import ApplyTargetModal from '../components/ApplyTargetModal';
import SceneEditor from '../components/common/SceneEditor';

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
  
  const SCENES_PER_PAGE = 15;
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
