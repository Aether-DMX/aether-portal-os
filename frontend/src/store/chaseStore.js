import { create } from 'zustand';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const useChaseStore = create((set, get) => ({
  chases: [],
  runningChases: {},
  activeChase: null,
  loading: false,

  initializeSampleData: async () => {
    await get().fetchChases();
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
      console.log('🎬 Starting chase:', chaseId, options.targetChannels ? `on channels: ${options.targetChannels.length}` : 'all channels');

      const payload = {};
      if (options.targetChannels && options.targetChannels.length > 0) {
        payload.target_channels = options.targetChannels;
      }

      await axios.post(getAetherCore() + '/api/chases/' + chaseId + '/play', payload);

      // Only ONE chase can run at a time - backend stops previous chase automatically
      set(state => ({
        runningChases: { [chaseId]: true },
        activeChase: state.chases.find(c => c.chase_id === chaseId || c.id === chaseId)
      }));
    } catch (e) {
      console.error('Failed to start chase:', e);
    }
  },

  stopChase: async (chaseId) => {
    try {
      // If no chaseId provided, use active chase or just stop all playback
      const idToStop = chaseId || get().activeChase?.chase_id || get().activeChase?.id;
      console.log('⏹️ Stopping chase:', idToStop || 'all');

      // Use the general playback stop endpoint (must send JSON body)
      await axios.post(getAetherCore() + '/api/playback/stop', {});

      set({ runningChases: {}, activeChase: null });
    } catch (e) {
      console.error('Failed to stop chase:', e);
    }
  },

  isRunning: (chaseId) => {
    return get().runningChases[chaseId] === true;
  },

  playChase: async (id) => get().startChase(id),
}));

export default useChaseStore;
