import React, { useState, useEffect, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import DesktopToolbar from './DesktopToolbar';
import InspectorPanel from './InspectorPanel';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';
import ToastContainer from '../Toast';
import useDesktopShortcuts from '../../hooks/useDesktopShortcuts';

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
});

export const useDesktop = () => useContext(DesktopContext);

export default function DesktopShell({ children }) {
  const location = useLocation();

  // Desktop state
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Initialize keyboard shortcuts
  useDesktopShortcuts({
    onCommandPalette: () => setCommandPaletteOpen(true),
  });

  // Clear selection when navigating
  useEffect(() => {
    setSelectedItem(null);
  }, [location.pathname]);

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
  };

  return (
    <DesktopContext.Provider value={contextValue}>
      <div className="desktop-shell">
        {/* Toolbar - Always visible at top */}
        <DesktopToolbar />

        {/* Main content area */}
        <div className="desktop-main">
          {/* Sidebar - Left navigation */}
          <DesktopSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main content - Routes render here */}
          <main className="desktop-content">
            {children}
          </main>

          {/* Inspector Panel - Right side */}
          <InspectorPanel
            collapsed={inspectorCollapsed}
            onToggle={() => setInspectorCollapsed(!inspectorCollapsed)}
            item={hoveredItem || selectedItem}
          />
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

        .desktop-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .desktop-content {
          flex: 1;
          overflow: auto;
          position: relative;
          background: linear-gradient(180deg, #0a0a0f 0%, #0f0f18 100%);
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
