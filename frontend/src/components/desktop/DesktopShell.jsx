import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import DesktopToolbar from './DesktopToolbar';
import InspectorPanel from './InspectorPanel';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';
import ToastContainer from '../Toast';
import useDesktopShortcuts from '../../hooks/useDesktopShortcuts';
import usePlaybackStore from '../../store/playbackStore';

// Storage keys for panel state persistence
const STORAGE_KEYS = {
  sidebarWidth: 'aether-sidebar-width',
  inspectorWidth: 'aether-inspector-width',
  sidebarCollapsed: 'aether-sidebar-collapsed',
  inspectorCollapsed: 'aether-inspector-collapsed',
};

// Default panel sizes
const PANEL_DEFAULTS = {
  sidebarWidth: 220,
  sidebarMinWidth: 64,
  sidebarMaxWidth: 320,
  inspectorWidth: 300,
  inspectorMinWidth: 240,
  inspectorMaxWidth: 480,
};

// Desktop context for sharing state across components
export const DesktopContext = createContext({
  selectedItem: null,
  setSelectedItem: () => {},
  hoveredItem: null,
  setHoveredItem: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  inspectorCollapsed: false,
  setInspectorCollapsed: () => {},
  commandPaletteOpen: false,
  setCommandPaletteOpen: () => {},
  sidebarWidth: PANEL_DEFAULTS.sidebarWidth,
  inspectorWidth: PANEL_DEFAULTS.inspectorWidth,
  // Intent context - what the user is currently doing
  currentIntent: null,
  setCurrentIntent: () => {},
  // Split view state
  splitView: null,
  setSplitView: () => {},
});

export const useDesktop = () => useContext(DesktopContext);

