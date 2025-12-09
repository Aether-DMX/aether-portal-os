import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Plus, X, Settings } from 'lucide-react';
import useChaseStore from '../store/chaseStore';

export default function Chases() {
  const navigate = useNavigate();
  const { chases, activeChase, fetchChases, startChase, stopChase, deleteChase } = useChaseStore();
  const [editModal, setEditModal] = useState(null);
  const longPressTimer = useRef(null);
  const [pressedId, setPressedId] = useState(null);

  useEffect(() => {
    fetchChases();
  }, [fetchChases]);

  const handleTouchStart = (chase) => {
    setPressedId(chase.chase_id || chase.id);
    longPressTimer.current = setTimeout(() => {
      setEditModal(chase);
      setPressedId(null);
    }, 500);
  };

  const handleTouchEnd = (chase) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (pressedId === (chase.chase_id || chase.id)) {
      // Short tap - toggle chase
      const chaseId = chase.chase_id || chase.id;
      if (isPlaying(chase)) {
        stopChase();
      } else {
        startChase(chaseId);
      }
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

  const isPlaying = (chase) => {
    if (!activeChase) return false;
    const activeId = activeChase.chase_id || activeChase.id;
    const chaseId = chase.chase_id || chase.id;
    return activeId === chaseId;
  };

  const handleStop = (e) => {
    e.stopPropagation();
    stopChase();
  };

  return (
    <div className="chases-page">
      {/* Header */}
      <div className="chases-header">
        <h1>Chases</h1>
        <button onClick={() => navigate('/chase-creator')} className="add-btn">
          <Plus size={16} /> New
        </button>
      </div>

      {/* Grid */}
      <div className="chases-grid">
        {chases.length === 0 ? (
          <div className="empty-state">
            <p>No chases yet</p>
            <button onClick={() => navigate('/chase-creator')}>Create Chase</button>
          </div>
        ) : (
          chases.map((chase) => {
            const chaseId = chase.chase_id || chase.id;
            const playing = isPlaying(chase);
            return (
              <div
                key={chaseId}
                className={`chase-card ${playing ? 'playing' : ''} ${pressedId === chaseId ? 'pressed' : ''}`}
                style={{ '--chase-color': chase.color || '#22c55e' }}
                onTouchStart={() => handleTouchStart(chase)}
                onTouchEnd={() => handleTouchEnd(chase)}
                onTouchCancel={handleTouchCancel}
                onMouseDown={() => handleTouchStart(chase)}
                onMouseUp={() => handleTouchEnd(chase)}
                onMouseLeave={handleTouchCancel}
              >
                <div className="chase-color-bar" />
                <span className="chase-name">{chase.name}</span>
                <span className="chase-info">{chase.bpm || 120} BPM</span>
                {playing && (
                  <button className="stop-btn" onClick={handleStop}>
                    <Square size={12} />
                  </button>
                )}
                {playing && <div className="playing-indicator" />}
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
                <span>{editModal.steps?.length || 0} steps</span>
                <span>{editModal.bpm || 120} BPM</span>
                <span>{editModal.loop ? 'Loop' : 'Once'}</span>
              </div>
              <div className="modal-actions">
                <button
                  className="play-btn"
                  onClick={() => {
                    startChase(editModal.chase_id || editModal.id);
                    setEditModal(null);
                  }}
                >
                  <Play size={16} /> Play
                </button>
                <button
                  className="edit-btn"
                  onClick={() => {
                    navigate(`/chase-creator?edit=${editModal.chase_id || editModal.id}`);
                    setEditModal(null);
                  }}
                >
                  <Settings size={16} /> Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => {
                    deleteChase(editModal.chase_id || editModal.id);
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
        .chases-page {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 8px;
          padding-bottom: 70px;
        }
        .chases-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .chases-header h1 {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }
        .add-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #22c55e;
          border: none;
          border-radius: 8px;
          color: black;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .chases-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          flex: 1;
        }
        .chase-card {
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
          overflow: hidden;
        }
        .chase-card:active, .chase-card.pressed {
          transform: scale(0.95);
          background: rgba(255,255,255,0.1);
        }
        .chase-card.playing {
          border-color: var(--chase-color);
          box-shadow: 0 0 12px var(--chase-color);
          background: rgba(34, 197, 94, 0.1);
        }
        .chase-color-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--chase-color);
          border-radius: 8px 8px 0 0;
        }
        .chase-name {
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
        .chase-info {
          font-size: 9px;
          color: rgba(255,255,255,0.4);
          margin-top: 2px;
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
          z-index: 2;
        }
        .playing-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--chase-color);
          animation: chase-progress 1s linear infinite;
        }
        @keyframes chase-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
          background: #22c55e;
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
          background: #22c55e;
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

export const ChasesHeaderExtension = () => null;
