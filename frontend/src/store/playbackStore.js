import { create } from 'zustand';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

/**
 * Unified Playback Store - Single Source of Truth (SSOT)
 *
 * Only ONE scene OR chase can be active at a time (per universe),
 * UNLESS targeting specific fixtures/groups/channels.
 *
 * This store syncs with the backend PlaybackManager and emits
 * real-time updates via WebSocket.
 */
const usePlaybackStore = create((set, get) => ({
  // Current playback state per universe: { universe: { type: 'scene'|'chase', id: '...', started: '...' } }
  playback: {},
  loading: false,

  // Initialize and sync with backend
  initialize: async () => {
    await get().syncStatus();
    console.log('✅ Playback store initialized');
  },

  // Sync with backend SSOT
  syncStatus: async () => {
    try {
      const res = await axios.get(getAetherCore() + '/api/playback/status');
      set({ playback: res.data || {} });
    } catch (e) {
      console.error('Failed to sync playback status:', e);
    }
  },

  // Get current playback for a universe
  getPlayback: (universe = 1) => {
    return get().playback[universe] || null;
  },

  // Check if a specific scene is currently playing
  isScenePlaying: (sceneId) => {
    const playback = get().playback;
    return Object.values(playback).some(
      p => p?.type === 'scene' && p?.id === sceneId
    );
  },

  // Check if a specific chase is currently playing
  isChasePlaying: (chaseId) => {
    const playback = get().playback;
    return Object.values(playback).some(
      p => p?.type === 'chase' && p?.id === chaseId
    );
  },

  // Check if anything is playing in a universe
  isPlaying: (universe = 1) => {
    return !!get().playback[universe];
  },

  // Get what's currently playing (type and id)
  getCurrentlyPlaying: (universe = 1) => {
    return get().playback[universe] || null;
  },

  // Update playback state (called from WebSocket or after API calls)
  setPlayback: (universe, playbackData) => {
    set(state => ({
      playback: {
        ...state.playback,
        [universe]: playbackData
      }
    }));
  },

  // Clear playback for a universe
  clearPlayback: (universe) => {
    set(state => {
      const newPlayback = { ...state.playback };
      delete newPlayback[universe];
      return { playback: newPlayback };
    });
  },

  // Stop all playback
  stopAll: async (universe = null) => {
    try {
      const payload = universe ? { universe } : {};
      await axios.post(getAetherCore() + '/api/playback/stop', payload);

      if (universe) {
        get().clearPlayback(universe);
      } else {
        set({ playback: {} });
      }

      return { success: true };
    } catch (e) {
      console.error('Failed to stop playback:', e);
      return { success: false, error: e.message };
    }
  },

  // Handle WebSocket playback updates
  handlePlaybackUpdate: (data) => {
    const { universe, playback: playbackData } = data;
    if (playbackData) {
      get().setPlayback(universe, playbackData);
    } else {
      get().clearPlayback(universe);
    }
  }
}));

export default usePlaybackStore;