export default function DesktopShell({ children }) {
  const location = useLocation();
  const { playback } = usePlaybackStore();

  // Desktop state with persistence
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
    return stored ? JSON.parse(stored) : false;
  });
  const [inspectorCollapsed, setInspectorCollapsedState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.inspectorCollapsed);
    return stored ? JSON.parse(stored) : false;
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Resizable panel widths
  const [sidebarWidth, setSidebarWidthState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.sidebarWidth);
    return stored ? parseInt(stored, 10) : PANEL_DEFAULTS.sidebarWidth;
  });
  const [inspectorWidth, setInspectorWidthState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.inspectorWidth);
    return stored ? parseInt(stored, 10) : PANEL_DEFAULTS.inspectorWidth;
  });

  // Panel resize state
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingInspector, setIsResizingInspector] = useState(false);
  const shellRef = useRef(null);

  // Intent context - tracks what user is doing for intelligent UI
  const [currentIntent, setCurrentIntent] = useState(null);

  // Split view state (for temporary two-pane editing)
  const [splitView, setSplitView] = useState(null);

  // Persist collapsed state
  const setSidebarCollapsed = useCallback((value) => {
    const newValue = typeof value === 'function' ? value(sidebarCollapsed) : value;
    setSidebarCollapsedState(newValue);
    localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, JSON.stringify(newValue));
  }, [sidebarCollapsed]);

  const setInspectorCollapsed = useCallback((value) => {
    const newValue = typeof value === 'function' ? value(inspectorCollapsed) : value;
    setInspectorCollapsedState(newValue);
    localStorage.setItem(STORAGE_KEYS.inspectorCollapsed, JSON.stringify(newValue));
  }, [inspectorCollapsed]);

  // Persist panel widths
  const setSidebarWidth = useCallback((width) => {
    const clampedWidth = Math.min(Math.max(width, PANEL_DEFAULTS.sidebarMinWidth), PANEL_DEFAULTS.sidebarMaxWidth);
    setSidebarWidthState(clampedWidth);
    localStorage.setItem(STORAGE_KEYS.sidebarWidth, clampedWidth.toString());
  }, []);

  const setInspectorWidth = useCallback((width) => {
    const clampedWidth = Math.min(Math.max(width, PANEL_DEFAULTS.inspectorMinWidth), PANEL_DEFAULTS.inspectorMaxWidth);
    setInspectorWidthState(clampedWidth);
    localStorage.setItem(STORAGE_KEYS.inspectorWidth, clampedWidth.toString());
  }, []);

  // Handle sidebar resize
  const handleSidebarResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  }, []);

  // Handle inspector resize
  const handleInspectorResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingInspector(true);
  }, []);

  // Handle mouse move for resizing
  useEffect(() => {
    if (!isResizingSidebar && !isResizingInspector) return;

    const handleMouseMove = (e) => {
      if (isResizingSidebar && shellRef.current) {
        const shellRect = shellRef.current.getBoundingClientRect();
        const newWidth = e.clientX - shellRect.left;
        setSidebarWidth(newWidth);
      }
      if (isResizingInspector && shellRef.current) {
        const shellRect = shellRef.current.getBoundingClientRect();
        const newWidth = shellRect.right - e.clientX;
        setInspectorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingInspector(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isResizingInspector, setSidebarWidth, setInspectorWidth]);

  // Initialize keyboard shortcuts with panel toggles
  useDesktopShortcuts({
    onCommandPalette: () => setCommandPaletteOpen(true),
    onToggleSidebar: () => setSidebarCollapsed(v => !v),
    onToggleInspector: () => setInspectorCollapsed(v => !v),
  });

  // Keyboard shortcuts for panel visibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + 1: Toggle sidebar
      if (isMod && e.key === '1') {
        e.preventDefault();
        setSidebarCollapsed(v => !v);
      }
      // Cmd/Ctrl + 2: Toggle inspector
      if (isMod && e.key === '2') {
        e.preventDefault();
        setInspectorCollapsed(v => !v);
      }
      // Cmd/Ctrl + 3: Focus main content (close both panels)
      if (isMod && e.key === '3') {
        e.preventDefault();
        setSidebarCollapsed(true);
        setInspectorCollapsed(true);
      }
      // Cmd/Ctrl + 0: Reset panels to default
      if (isMod && e.key === '`') {
        e.preventDefault();
        setSidebarCollapsed(false);
        setInspectorCollapsed(false);
        setSidebarWidth(PANEL_DEFAULTS.sidebarWidth);
        setInspectorWidth(PANEL_DEFAULTS.inspectorWidth);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarCollapsed, setInspectorCollapsed, setSidebarWidth, setInspectorWidth]);

  // Clear selection when navigating
  useEffect(() => {
    setSelectedItem(null);
  }, [location.pathname]);

  // Update intent based on current route and playback
  useEffect(() => {
    const path = location.pathname;
    let intent = { route: path, action: 'browsing' };

    if (path === '/scenes' || path === '/chases' || path === '/looks') {
      intent.action = 'selecting_playback';
    } else if (path === '/fixtures') {
      intent.action = 'configuring';
    } else if (path === '/faders') {
      intent.action = 'live_control';
    } else if (path.includes('edit')) {
      intent.action = 'editing';
    }

    // Add playback context
    if (Object.keys(playback).length > 0) {
      intent.hasActivePlayback = true;
      intent.activeCount = Object.keys(playback).length;
    }

    setCurrentIntent(intent);
  }, [location.pathname, playback]);

  const contextValue = {
    selectedItem,
    setSelectedItem,
    hoveredItem,
    setHoveredItem,
    sidebarCollapsed,
    setSidebarCollapsed,
    inspectorCollapsed,
    setInspectorCollapsed,
    commandPaletteOpen,
    setCommandPaletteOpen,
    sidebarWidth,
    inspectorWidth,
    currentIntent,
    setCurrentIntent,
    splitView,
    setSplitView,
  };

  // Calculate actual sidebar width (collapsed or resized)
  const actualSidebarWidth = sidebarCollapsed ? PANEL_DEFAULTS.sidebarMinWidth : sidebarWidth;
  const actualInspectorWidth = inspectorCollapsed ? 20 : inspectorWidth;

  return (
    <DesktopContext.Provider value={contextValue}>
      <div
        ref={shellRef}
        className={`desktop-shell ${isResizingSidebar || isResizingInspector ? 'resizing' : ''}`}
      >
        {/* Toolbar - Always visible at top */}
        <DesktopToolbar />

        {/* Main content area */}
        <div className="desktop-main">
          {/* Sidebar - Left navigation */}
          <div
            className="sidebar-container"
            style={{ width: actualSidebarWidth }}
          >
            <DesktopSidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              width={sidebarWidth}
            />
            {/* Sidebar resize handle */}
            {!sidebarCollapsed && (
              <div
                className="resize-handle resize-handle-right"
                onMouseDown={handleSidebarResizeStart}
              />
            )}
          </div>

          {/* Main content - Routes render here */}
          <main className="desktop-content">
            {splitView ? (
              <div className="split-content">
                <div className="split-pane primary">{children}</div>
                <div className="split-divider" />
                <div className="split-pane secondary">{splitView}</div>
              </div>
            ) : (
              children
            )}
          </main>

          {/* Inspector Panel - Right side */}
          <div
            className="inspector-container"
            style={{ width: actualInspectorWidth }}
          >
            {/* Inspector resize handle */}
            {!inspectorCollapsed && (
              <div
                className="resize-handle resize-handle-left"
                onMouseDown={handleInspectorResizeStart}
              />
            )}
            <InspectorPanel
              collapsed={inspectorCollapsed}
              onToggle={() => setInspectorCollapsed(!inspectorCollapsed)}
              item={hoveredItem || selectedItem}
              width={inspectorWidth}
            />
          </div>
        </div>

        {/* Status Bar - Bottom */}
        <StatusBar />

        {/* Command Palette - Modal overlay */}
        {commandPaletteOpen && (
          <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
        )}

        {/* Toast notifications */}
        <ToastContainer />
      </div>

      <style>{`
        .desktop-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          background: #0a0a0f;
          overflow: hidden;
        }

        .desktop-shell.resizing {
          cursor: col-resize;
          user-select: none;
        }

        .desktop-shell.resizing * {
          pointer-events: none;
        }

        .desktop-shell.resizing .resize-handle {
          pointer-events: auto;
        }

        .desktop-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .sidebar-container {
          position: relative;
          display: flex;
          transition: width 0.2s ease;
        }

        .inspector-container {
          position: relative;
          display: flex;
          transition: width 0.2s ease;
        }

        .resize-handle {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 6px;
          cursor: col-resize;
          z-index: 100;
          transition: background 0.15s;
        }

        .resize-handle:hover,
        .resize-handle:active {
          background: var(--theme-primary, #00ffaa);
          opacity: 0.3;
        }

        .resize-handle-right {
          right: 0;
        }

        .resize-handle-left {
          left: 0;
        }

        .desktop-content {
          flex: 1;
          overflow: auto;
          position: relative;
          background: linear-gradient(180deg, #0a0a0f 0%, #0f0f18 100%);
          min-width: 400px;
        }

        /* Split view for temporary two-pane editing */
        .split-content {
          display: flex;
          height: 100%;
        }

        .split-pane {
          flex: 1;
          overflow: auto;
          min-width: 300px;
        }

        .split-pane.primary {
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }

        .split-divider {
          width: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Scrollbar styling for desktop */
        .desktop-content::-webkit-scrollbar {
          width: 10px;
        }
        .desktop-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .desktop-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
        }
        .desktop-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </DesktopContext.Provider>
  );
}
