import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Unified Playback Store
 *
 * Frontend state management for the unified playback system.
 * Communicates with the backend's unified_playback.py via REST API.
 *
 * Features:
 * - Track all active playback sessions
 * - Unified play/stop/pause/resume for all content types
 * - Session status monitoring
 * - Integration with intentContextStore for AI awareness
 */

const API_BASE = '/api/unified';

const useUnifiedPlaybackStore = create(
  subscribeWithSelector((set, get) => ({
    // Current sessions
    sessions: [],
    isLoading: false,
    error: null,

    // Engine status
    engineRunning: false,
    engineFps: 0,
    frameCount: 0,

    // Quick access to current playback
    currentSession: null,
    isPlaying: false,

    // Last restored session (for session restore feature)
    lastSession: null,

    // ========== Fetch Status ==========

    fetchStatus: async () => {
      try {
        const res = await fetch(`${API_BASE}/status`);
        const data = await res.json();

        set({
          engineRunning: data.running,
          engineFps: data.fps,
          frameCount: data.frame_count,
          sessions: data.sessions || [],
          isPlaying: (data.sessions || []).length > 0,
          currentSession: data.sessions?.[0] || null,
        });

        return data;
      } catch (err) {
        console.error('Failed to fetch unified status:', err);
        set({ error: err.message });
        return null;
      }
    },

    fetchSessions: async () => {
      try {
        const res = await fetch(`${API_BASE}/sessions`);
        const sessions = await res.json();

        set({
          sessions,
          isPlaying: sessions.length > 0,
          currentSession: sessions[0] || null,
        });

        return sessions;
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        return [];
      }
    },

    // ========== Play Methods ==========

    playLook: async (lookId, options = {}) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE}/play/look/${lookId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            universes: options.universes || [2, 3, 4, 5],
            fade_ms: options.fadeMs || 0,
          }),
        });

        const data = await res.json();
        if (data.success) {
          await get().fetchSessions();
        }
        set({ isLoading: false });
        return data;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        return { success: false, error: err.message };
      }
    },

    playSequence: async (sequenceId, options = {}) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE}/play/sequence/${sequenceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            universes: options.universes || [2, 3, 4, 5],
          }),
        });

        const data = await res.json();
        if (data.success) {
          await get().fetchSessions();
        }
        set({ isLoading: false });
        return data;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        return { success: false, error: err.message };
      }
    },

    playChase: async (chaseId, options = {}) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE}/play/chase/${chaseId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            universes: options.universes || [2, 3, 4, 5],
          }),
        });

        const data = await res.json();
        if (data.success) {
          await get().fetchSessions();
        }
        set({ isLoading: false });
        return data;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        return { success: false, error: err.message };
      }
    },

    playScene: async (sceneId, options = {}) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE}/play/scene/${sceneId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            universes: options.universes || [2, 3, 4, 5],
            fade_ms: options.fadeMs || 0,
          }),
        });

        const data = await res.json();
        if (data.success) {
          await get().fetchSessions();
        }
        set({ isLoading: false });
        return data;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        return { success: false, error: err.message };
      }
    },

    playEffect: async (effectType, params = {}, options = {}) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE}/play/effect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            effect_type: effectType,
            params,
            universes: options.universes || [2, 3, 4, 5],
          }),
        });

        const data = await res.json();
        if (data.success) {
          await get().fetchSessions();
        }
        set({ isLoading: false });
        return data;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        return { success: false, error: err.message };
      }
    },

    // ========== Control Methods ==========

    blackout: async (options = {}) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE}/blackout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            universes: options.universes || [2, 3, 4, 5],
            fade_ms: options.fadeMs ?? 1000,
          }),
        });

        const data = await res.json();
        if (data.success) {
          await get().fetchSessions();
        }
        set({ isLoading: false });
        return data;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        return { success: false, error: err.message };
      }
    },

    stop: async (sessionId = null, fadeMs = 0) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE}/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            fade_ms: fadeMs,
          }),
        });

        const data = await res.json();
        await get().fetchSessions();
        set({ isLoading: false });
        return data;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        return { success: false, error: err.message };
      }
    },

    stopAll: async (fadeMs = 0) => {
      return get().stop(null, fadeMs);
    },

    stopType: async (playbackType, fadeMs = 0) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`${API_BASE}/stop/${playbackType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fade_ms: fadeMs }),
        });

        const data = await res.json();
        await get().fetchSessions();
        set({ isLoading: false });
        return data;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        return { success: false, error: err.message };
      }
    },

    pause: async (sessionId) => {
      try {
        const res = await fetch(`${API_BASE}/pause/${sessionId}`, {
          method: 'POST',
        });
        const data = await res.json();
        await get().fetchSessions();
        return data;
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    resume: async (sessionId) => {
      try {
        const res = await fetch(`${API_BASE}/resume/${sessionId}`, {
          method: 'POST',
        });
        const data = await res.json();
        await get().fetchSessions();
        return data;
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    // ========== Session Restore ==========

    saveLastSession: () => {
      const { currentSession } = get();
      if (currentSession) {
        set({ lastSession: { ...currentSession, savedAt: Date.now() } });
        try {
          localStorage.setItem('aether_last_session', JSON.stringify(currentSession));
        } catch (e) {
          console.warn('Failed to save session to localStorage:', e);
        }
      }
    },

    loadLastSession: () => {
      try {
        const saved = localStorage.getItem('aether_last_session');
        if (saved) {
          const session = JSON.parse(saved);
          set({ lastSession: session });
          return session;
        }
      } catch (e) {
        console.warn('Failed to load session from localStorage:', e);
      }
      return null;
    },

    restoreLastSession: async () => {
      const { lastSession } = get();
      if (!lastSession) return { success: false, error: 'No session to restore' };

      const { type, name } = lastSession;

      // Extract ID from session_id (format: "type_id_timestamp")
      const parts = lastSession.session_id?.split('_') || [];
      const contentId = parts.length >= 2 ? parts.slice(1, -1).join('_') : null;

      if (!contentId) {
        return { success: false, error: 'Could not determine content ID' };
      }

      // Replay based on type
      switch (type) {
        case 'look':
          return get().playLook(contentId);
        case 'sequence':
          return get().playSequence(contentId);
        case 'chase':
          return get().playChase(contentId);
        case 'scene':
          return get().playScene(contentId);
        default:
          return { success: false, error: `Unknown type: ${type}` };
      }
    },

    clearLastSession: () => {
      set({ lastSession: null });
      try {
        localStorage.removeItem('aether_last_session');
      } catch (e) {
        // Ignore
      }
    },

    // ========== Utilities ==========

    getSessionByType: (type) => {
      return get().sessions.find(s => s.type === type);
    },

    hasActiveSession: () => {
      return get().sessions.some(s => s.state === 'playing' || s.state === 'fading_in');
    },

    // ========== Polling ==========

    _pollInterval: null,

    startPolling: (intervalMs = 1000) => {
      const { _pollInterval } = get();
      if (_pollInterval) return;

      const interval = setInterval(() => {
        get().fetchSessions();
      }, intervalMs);

      set({ _pollInterval: interval });
    },

    stopPolling: () => {
      const { _pollInterval } = get();
      if (_pollInterval) {
        clearInterval(_pollInterval);
        set({ _pollInterval: null });
      }
    },
  }))
);

export default useUnifiedPlaybackStore;

// Convenience hooks
export const useIsPlaying = () => useUnifiedPlaybackStore(s => s.isPlaying);
export const useCurrentSession = () => useUnifiedPlaybackStore(s => s.currentSession);
export const useSessions = () => useUnifiedPlaybackStore(s => s.sessions);
