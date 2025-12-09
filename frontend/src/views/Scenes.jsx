import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Plus, X, Settings } from 'lucide-react';
import useSceneStore from '../store/sceneStore';

export default function Scenes() {
  const navigate = useNavigate();
  const { scenes, currentScene, fetchScenes, playScene, stopScene, deleteScene } = useSceneStore();
  const [editModal, setEditModal] = useState(null);
  const longPressTimer = useRef(null);
  const [pressedId, setPressedId] = useState(null);

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  const handleTouchStart = (scene) => {
    setPressedId(scene.scene_id || scene.id);
    longPressTimer.current = setTimeout(() => {
      setEditModal(scene);
      setPressedId(null);
    }, 500);
  };

  const handleTouchEnd = (scene) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (pressedId === (scene.scene_id || scene.id)) {
      // Short tap - play the scene
      const sceneId = scene.scene_id || scene.id;
      playScene(sceneId, scene.fade_ms || 1000);
    }
    setPressedId(null);
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressedId(null);
  };

  const isPlaying = (scene) => {
    if (!currentScene) return false;
    const currentId = currentScene.scene_id || currentScene.id;
    const sceneId = scene.scene_id || scene.id;
    return currentId === sceneId;
  };

  const handleStop = (e) => {
    e.stopPropagation();
    stopScene();
  };

  return (
    <div className="scenes-page">
      {/* Header */}
      <div className="scenes-header">
        <h1>Scenes</h1>
        <button onClick={() => navigate('/scene-creator')} className="add-btn">
          <Plus size={16} /> New
        </button>
      </div>

      {/* Grid */}
      <div className="scenes-grid">
        {scenes.length === 0 ? (
          <div className="empty-state">
            <p>No scenes yet</p>
            <button onClick={() => navigate('/scene-creator')}>Create Scene</button>
          </div>
        ) : (
          scenes.map((scene) => {
            const sceneId = scene.scene_id || scene.id;
            const playing = isPlaying(scene);
            return (
              <div
                key={sceneId}
                className={`scene-card ${playing ? 'playing' : ''} ${pressedId === sceneId ? 'pressed' : ''}`}
                style={{ '--scene-color': scene.color || '#3b82f6' }}
                onTouchStart={() => handleTouchStart(scene)}
                onTouchEnd={() => handleTouchEnd(scene)}
                onTouchCancel={handleTouchCancel}
                onMouseDown={() => handleTouchStart(scene)}
                onMouseUp={() => handleTouchEnd(scene)}
                onMouseLeave={handleTouchCancel}
              >
                <div className="scene-color-bar" />
                <span className="scene-name">{scene.name}</span>
                {playing && (
                  <button className="stop-btn" onClick={handleStop}>
                    <Square size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editModal.name}</h3>
              <button onClick={() => setEditModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <span>{Object.keys(editModal.channels || {}).length} channels</span>
                <span>Fade: {(editModal.fade_ms || 500) / 1000}s</span>
              </div>
              <div className="modal-actions">
                <button
                  className="play-btn"
                  onClick={() => {
                    playScene(editModal.scene_id || editModal.id, editModal.fade_ms || 1000);
                    setEditModal(null);
                  }}
                >
                  <Play size={16} /> Play
                </button>
                <button
                  className="edit-btn"
                  onClick={() => {
                    navigate(`/scene-creator?edit=${editModal.scene_id || editModal.id}`);
                    setEditModal(null);
                  }}
                >
                  <Settings size={16} /> Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => {
                    deleteScene(editModal.scene_id || editModal.id);
                    setEditModal(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scenes-page {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 8px;
          padding-bottom: 70px;
        }
        .scenes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .scenes-header h1 {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }
        .add-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: var(--accent, #00ffff);
          border: none;
          border-radius: 8px;
          color: black;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .scenes-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          flex: 1;
        }
        .scene-card {
          position: relative;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 60px;
        }
        .scene-card:active, .scene-card.pressed {
          transform: scale(0.95);
          background: rgba(255,255,255,0.1);
        }
        .scene-card.playing {
          border-color: var(--scene-color);
          box-shadow: 0 0 12px var(--scene-color);
          background: rgba(255,255,255,0.08);
        }
        .scene-color-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--scene-color);
          border-radius: 8px 8px 0 0;
        }
        .scene-name {
          font-size: 11px;
          font-weight: 600;
          color: white;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
          padding: 0 2px;
        }
        .stop-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.8);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: rgba(255,255,255,0.4);
        }
        .empty-state button {
          padding: 8px 16px;
          background: var(--accent, #00ffff);
          border: none;
          border-radius: 8px;
          color: black;
          font-weight: 600;
          cursor: pointer;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .edit-modal {
          background: #1a1a2e;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          width: 280px;
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .modal-header h3 {
          color: white;
          font-size: 16px;
          font-weight: 600;
        }
        .modal-header button {
          background: none;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
        }
        .modal-body {
          padding: 12px;
        }
        .modal-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }
        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .modal-actions button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .play-btn {
          background: var(--accent, #00ffff);
          color: black;
        }
        .edit-btn {
          background: rgba(255,255,255,0.1);
          color: white;
          border: 1px solid rgba(255,255,255,0.2) !important;
        }
        .delete-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3) !important;
        }
      `}</style>
    </div>
  );
}

export const ScenesHeaderExtension = () => null;
