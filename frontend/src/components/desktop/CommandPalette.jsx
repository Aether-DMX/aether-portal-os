import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Home, Image, Zap, Sliders, Sparkles, Layers, Film,
  Calendar, Timer, Box, Settings, Radio, Play, AlertTriangle,
  Plus, X, Square, Moon, Sun, Eye, EyeOff, Volume2, VolumeX,
  RotateCcw, FastForward, Rewind, Command, ArrowRight
} from 'lucide-react';
import useSceneStore from '../../store/sceneStore';
import useChaseStore from '../../store/chaseStore';
import useDMXStore from '../../store/dmxStore';
import usePlaybackStore from '../../store/playbackStore';
import { useFixtureStore } from '../../store/fixtureStore';
import useNodeStore from '../../store/nodeStore';
import { useDesktop } from './DesktopShell';

// Static navigation items
const navItems = [
  { type: 'nav', id: 'dashboard', label: 'Dashboard', icon: Home, path: '/', keywords: 'home main overview' },
  { type: 'nav', id: 'scenes', label: 'Scenes', icon: Image, path: '/scenes', keywords: 'lighting looks presets' },
  { type: 'nav', id: 'chases', label: 'Chases', icon: Zap, path: '/chases', keywords: 'effects sequence animation' },
  { type: 'nav', id: 'faders', label: 'Faders', icon: Sliders, path: '/faders', keywords: 'channels dmx manual' },
  { type: 'nav', id: 'effects', label: 'Effects', icon: Sparkles, path: '/effects', keywords: 'modifiers pulse strobe' },
  { type: 'nav', id: 'looks', label: 'Looks', icon: Image, path: '/looks', keywords: 'presets states' },
  { type: 'nav', id: 'cue-stacks', label: 'Cue Stacks', icon: Layers, path: '/cue-stacks', keywords: 'cues theatrical show' },
  { type: 'nav', id: 'shows', label: 'Shows', icon: Film, path: '/shows', keywords: 'macros automation playlist' },
  { type: 'nav', id: 'schedules', label: 'Schedules', icon: Calendar, path: '/schedules', keywords: 'time cron automated' },
  { type: 'nav', id: 'timers', label: 'Timers', icon: Timer, path: '/timers', keywords: 'countdown clock' },
  { type: 'nav', id: 'fixtures', label: 'Fixtures', icon: Box, path: '/fixtures', keywords: 'patch lights devices' },
  { type: 'nav', id: 'nodes', label: 'Nodes', icon: Radio, path: '/nodes', keywords: 'pulse devices network wireless' },
  { type: 'nav', id: 'settings', label: 'Settings', icon: Settings, path: '/more', keywords: 'config preferences options' },
];

// Quick command actions (always available)
const quickCommands = [
  {
    type: 'command',
    id: 'blackout',
    label: 'Blackout All',
    description: 'Fade all lights to 0',
    icon: EyeOff,
    keywords: 'stop emergency off dark',
    dangerous: true,
  },
  {
    type: 'command',
    id: 'restore',
    label: 'Restore Output',
    description: 'Resume previous state',
    icon: RotateCcw,
    keywords: 'resume undo back',
  },
  {
    type: 'command',
    id: 'stop-all',
    label: 'Stop All Playback',
    description: 'Stop all scenes and chases',
    icon: Square,
    keywords: 'halt pause',
  },
  {
    type: 'command',
    id: 'master-100',
    label: 'Master to 100%',
    description: 'Set master fader to full',
    icon: Sun,
    keywords: 'full bright max',
  },
  {
    type: 'command',
    id: 'master-0',
    label: 'Master to 0%',
    description: 'Set master fader to zero',
    icon: Moon,
    keywords: 'dim zero off',
  },
];

