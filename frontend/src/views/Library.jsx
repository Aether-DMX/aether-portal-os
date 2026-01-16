import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Play, Square, Search, Filter,
  Sparkles, Zap, Film, Palette, Layers, Grid3X3,
  Clock, ChevronLeft, ChevronRight, MoreVertical,
  Edit3, Trash2, Copy, Star, Settings
} from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import useLookStore from '../store/lookStore';
import usePlaybackStore from '../store/playbackStore';
import useUnifiedPlaybackStore from '../store/unifiedPlaybackStore';
import ApplyTargetModal from '../components/ApplyTargetModal';
import ContentCreator from '../components/unified/ContentCreator';
import useToastStore from '../store/toastStore';

// Content type definitions with icons and colors
const CONTENT_TYPES = {
  all: { label: 'All', icon: Grid3X3, color: 'var(--accent)' },
  scene: { label: 'Scenes', icon: Palette, color: '#22c55e' },
  chase: { label: 'Chases', icon: Zap, color: '#f59e0b' },
  look: { label: 'Looks', icon: Sparkles, color: '#8b5cf6' },
  sequence: { label: 'Sequences', icon: Layers, color: '#ec4899' },
  show: { label: 'Shows', icon: Film, color: '#3b82f6' },
};

// Unified content card - adapts to content type
function ContentCard({ item, type, isActive, onPlay, onEdit, onDelete, onLongPress }) {
  const [pressing, setPressing] = useState(false);
  const pressTimer = React.useRef(null);
  const didLongPress = React.useRef(false);

  const typeConfig = CONTENT_TYPES[type];
  const Icon = typeConfig?.icon || Palette;

  // Get preview color from item
  const getPreviewColor = () => {
    if (item.color) return item.color;
    const ch = item.channels || {};
    const r = ch['1:1'] ?? ch['1'] ?? ch[1] ?? 0;
    const g = ch['1:2'] ?? ch['2'] ?? ch[2] ?? 0;
    const b = ch['1:3'] ?? ch['3'] ?? ch[3] ?? 0;
    if (r + g + b < 30) return null;
    return `rgb(${r}, ${g}, ${b})`;
  };

  const previewColor = getPreviewColor();

  const handleStart = (e) => {
    e.preventDefault();
    setPressing(true);
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setPressing(false);
      onLongPress?.(item, type);
    }, 500);
  };

  const handleEnd = (e) => {
    e.preventDefault();
    setPressing(false);
    clearTimeout(pressTimer.current);
    if (!didLongPress.current) {
      onPlay(item, type);
    }
  };

  const handleCancel = () => {
    setPressing(false);
    clearTimeout(pressTimer.current);
  };

  // Get subtitle based on type
  const getSubtitle = () => {
    switch (type) {
      case 'scene':
        return `${Object.keys(item.channels || {}).length} ch`;
      case 'chase':
        return `${item.steps?.length || 0} steps • ${item.bpm || 120} BPM`;
      case 'look':
        return `${item.modifiers?.length || 0} modifiers`;
      case 'sequence':
        return `${item.steps?.length || 0} steps`;
      case 'show':
        return `${item.timeline?.length || 0} events`;
      default:
        return '';
    }
  };

  return (
    <div
      className={`content-card ${isActive ? 'active' : ''} ${pressing ? 'pressing' : ''}`}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchMove={handleCancel}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      style={{ '--type-color': typeConfig?.color || 'var(--accent)' }}
    >
      {/* Color preview / type indicator */}
      <div
        className="card-preview"
        style={{
          background: previewColor
            ? `linear-gradient(145deg, ${previewColor}, ${previewColor}88)`
            : `linear-gradient(145deg, ${typeConfig?.color}33, ${typeConfig?.color}15)`
        }}
      >
        {isActive ? (
          <div className="playing-pulse">
            <Play size={18} fill="currentColor" />
          </div>
        ) : (
          <Icon size={18} className="card-type-icon" />
        )}
      </div>

      {/* Card info */}
      <div className="card-body">
        <div className="card-title">{item.name}</div>
        <div className="card-meta">
          <span className="type-badge" style={{ color: typeConfig?.color }}>
            {typeConfig?.label?.replace(/s$/, '')}
          </span>
          <span className="separator">•</span>
          <span>{getSubtitle()}</span>
        </div>
      </div>

      {/* Quick action on hover/focus */}
      <button
        className="card-action"
        onClick={(e) => { e.stopPropagation(); onEdit(item, type); }}
      >
        <Edit3 size={14} />
      </button>
    </div>
  );
}

