import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlaybackStore from '../store/playbackStore';
import useDMXStore from '../store/dmxStore';
import useSceneStore from '../store/sceneStore';

/**
 * Desktop keyboard shortcuts hook
 * Provides professional DMX-style keyboard control
 */
export default function useDesktopShortcuts({ onCommandPalette } = {}) {
  const navigate = useNavigate();
  const { playback, stopAll } = usePlaybackStore();
  const { blackoutAll } = useDMXStore();
  const { scenes, playScene } = useSceneStore();

  const handleKeyDown = useCallback((e) => {
    // Skip if typing in an input field
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) {
      return;
    }

    const isMod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();

    // Cmd/Ctrl + K - Command Palette
    if (isMod && key === 'k') {
      e.preventDefault();
      onCommandPalette?.();
      return;
    }

    // Escape - Blackout toggle
    if (key === 'escape') {
      e.preventDefault();
      blackoutAll(500);
      stopAll();
      return;
    }

    // Space - Play/Pause (only without modifiers)
    if (key === ' ' && !isMod && !e.shiftKey) {
      e.preventDefault();
      if (Object.keys(playback).length > 0) {
        stopAll();
      } else {
        // If nothing playing, go to scenes
        navigate('/scenes');
      }
      return;
    }

    // Number keys 1-9 for quick scene access (without modifiers)
    if (!isMod && !e.shiftKey && /^[1-9]$/.test(key)) {
      e.preventDefault();
      const index = parseInt(key) - 1;

      // Navigation shortcuts
      const navRoutes = [
        '/',          // 1 - Dashboard
        '/scenes',    // 2 - Scenes
        '/chases',    // 3 - Chases
        '/faders',    // 4 - Faders
        '/effects',   // 5 - Effects
        '/looks',     // 6 - Looks
        '/cue-stacks',// 7 - Cue Stacks
        '/shows',     // 8 - Shows
        '/fixtures',  // 9 - Fixtures
      ];

      if (index < navRoutes.length) {
        navigate(navRoutes[index]);
      }
      return;
    }

    // 0 - Nodes
    if (!isMod && !e.shiftKey && key === '0') {
      e.preventDefault();
      navigate('/nodes');
      return;
    }

    // Enter - Confirm/GO (context dependent)
    if (key === 'enter' && !isMod) {
      // This will be handled by specific views for cue execution
      return;
    }

    // Delete/Backspace - Delete selected (context dependent)
    if ((key === 'delete' || key === 'backspace') && !isMod) {
      // This will be handled by specific views
      return;
    }

    // Cmd/Ctrl + S - Save (prevent browser default, handle in context)
    if (isMod && key === 's') {
      e.preventDefault();
      // Could trigger save current state as scene
      return;
    }

    // Cmd/Ctrl + Z - Undo (future feature)
    if (isMod && key === 'z') {
      e.preventDefault();
      // Placeholder for undo functionality
      return;
    }

  }, [navigate, playback, stopAll, blackoutAll, onCommandPalette]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
}

/**
 * Hook for view-specific shortcuts
 * Use this in individual views to add context-specific shortcuts
 */
export function useViewShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if typing in an input field
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      for (const shortcut of shortcuts) {
        const matches =
          shortcut.key === key &&
          (shortcut.mod === undefined || shortcut.mod === isMod) &&
          (shortcut.shift === undefined || shortcut.shift === e.shiftKey);

        if (matches) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
