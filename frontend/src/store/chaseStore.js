import { create } from 'zustand';
import axios from 'axios';
import usePlaybackStore from './playbackStore';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const useChaseStore = create((set, get) => ({
  chases: [],
  loading: false,

  initializeSampleData: async () => {
    await get().fetchChases();
    // Sync playback status via unified store
    await usePlaybackStore.getState().syncStatus();
    console.log('✅ Chase store initialized');
  },

  fetchChases: async () => {
    set({ loading: true });
    try {
      const res = await axios.get(getAetherCore() + '/api/chases');
      set({ chases: res.data || [], loading: false });
      console.log('✅ Loaded', (res.data || []).length, 'chases');
    } catch (e) {
      console.error('❌ Failed to fetch chases:', e);
      set({ loading: false });
    }
  },

  createChase: async (chase) => {
    try {
      const res = await axios.post(getAetherCore() + '/api/chases', chase);
      await get().fetchChases();
      return res.data;
    } catch (e) {
      console.error('Failed to create chase:', e);
      throw e;
    }
  },

  deleteChase: async (id) => {
    try {
      await axios.delete(getAetherCore() + '/api/chases/' + id);
      await get().fetchChases();
    } catch (e) {
      console.error('Failed to delete chase:', e);
    }
  },

  startChase: async (chaseId, options = {}) => {
    try {
      const chase = get().chases.find(c => c.chase_id === chaseId || c.id === chaseId);
      const isTargeted = options.targetChannels && options.targetChannels.length > 0;
      console.log('🎬 Starting chase:', chase?.name || chaseId, isTargeted ? `on channels: ${options.targetChannels.length}` : 'all channels');

      const payload = {};
      if (isTargeted) {
        payload.target_channels = options.targetChannels;
      }

      await axios.post(getAetherCore() + '/api/chases/' + chaseId + '/play', payload);

      // Update playback store (SSOT) - only if full chase (not targeted)
      if (!isTargeted && chase) {
        const universe = chase.universe || 1;
        usePlaybackStore.getState().setPlayback(universe, {
          type: 'chase',
          id: chase.chase_id || chase.id,
          started: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Failed to start chase:', e);
    }
  },

  stopChase: async (chaseId) => {
    try {
      const chase = get().chases.find(c => c.chase_id === chaseId || c.id === chaseId);
      console.log('⏹️ Stopping chase:', chase?.name || chaseId);
      await axios.post(getAetherCore() + '/api/chases/' + chaseId + '/stop');

      // Clear playback in SSOT
      const universe = chase?.universe || 1;
      usePlaybackStore.getState().clearPlayback(universe);
    } catch (e) {
      console.error('Failed to stop chase:', e);
    }
  },

  // Check if a chase is currently playing (uses SSOT)
  isChasePlaying: (chaseId) => {
    return usePlaybackStore.getState().isChasePlaying(chaseId);
  },

  // Get the currently active chase (uses SSOT)
  getActiveChase: (universe = 1) => {
    const playback = usePlaybackStore.getState().getPlayback(universe);
    if (playback?.type === 'chase') {
      return get().chases.find(c => (c.chase_id || c.id) === playback.id);
    }
    return null;
  },

  // Legacy compatibility
  isRunning: (chaseId) => {
    return usePlaybackStore.getState().isChasePlaying(chaseId);
  },

  playChase: async (id, options = {}) => get().startChase(id, options),
}));

export default useChaseStore;
