import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Home, Image, Zap, Sliders, Sparkles, Layers, Film,
  Calendar, Timer, Box, Settings, Radio, Play, AlertTriangle,
  Plus, X
} from 'lucide-react';
import useSceneStore from '../../store/sceneStore';
import useChaseStore from '../../store/chaseStore';
import useDMXStore from '../../store/dmxStore';
import { useFixtureStore } from '../../store/fixtureStore';

// Static navigation items
const navItems = [
  { type: 'nav', id: 'dashboard', label: 'Dashboard', icon: Home, path: '/', keywords: 'home main' },
  { type: 'nav', id: 'scenes', label: 'Scenes', icon: Image, path: '/scenes', keywords: 'lighting looks' },
  { type: 'nav', id: 'chases', label: 'Chases', icon: Zap, path: '/chases', keywords: 'effects sequence' },
  { type: 'nav', id: 'faders', label: 'Faders', icon: Sliders, path: '/faders', keywords: 'channels dmx' },
  { type: 'nav', id: 'effects', label: 'Effects', icon: Sparkles, path: '/effects', keywords: 'modifiers' },
  { type: 'nav', id: 'looks', label: 'Looks', icon: Image, path: '/looks', keywords: 'presets' },
  { type: 'nav', id: 'cue-stacks', label: 'Cue Stacks', icon: Layers, path: '/cue-stacks', keywords: 'cues theatrical' },
  { type: 'nav', id: 'shows', label: 'Shows', icon: Film, path: '/shows', keywords: 'macros automation' },
  { type: 'nav', id: 'schedules', label: 'Schedules', icon: Calendar, path: '/schedules', keywords: 'time cron' },
  { type: 'nav', id: 'timers', label: 'Timers', icon: Timer, path: '/timers', keywords: 'countdown' },
  { type: 'nav', id: 'fixtures', label: 'Fixtures', icon: Box, path: '/fixtures', keywords: 'patch lights' },
  { type: 'nav', id: 'nodes', label: 'Nodes', icon: Radio, path: '/nodes', keywords: 'pulse devices network' },
  { type: 'nav', id: 'settings', label: 'Settings', icon: Settings, path: '/more', keywords: 'config preferences' },
];

// Quick actions
const quickActions = [
  { type: 'action', id: 'blackout', label: 'Blackout All', icon: AlertTriangle, action: 'blackout', keywords: 'stop emergency' },
  { type: 'action', id: 'create-scene', label: 'Create New Scene', icon: Plus, action: 'create-scene', keywords: 'add new' },
  { type: 'action', id: 'create-chase', label: 'Create New Chase', icon: Plus, action: 'create-chase', keywords: 'add new effect' },
];

export default function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { scenes, playScene } = useSceneStore();
  const { chases, startChase } = useChaseStore();
  const { fixtures } = useFixtureStore();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build searchable items list
  const allItems = useMemo(() => {
    const items = [
      ...quickActions,
      ...navItems,
      ...scenes.map(s => ({
        type: 'scene',
        id: s.scene_id || s.id,
        label: s.name,
        icon: Play,
        keywords: 'scene lighting',
      })),
      ...chases.map(c => ({
        type: 'chase',
        id: c.chase_id || c.id,
        label: c.name,
        icon: Zap,
        keywords: 'chase effect',
      })),
      ...fixtures.map(f => ({
        type: 'fixture',
        id: f.fixture_id || f.id,
        label: f.name,
        icon: Box,
        keywords: `fixture ${f.type || ''} ch${f.start_channel || ''}`,
      })),
    ];
    return items;
  }, [scenes, chases, fixtures]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Show navigation and quick actions when no query
      return [...quickActions, ...navItems];
    }

    const q = query.toLowerCase();
    return allItems.filter(item => {
      const searchText = `${item.label} ${item.keywords || ''}`.toLowerCase();
      return searchText.includes(q);
    }).slice(0, 12); // Limit results
  }, [query, allItems]);

  // Reset selection when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex];
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = (item) => {
    switch (item.type) {
      case 'nav':
        navigate(item.path);
        break;
      case 'scene':
        playScene(item.id, 1000);
        break;
      case 'chase':
        startChase(item.id);
        break;
      case 'fixture':
        navigate(`/fixtures?highlight=${item.id}`);
        break;
      case 'action':
        if (item.action === 'blackout') {
          useDMXStore.getState().blackoutAll(500);
        } else if (item.action === 'create-scene') {
          navigate('/scenes?create=true');
        } else if (item.action === 'create-chase') {
          navigate('/chases?create=true');
        }
        break;
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'nav': return 'Navigation';
      case 'action': return 'Action';
      case 'scene': return 'Scene';
      case 'chase': return 'Chase';
      case 'fixture': return 'Fixture';
      default: return '';
    }
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="palette-search">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search scenes, chases, fixtures, or type a command..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="palette-results" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="no-results">No results found</div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={`${item.type}-${item.id}`}
                  className={`palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="item-icon">
                    <Icon size={18} />
                  </div>
                  <div className="item-content">
                    <span className="item-label">{item.label}</span>
                    <span className="item-type">{getTypeLabel(item.type)}</span>
                  </div>
                  {isSelected && (
                    <span className="item-hint">Enter to select</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="palette-footer">
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Select</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>

      <style>{`
        .command-palette-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 15vh;
          z-index: 9999;
        }

        .command-palette {
          width: 100%;
          max-width: 560px;
          background: rgba(20, 20, 30, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .palette-search {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          gap: 12px;
        }

        .search-icon {
          color: rgba(255, 255, 255, 0.4);
          flex-shrink: 0;
        }

        .palette-search input {
          flex: 1;
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          outline: none;
        }

        .palette-search input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .close-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .palette-results {
          max-height: 400px;
          overflow-y: auto;
          padding: 8px;
        }

        .no-results {
          padding: 24px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
        }

        .palette-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.1s;
          text-align: left;
        }

        .palette-item:hover,
        .palette-item.selected {
          background: rgba(255, 255, 255, 0.05);
        }

        .palette-item.selected {
          background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.1);
        }

        .item-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
          flex-shrink: 0;
        }

        .palette-item.selected .item-icon {
          background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.2);
          color: var(--theme-primary, #00ffaa);
        }

        .item-content {
          flex: 1;
          min-width: 0;
        }

        .item-label {
          display: block;
          color: white;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-type {
          display: block;
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
        }

        .item-hint {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.3);
          white-space: nowrap;
        }

        .palette-footer {
          display: flex;
          gap: 16px;
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.2);
        }

        .palette-footer span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .palette-footer kbd {
          display: inline-block;
          padding: 2px 5px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          font-family: monospace;
          font-size: 10px;
          margin-right: 4px;
        }

        /* Scrollbar */
        .palette-results::-webkit-scrollbar {
          width: 6px;
        }
        .palette-results::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