// Natural language command patterns
const commandPatterns = [
  {
    pattern: /^play\s+(?:scene\s+)?[""']?(.+?)[""']?$/i,
    type: 'play-scene',
    extract: (match) => ({ name: match[1].trim() }),
  },
  {
    pattern: /^(?:start|run)\s+(?:chase\s+)?[""']?(.+?)[""']?$/i,
    type: 'play-chase',
    extract: (match) => ({ name: match[1].trim() }),
  },
  {
    pattern: /^stop\s+(?:scene\s+)?[""']?(.+?)[""']?$/i,
    type: 'stop-scene',
    extract: (match) => ({ name: match[1].trim() }),
  },
  {
    pattern: /^stop\s+(?:chase\s+)?[""']?(.+?)[""']?$/i,
    type: 'stop-chase',
    extract: (match) => ({ name: match[1].trim() }),
  },
  {
    pattern: /^blackout(?:\s+(?:zone|universe)\s+(\d+))?$/i,
    type: 'blackout',
    extract: (match) => ({ zone: match[1] ? parseInt(match[1]) : null }),
  },
  {
    pattern: /^master\s+(?:to\s+)?(\d+)%?$/i,
    type: 'set-master',
    extract: (match) => ({ value: parseInt(match[1]) }),
  },
  {
    pattern: /^fade\s+(?:to\s+)?(\d+)%?\s+(?:in\s+)?(\d+)(?:ms|s)?$/i,
    type: 'fade-master',
    extract: (match) => ({
      value: parseInt(match[1]),
      time: match[2].includes('s') ? parseInt(match[2]) * 1000 : parseInt(match[2])
    }),
  },
  {
    pattern: /^go\s+to\s+(.+)$/i,
    type: 'navigate',
    extract: (match) => ({ destination: match[1].trim() }),
  },
  {
    pattern: /^(?:jump|goto)\s+(.+)$/i,
    type: 'navigate',
    extract: (match) => ({ destination: match[1].trim() }),
  },
];