// Context menu for long press
function ContentContextMenu({ item, type, onEdit, onDelete, onDuplicate, onClose }) {
  if (!item) return null;

  const typeConfig = CONTENT_TYPES[type];

  return (
    <div className="context-overlay" onClick={onClose}>
      <div className="context-menu" onClick={e => e.stopPropagation()}>
        <div className="context-header">
          <h3>{item.name}</h3>
          <span style={{ color: typeConfig?.color }}>{typeConfig?.label?.replace(/s$/, '')}</span>
        </div>
        <div className="context-actions">
          <button onClick={() => { onEdit(item, type); onClose(); }}>
            <Edit3 size={18} /> Edit
          </button>
          <button onClick={() => { onDuplicate(item, type); onClose(); }}>
            <Copy size={18} /> Duplicate
          </button>
          <button className="danger" onClick={() => { onDelete(item, type); onClose(); }}>
            <Trash2 size={18} /> Delete
          </button>
        </div>
        <button className="context-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// AI Suggestion Panel
function AISuggestionPanel({ onSuggest, currentFilter }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Generate contextual suggestions based on time, existing content, etc.
    const hour = new Date().getHours();
    const newSuggestions = [];

    if (hour >= 18 || hour < 6) {
      newSuggestions.push({ label: 'Evening Ambiance', type: 'scene', preset: 'warm' });
      newSuggestions.push({ label: 'Night Mode', type: 'look', preset: 'dim' });
    } else if (hour >= 6 && hour < 12) {
      newSuggestions.push({ label: 'Morning Bright', type: 'scene', preset: 'bright' });
    }

    newSuggestions.push({ label: 'Rainbow Chase', type: 'chase', preset: 'rainbow' });
    newSuggestions.push({ label: 'Pulse Effect', type: 'look', preset: 'pulse' });

    setSuggestions(newSuggestions.slice(0, 3));
  }, [currentFilter]);

  if (suggestions.length === 0) return null;

  return (
    <div className="ai-suggestions">
      <div className="ai-header">
        <Sparkles size={14} />
        <span>Quick Create</span>
      </div>
      <div className="ai-chips">
        {suggestions.map((s, i) => (
          <button
            key={i}
            className="ai-chip"
            onClick={() => onSuggest(s)}
            style={{ '--chip-color': CONTENT_TYPES[s.type]?.color }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Main Library View
export default function Library() {
  const navigate = useNavigate();
  const toast = useToastStore();

  // Stores
  const { scenes, fetchScenes, createScene, updateScene, deleteScene } = useSceneStore();
  const { chases, fetchChases, createChase, updateChase, deleteChase } = useChaseStore();
  const { looks, sequences, fetchLooks, createLook, updateLook, deleteLook, createSequence, updateSequence, deleteSequence } = useLookStore();
  const { playback } = usePlaybackStore();
  const { status: unifiedStatus } = useUnifiedPlaybackStore();

  // UI state
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [playModalItem, setPlayModalItem] = useState(null);
  const [playModalType, setPlayModalType] = useState(null);
  const [contextMenuItem, setContextMenuItem] = useState(null);
  const [contextMenuType, setContextMenuType] = useState(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorMode, setCreatorMode] = useState('scene');
  const [editingItem, setEditingItem] = useState(null);

  const ITEMS_PER_PAGE = 12;

  // Fetch all content on mount
  useEffect(() => {
    fetchScenes();
    fetchChases();
    fetchLooks();
  }, []);

  // Combine all content into unified list
  const allContent = useMemo(() => {
    const items = [];

    scenes.forEach(s => items.push({ ...s, _type: 'scene', _id: s.scene_id || s.id }));
    chases.forEach(c => items.push({ ...c, _type: 'chase', _id: c.chase_id || c.id }));
    (looks || []).forEach(l => items.push({ ...l, _type: 'look', _id: l.look_id || l.id }));
    (sequences || []).forEach(s => items.push({ ...s, _type: 'sequence', _id: s.sequence_id || s.id }));

    return items;
  }, [scenes, chases, looks, sequences]);

  // Filter and search
  const filteredContent = useMemo(() => {
    let filtered = allContent;

    // Type filter
    if (filter !== 'all') {
      filtered = filtered.filter(item => item._type === filter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(query)
      );
    }

    // Sort by name
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return filtered;
  }, [allContent, filter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredContent.length / ITEMS_PER_PAGE);
  const paginatedContent = filteredContent.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [filter, searchQuery]);

  // Check if item is playing
  const isItemPlaying = useCallback((item) => {
    const id = item._id;
    // Check unified playback status
    if (unifiedStatus?.activeScenes?.includes(id)) return true;
    if (unifiedStatus?.activeChases?.includes(id)) return true;
    if (unifiedStatus?.activeLooks?.includes(id)) return true;
    // Check legacy playback
    for (const pb of Object.values(playback || {})) {
      if (pb?.id === id) return true;
    }
    return false;
  }, [playback, unifiedStatus]);

  // Handlers
  const handlePlay = (item, type) => {
    setPlayModalItem(item);
    setPlayModalType(type);
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setCreatorMode(type);
    setCreatorOpen(true);
  };

  const handleCreate = (type = 'scene') => {
    setEditingItem(null);
    setCreatorMode(type);
    setCreatorOpen(true);
  };

  const handleDelete = async (item, type) => {
    if (!confirm(`Delete "${item.name}"?`)) return;

    try {
      switch (type) {
        case 'scene':
          await deleteScene(item.scene_id || item.id);
          break;
        case 'chase':
          await deleteChase(item.chase_id || item.id);
          break;
        case 'look':
          await deleteLook(item.look_id || item.id);
          break;
        case 'sequence':
          await deleteSequence(item.sequence_id || item.id);
          break;
      }
      toast.success(`Deleted "${item.name}"`);
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleDuplicate = async (item, type) => {
    try {
      const newItem = { ...item, name: `${item.name} (copy)` };
      delete newItem.scene_id;
      delete newItem.chase_id;
      delete newItem.look_id;
      delete newItem.sequence_id;
      delete newItem.id;
      delete newItem._id;
      delete newItem._type;

      switch (type) {
        case 'scene':
          await createScene(newItem);
          break;
        case 'chase':
          await createChase(newItem);
          break;
        case 'look':
          await createLook(newItem);
          break;
        case 'sequence':
          await createSequence(newItem);
          break;
      }
      toast.success(`Duplicated "${item.name}"`);
    } catch (err) {
      toast.error('Duplicate failed');
    }
  };

  const handleSave = async (data, type) => {
    try {
      if (editingItem) {
        // Update existing
        switch (type) {
          case 'scene':
            await updateScene(editingItem.scene_id || editingItem.id, data);
            break;
          case 'chase':
            await updateChase(editingItem.chase_id || editingItem.id, data);
            break;
          case 'look':
            await updateLook(editingItem.look_id || editingItem.id, data);
            break;
          case 'sequence':
            await updateSequence(editingItem.sequence_id || editingItem.id, data);
            break;
        }
        toast.success(`Updated "${data.name}"`);
      } else {
        // Create new
        switch (type) {
          case 'scene':
            await createScene(data);
            break;
          case 'chase':
            await createChase(data);
            break;
          case 'look':
            await createLook(data);
            break;
          case 'sequence':
            await createSequence(data);
            break;
        }
        toast.success(`Created "${data.name}"`);
      }
      setCreatorOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error('Save failed');
    }
  };

  const handlePlayConfirm = async (options) => {
    const { playScene } = useSceneStore.getState();
    const { playChase } = useChaseStore.getState();
    const { playLook } = useLookStore.getState();

    try {
      switch (playModalType) {
        case 'scene':
          await playScene(playModalItem.scene_id || playModalItem.id, options.fadeMs, {
            universes: options.universes
          });
          break;
        case 'chase':
          await playChase(playModalItem.chase_id || playModalItem.id, {
            universes: options.universes
          });
          break;
        case 'look':
          await playLook(playModalItem.look_id || playModalItem.id, {
            universes: options.universes
          });
          break;
      }
    } catch (err) {
      toast.error('Playback failed');
    }
    setPlayModalItem(null);
    setPlayModalType(null);
  };

  const handleAISuggest = (suggestion) => {
    setCreatorMode(suggestion.type);
    setEditingItem({ _preset: suggestion.preset, name: suggestion.label });
    setCreatorOpen(true);
  };

  return (
    <div className="library-view">
      {/* Header */}
      <div className="library-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Library</h1>
            <span className="item-count">{filteredContent.length} items</span>
          </div>
        </div>
        <button className="create-btn" onClick={() => handleCreate(filter === 'all' ? 'scene' : filter)}>
          <Plus size={18} />
          <span>New</span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="filter-bar">
        {Object.entries(CONTENT_TYPES).map(([key, config]) => {
          const Icon = config.icon;
          const count = key === 'all'
            ? allContent.length
            : allContent.filter(i => i._type === key).length;

          return (
            <button
              key={key}
              className={`filter-pill ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
              style={{ '--pill-color': config.color }}
            >
              <Icon size={14} />
              <span>{config.label}</span>
              <span className="count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* AI Suggestions */}
      <AISuggestionPanel onSuggest={handleAISuggest} currentFilter={filter} />

      {/* Content Grid */}
      <div className="library-content">
        {filteredContent.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={40} />
            <h3>No {filter === 'all' ? 'content' : CONTENT_TYPES[filter]?.label?.toLowerCase()} yet</h3>
            <p>Create your first {filter === 'all' ? 'item' : CONTENT_TYPES[filter]?.label?.replace(/s$/, '').toLowerCase()}</p>
            <button className="create-btn" onClick={() => handleCreate(filter === 'all' ? 'scene' : filter)}>
              <Plus size={18} />
              <span>Create Now</span>
            </button>
          </div>
        ) : (
          <>
            <div className="content-grid">
              {paginatedContent.map(item => (
                <ContentCard
                  key={`${item._type}-${item._id}`}
                  item={item}
                  type={item._type}
                  isActive={isItemPlaying(item)}
                  onPlay={handlePlay}
                  onEdit={handleEdit}
                  onLongPress={(i, t) => {
                    setContextMenuItem(i);
                    setContextMenuType(t);
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>{currentPage + 1} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Play Modal */}
      {playModalItem && (
        <ApplyTargetModal
          mode={playModalType}
          item={playModalItem}
          onConfirm={handlePlayConfirm}
          onCancel={() => { setPlayModalItem(null); setPlayModalType(null); }}
        />
      )}

      {/* Context Menu */}
      {contextMenuItem && (
        <ContentContextMenu
          item={contextMenuItem}
          type={contextMenuType}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onClose={() => { setContextMenuItem(null); setContextMenuType(null); }}
        />
      )}

      {/* Unified Creator */}
      {creatorOpen && (
        <ContentCreator
          mode={creatorMode}
          item={editingItem}
          onSave={handleSave}
          onClose={() => { setCreatorOpen(false); setEditingItem(null); }}
          onModeChange={setCreatorMode}
        />
      )}

      <style>{`
        .library-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0a0a0f;
        }

        .library-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .library-header h1 {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .item-count {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }

        .create-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: var(--accent);
          color: black;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        /* Filter Bar */
        .filter-bar {
          display: flex;
          gap: 6px;
          padding: 10px 16px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .filter-bar::-webkit-scrollbar { display: none; }

        .filter-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          color: rgba(255,255,255,0.6);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }

        .filter-pill:hover {
          background: rgba(255,255,255,0.08);
        }

        .filter-pill.active {
          background: rgba(var(--accent-rgb), 0.15);
          border-color: var(--pill-color, var(--accent));
          color: var(--pill-color, var(--accent));
        }

        .filter-pill .count {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }

        .filter-pill.active .count {
          background: rgba(var(--accent-rgb), 0.2);
        }

        /* AI Suggestions */
        .ai-suggestions {
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .ai-header {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          margin-bottom: 8px;
        }

        .ai-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .ai-chip {
          padding: 6px 12px;
          background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05));
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 16px;
          color: #a78bfa;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .ai-chip:hover {
          background: rgba(139,92,246,0.25);
          border-color: rgba(139,92,246,0.4);
        }

        /* Content Grid */
        .library-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        @media (max-width: 600px) {
          .content-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Content Card */
        .content-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.15s;
          touch-action: manipulation;
        }

        .content-card:hover, .content-card:active {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.1);
          transform: scale(0.98);
        }

        .content-card.pressing {
          transform: scale(0.95);
        }

        .content-card.active {
          border-color: var(--type-color, var(--accent));
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.2);
        }

        .card-preview {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.6);
        }

        .card-type-icon {
          opacity: 0.5;
        }

        .playing-pulse {
          color: white;
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .card-body {
          padding: 10px;
        }

        .card-title {
          font-size: 13px;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: rgba(255,255,255,0.4);
        }

        .type-badge {
          font-weight: 600;
        }

        .card-action {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(0,0,0,0.6);
          border: none;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all 0.15s;
        }

        .content-card:hover .card-action {
          opacity: 1;
        }

        .card-action:hover {
          background: rgba(0,0,0,0.8);
          color: white;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 300px;
          text-align: center;
          color: rgba(255,255,255,0.3);
        }

        .empty-state h3 {
          margin: 16px 0 8px;
          font-size: 16px;
          color: rgba(255,255,255,0.6);
        }

        .empty-state p {
          margin: 0 0 20px;
          font-size: 13px;
        }

        /* Pagination */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin-top: 16px;
        }

        .pagination button {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: none;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .pagination button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .pagination span {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
        }

        /* Context Menu */
        .context-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .context-menu {
          background: #1a1a24;
          border-radius: 16px;
          width: 280px;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
        }

        .context-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .context-header h3 {
          margin: 0 0 4px;
          font-size: 16px;
          color: white;
        }

        .context-header span {
          font-size: 12px;
        }

        .context-actions {
          padding: 8px;
        }

        .context-actions button {
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .context-actions button:hover {
          background: rgba(255,255,255,0.06);
        }

        .context-actions button.danger {
          color: #ef4444;
        }

        .context-cancel {
          width: 100%;
          padding: 14px;
          background: none;
          border: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
