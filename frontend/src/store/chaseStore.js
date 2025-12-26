import { create } from 'zustand';
import axios from 'axios';
import usePlaybackStore from './playbackStore';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const useChaseStore = create((set, get) => ({
  chases: [],
  currentChase: null,
  loading: false,

  initializeSampleData: async () => {
    await get().fetchChases();
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
      // Backend uses INSERT OR REPLACE, so this works for both create and update
      const res = await axios.post(getAetherCore() + '/api/chases', chase);
      await get().fetchChases();
      return res.data;
    } catch (e) {
      console.error('Failed to create chase:', e);
      throw e;
    }
  },

  // Update uses same endpoint since backend does INSERT OR REPLACE
  updateChase: async (id, chase) => {
    try {
      // Include chase_id in payload for the INSERT OR REPLACE to work
      const payload = { ...chase, chase_id: id };
      const res = await axios.post(getAetherCore() + '/api/chases', payload);
      await get().fetchChases();
      return res.data;
    } catch (e) {
      console.error('Failed to update chase:', e);
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
      const universe = options.universe || chase?.universe || 1;
      const fadeMs = options.fade_ms ?? chase?.fade_ms ?? 0;

      console.log('🎬 Starting chase:', chase?.name || chaseId, `on universe ${universe}, fade=${fadeMs}ms`);

      const payload = { universe, fade_ms: fadeMs };
      if (isTargeted) {
        payload.target_channels = options.targetChannels;
      }

      await axios.post(getAetherCore() + '/api/chases/' + chaseId + '/play', payload);
      
      set({ currentChase: chase });
      
      if (!isTargeted && chase) {
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

  stopChase: async (chaseId, universe = null) => {
    try {
      const chase = chaseId 
        ? get().chases.find(c => c.chase_id === chaseId || c.id === chaseId)
        : get().currentChase;
      const targetUniverse = universe || chase?.universe || 1;
      
      const id = chaseId || chase?.chase_id || chase?.id;
      
      if (id) {
        console.log('⏹️ Stopping chase:', chase?.name || id);
        await axios.post(getAetherCore() + '/api/chases/' + id + '/stop', { universe: targetUniverse });
      }
      
      set({ currentChase: null });
      usePlaybackStore.getState().clearPlayback(targetUniverse);
    } catch (e) {
      console.error('Failed to stop chase:', e);
    }
  },

  isChasePlaying: (chaseId) => {
    return usePlaybackStore.getState().isChasePlaying(chaseId);
  },

  getActiveChase: (universe = 1) => {
    const playback = usePlaybackStore.getState().getPlayback(universe);
    if (playback?.type === 'chase') {
      return get().chases.find(c => (c.chase_id || c.id) === playback.id);
    }
    return null;
  },

  isRunning: (chaseId) => {
    return usePlaybackStore.getState().isChasePlaying(chaseId);
  },

  playChase: async (id, options = {}) => get().startChase(id, options),
}));

export default useChaseStore;