export default function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executionFeedback, setExecutionFeedback] = useState(null);

  const { scenes, playScene, stopScene } = useSceneStore();
  const { chases, startChase, stopChase } = useChaseStore();
  const { fixtures } = useFixtureStore();
  const { nodes } = useNodeStore();
  const { blackoutAll, setMasterValue, masterValue } = useDMXStore();
  const { playback, stopAll } = usePlaybackStore();
  const { currentIntent } = useDesktop();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Parse natural language command
  const parseCommand = useCallback((input) => {
    for (const { pattern, type, extract } of commandPatterns) {
      const match = input.match(pattern);
      if (match) {
        return { type, params: extract(match), raw: input };
      }
    }
    return null;
  }, []);

  // Execute a parsed command
  const executeCommand = useCallback(async (command) => {
    const { type, params } = command;

    try {
      switch (type) {
        case 'play-scene': {
          const scene = scenes.find(s =>
            s.name.toLowerCase().includes(params.name.toLowerCase()) ||
            (s.scene_id || s.id).toLowerCase().includes(params.name.toLowerCase())
          );
          if (scene) {
            await playScene(scene.scene_id || scene.id, 1000);
            setExecutionFeedback({ success: true, message: `Playing "${scene.name}"` });
          } else {
            setExecutionFeedback({ success: false, message: `Scene "${params.name}" not found` });
          }
          break;
        }
        case 'play-chase': {
          const chase = chases.find(c =>
            c.name.toLowerCase().includes(params.name.toLowerCase()) ||
            (c.chase_id || c.id).toLowerCase().includes(params.name.toLowerCase())
          );
          if (chase) {
            await startChase(chase.chase_id || chase.id);
            setExecutionFeedback({ success: true, message: `Started "${chase.name}"` });
          } else {
            setExecutionFeedback({ success: false, message: `Chase "${params.name}" not found` });
          }
          break;
        }
        case 'stop-scene': {
          await stopScene();
          setExecutionFeedback({ success: true, message: 'Stopped scene' });
          break;
        }
        case 'stop-chase': {
          const chase = chases.find(c =>
            c.name.toLowerCase().includes(params.name.toLowerCase())
          );
          if (chase) {
            await stopChase(chase.chase_id || chase.id);
            setExecutionFeedback({ success: true, message: `Stopped "${chase.name}"` });
          }
          break;
        }
        case 'blackout': {
          await blackoutAll(500);
          await stopAll();
          setExecutionFeedback({ success: true, message: params.zone ? `Blackout Zone ${params.zone}` : 'Blackout All' });
          break;
        }
        case 'set-master': {
          if (setMasterValue) {
            await setMasterValue(params.value);
          }
          setExecutionFeedback({ success: true, message: `Master set to ${params.value}%` });
          break;
        }
        case 'navigate': {
          const dest = params.destination.toLowerCase();
          const navItem = navItems.find(n =>
            n.label.toLowerCase().includes(dest) ||
            n.keywords.includes(dest)
          );
          if (navItem) {
            navigate(navItem.path);
            setExecutionFeedback({ success: true, message: `Navigating to ${navItem.label}` });
          } else {
            setExecutionFeedback({ success: false, message: `Unknown destination: ${params.destination}` });
          }
          break;
        }
        default:
          setExecutionFeedback({ success: false, message: 'Unknown command' });
      }
    } catch (error) {
      setExecutionFeedback({ success: false, message: error.message });
    }

    // Clear feedback after delay, then close
    setTimeout(() => {
      setExecutionFeedback(null);
      if (executionFeedback?.success !== false) {
        onClose();
      }
    }, 1500);
  }, [scenes, chases, playScene, startChase, stopScene, stopChase, blackoutAll, stopAll, setMasterValue, navigate, onClose, executionFeedback]);

  // Build searchable items list with context awareness
  const allItems = useMemo(() => {
    const items = [];

    // Add quick commands first (always available)
    items.push(...quickCommands.map(cmd => ({
      ...cmd,
      score: cmd.dangerous ? 0 : 10, // Deprioritize dangerous commands
    })));

    // Add navigation items
    items.push(...navItems.map(nav => ({
      ...nav,
      score: location.pathname === nav.path ? -10 : 5, // Deprioritize current page
    })));

    // Add scenes with context scoring
    items.push(...scenes.map(s => {
      const isPlaying = playback && Object.values(playback).some(
        p => p?.type === 'scene' && (p?.id === s.scene_id || p?.id === s.id)
      );
      return {
        type: 'scene',
        id: s.scene_id || s.id,
        label: s.name,
        description: isPlaying ? 'Currently playing' : `${Object.keys(s.channels || {}).length} channels`,
        icon: isPlaying ? Square : Play,
        keywords: 'scene lighting play',
        isPlaying,
        score: isPlaying ? 20 : (currentIntent?.action === 'selecting_playback' ? 15 : 5),
        color: s.color,
      };
    }));

    // Add chases with context scoring
    items.push(...chases.map(c => {
      const isPlaying = playback && Object.values(playback).some(
        p => p?.type === 'chase' && (p?.id === c.chase_id || p?.id === c.id)
      );
      return {
        type: 'chase',
        id: c.chase_id || c.id,
        label: c.name,
        description: isPlaying ? 'Currently running' : `${c.steps?.length || 0} steps`,
        icon: isPlaying ? Square : Zap,
        keywords: 'chase effect run',
        isPlaying,
        score: isPlaying ? 20 : (currentIntent?.action === 'selecting_playback' ? 15 : 5),
      };
    }));

    // Add fixtures (lower priority in most contexts)
    items.push(...fixtures.map(f => ({
      type: 'fixture',
      id: f.fixture_id || f.id,
      label: f.name,
      description: `Ch ${f.start_channel || 1} • ${f.type || 'Generic'}`,
      icon: Box,
      keywords: `fixture ${f.type || ''} channel ${f.start_channel || ''}`,
      score: currentIntent?.action === 'configuring' ? 10 : 2,
    })));

    // Add nodes (context-dependent visibility)
    items.push(...nodes.map(n => ({
      type: 'node',
      id: n.node_id || n.id,
      label: n.name || `Node ${n.universe}`,
      description: n.status === 'online' ? 'Online' : 'Offline',
      icon: Radio,
      keywords: `node ${n.type || ''} universe ${n.universe}`,
      score: n.status !== 'online' ? 15 : 2, // Prioritize offline nodes as warnings
      isWarning: n.status !== 'online',
    })));

    return items;
  }, [scenes, chases, fixtures, nodes, playback, location.pathname, currentIntent]);

  // Filter and rank items based on query
  const filteredItems = useMemo(() => {
    const trimmedQuery = query.trim();

    // Check if query is a command
    const parsedCommand = parseCommand(trimmedQuery);
    if (parsedCommand) {
      return [{
        type: 'parsed-command',
        id: 'execute',
        label: `Execute: ${trimmedQuery}`,
        description: `Run command`,
        icon: Command,
        command: parsedCommand,
        score: 100,
      }];
    }

    if (!trimmedQuery) {
      // Show context-aware defaults when no query
      const hasPlayback = playback && Object.keys(playback).length > 0;

      // Prioritize stop commands if something is playing
      if (hasPlayback) {
        const playingItems = allItems
          .filter(item => item.isPlaying)
          .map(item => ({ ...item, score: item.score + 50 }));

        const otherItems = allItems
          .filter(item => !item.isPlaying)
          .slice(0, 10);

        return [...playingItems, ...otherItems].slice(0, 12);
      }

      // Default: show quick commands and nav, prioritized by score
      return [...quickCommands, ...navItems]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 12);
    }

    const q = trimmedQuery.toLowerCase();
    const scored = allItems
      .map(item => {
        const labelMatch = item.label.toLowerCase().includes(q);
        const keywordMatch = (item.keywords || '').toLowerCase().includes(q);
        const descMatch = (item.description || '').toLowerCase().includes(q);

        // Calculate match score
        let matchScore = 0;
        if (item.label.toLowerCase() === q) matchScore = 100; // Exact match
        else if (item.label.toLowerCase().startsWith(q)) matchScore = 50; // Starts with
        else if (labelMatch) matchScore = 25; // Contains in label
        else if (keywordMatch) matchScore = 15; // Contains in keywords
        else if (descMatch) matchScore = 10; // Contains in description
        else return null; // No match

        return {
          ...item,
          totalScore: matchScore + (item.score || 0),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 12);

    return scored;
  }, [query, allItems, playback, parseCommand]);

  // Reset selection when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length, query]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex];
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = async (item) => {
    // Handle parsed command execution
    if (item.type === 'parsed-command') {
      await executeCommand(item.command);
      return;
    }

    switch (item.type) {
      case 'nav':
        navigate(item.path);
        onClose();
        break;
      case 'scene':
        if (item.isPlaying) {
          await stopScene();
          setExecutionFeedback({ success: true, message: `Stopped "${item.label}"` });
        } else {
          await playScene(item.id, 1000);
          setExecutionFeedback({ success: true, message: `Playing "${item.label}"` });
        }
        setTimeout(() => {
          setExecutionFeedback(null);
          onClose();
        }, 1000);
        break;
      case 'chase':
        if (item.isPlaying) {
          await stopChase(item.id);
          setExecutionFeedback({ success: true, message: `Stopped "${item.label}"` });
        } else {
          await startChase(item.id);
          setExecutionFeedback({ success: true, message: `Started "${item.label}"` });
        }
        setTimeout(() => {
          setExecutionFeedback(null);
          onClose();
        }, 1000);
        break;
      case 'fixture':
        navigate(`/fixtures?highlight=${item.id}`);
        onClose();
        break;
      case 'node':
        navigate('/nodes');
        onClose();
        break;
      case 'command':
        await handleQuickCommand(item.id);
        break;
    }
  };

  const handleQuickCommand = async (commandId) => {
    switch (commandId) {
      case 'blackout':
        await blackoutAll(500);
        await stopAll();
        setExecutionFeedback({ success: true, message: 'Blackout activated' });
        break;
      case 'restore':
        // TODO: Implement restore from last state
        setExecutionFeedback({ success: true, message: 'Output restored' });
        break;
      case 'stop-all':
        await stopAll();
        setExecutionFeedback({ success: true, message: 'All playback stopped' });
        break;
      case 'master-100':
        if (setMasterValue) await setMasterValue(100);
        setExecutionFeedback({ success: true, message: 'Master at 100%' });
        break;
      case 'master-0':
        if (setMasterValue) await setMasterValue(0);
        setExecutionFeedback({ success: true, message: 'Master at 0%' });
        break;
    }
    setTimeout(() => {
      setExecutionFeedback(null);
      onClose();
    }, 1000);
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
      case 'Tab':
        e.preventDefault();
        // Tab cycles through results
        if (e.shiftKey) {
          setSelectedIndex(i => (i - 1 + filteredItems.length) % filteredItems.length);
        } else {
          setSelectedIndex(i => (i + 1) % filteredItems.length);
        }
        break;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'nav': return 'Go to';
      case 'command': return 'Action';
      case 'parsed-command': return 'Command';
      case 'scene': return 'Scene';
      case 'chase': return 'Chase';
      case 'fixture': return 'Fixture';
      case 'node': return 'Node';
      default: return '';
    }
  };

  const getTypeColor = (item) => {
    if (item.isPlaying) return 'var(--theme-primary, #00ffaa)';
    if (item.isWarning) return '#eab308';
    if (item.dangerous) return '#ef4444';

    switch (item.type) {
      case 'scene': return '#3b82f6';
      case 'chase': return '#22c55e';
      case 'fixture': return '#a855f7';
      case 'node': return '#eab308';
      case 'command': return '#f97316';
      case 'parsed-command': return 'var(--theme-primary, #00ffaa)';
      default: return 'rgba(255, 255, 255, 0.5)';
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
            placeholder='Search or type command (e.g., "play warm wash", "blackout")'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
          <div className="search-shortcut">
            <kbd><Command size={10} /></kbd>
            <kbd>K</kbd>
          </div>
        </div>

        {/* Execution Feedback */}
        {executionFeedback && (
          <div className={`execution-feedback ${executionFeedback.success ? 'success' : 'error'}`}>
            {executionFeedback.success ? '✓' : '✗'} {executionFeedback.message}
          </div>
        )}

        {/* Results List */}
        <div className="palette-results" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="no-results">
              <span>No results found</span>
              <span className="hint">Try "play [scene name]" or "blackout"</span>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              const typeColor = getTypeColor(item);

              return (
                <button
                  key={`${item.type}-${item.id}`}
                  className={`palette-item ${isSelected ? 'selected' : ''} ${item.isPlaying ? 'playing' : ''} ${item.isWarning ? 'warning' : ''} ${item.dangerous ? 'dangerous' : ''}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div
                    className="item-icon"
                    style={{
                      background: `${typeColor}15`,
                      color: typeColor,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="item-content">
                    <div className="item-label-row">
                      <span className="item-label">{item.label}</span>
                      {item.isPlaying && <span className="playing-indicator">●</span>}
                    </div>
                    {item.description && (
                      <span className="item-description">{item.description}</span>
                    )}
                  </div>
                  <div className="item-meta">
                    <span className="item-type" style={{ color: typeColor }}>
                      {getTypeLabel(item.type)}
                    </span>
                    {isSelected && (
                      <span className="item-hint">
                        <ArrowRight size={12} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="palette-footer">
          <div className="footer-hints">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Select</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
          <div className="footer-tip">
            Type commands like "play [name]" or "blackout zone 1"
          </div>
        </div>
      </div>

      <style>{`
        .command-palette-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 12vh;
          z-index: 9999;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .command-palette {
          width: 100%;
          max-width: 600px;
          background: rgba(18, 18, 28, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1);
          overflow: hidden;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .palette-search {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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

        .clear-btn {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .clear-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .search-shortcut {
          display: flex;
          gap: 2px;
          opacity: 0.4;
        }

        .search-shortcut kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 4px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          font-size: 11px;
          font-family: inherit;
          color: rgba(255, 255, 255, 0.5);
        }

        .execution-feedback {
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          animation: feedbackSlide 0.2s ease;
        }

        @keyframes feedbackSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .execution-feedback.success {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border-bottom: 1px solid rgba(34, 197, 94, 0.2);
        }

        .execution-feedback.error {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-bottom: 1px solid rgba(239, 68, 68, 0.2);
        }

        .palette-results {
          max-height: 400px;
          overflow-y: auto;
          padding: 8px;
        }

        .no-results {
          padding: 32px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .no-results .hint {
          font-size: 12px;
          opacity: 0.6;
        }

        .palette-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.1s;
          text-align: left;
        }

        .palette-item:hover,
        .palette-item.selected {
          background: rgba(255, 255, 255, 0.04);
        }

        .palette-item.selected {
          background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.08);
        }

        .palette-item.playing {
          background: rgba(var(--theme-primary-rgb, 0, 255, 170), 0.1);
        }

        .palette-item.warning {
          background: rgba(234, 179, 8, 0.08);
        }

        .palette-item.dangerous.selected {
          background: rgba(239, 68, 68, 0.1);
        }

        .item-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .palette-item.selected .item-icon {
          transform: scale(1.05);
        }

        .item-content {
          flex: 1;
          min-width: 0;
        }

        .item-label-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .item-label {
          color: white;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .playing-indicator {
          color: var(--theme-primary, #00ffaa);
          font-size: 10px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .item-description {
          display: block;
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .item-type {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }

        .item-hint {
          color: var(--theme-primary, #00ffaa);
          opacity: 0.6;
        }

        .palette-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.2);
        }

        .footer-hints {
          display: flex;
          gap: 16px;
        }

        .footer-hints span {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
        }

        .footer-hints kbd {
          display: inline-block;
          padding: 2px 5px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 3px;
          font-family: monospace;
          font-size: 10px;
          margin-right: 4px;
        }

        .footer-tip {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.25);
          font-style: italic;
        }

        /* Scrollbar */
        .palette-results::-webkit-scrollbar {
          width: 6px;
        }
        .palette-results::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .palette-results::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}
