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

  startChase: async (chaseId) => {
    try {
      console.log('🎬 Starting chase:', chaseId);
      await axios.post(getAetherCore() + '/api/chases/' + chaseId + '/play');
      
      set(state => ({
        runningChases: { ...state.runningChases, [chaseId]: true },
        activeChase: state.chases.find(c => c.chase_id === chaseId || c.id === chaseId)
      }));
    } catch (e) {
      console.error('Failed to start chase:', e);
    }
  },

  stopChase: async (chaseId) => {
    try {
      console.log('⏹️ Stopping chase:', chaseId);
      await axios.post(getAetherCore() + '/api/chases/' + chaseId + '/stop');
      
      set(state => {
        const newRunning = { ...state.runningChases };
        delete newRunning[chaseId];
        return { runningChases: newRunning, activeChase: null };
      });
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
