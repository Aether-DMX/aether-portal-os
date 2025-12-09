import { create } from 'zustand';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const useSceneStore = create((set, get) => ({
  scenes: [],
  currentScene: null,
  loading: false,

  initializeSampleData: async () => {
    await get().fetchScenes();
    console.log('✅ Scene store initialized');
  },

  fetchScenes: async () => {
    set({ loading: true });
    try {
      const res = await axios.get(getAetherCore() + '/api/scenes');
      set({ scenes: res.data || [], loading: false });
      console.log('✅ Loaded', (res.data || []).length, 'scenes');
    } catch (e) {
      console.error('❌ Failed to fetch scenes:', e);
      set({ loading: false });
    }
  },

  createScene: async (scene) => {
    try {
      const res = await axios.post(getAetherCore() + '/api/scenes', scene);
      await get().fetchScenes();
      return res.data;
    } catch (e) {
      console.error('Failed to create scene:', e);
      throw e;
    }
  },

  deleteScene: async (id) => {
    try {
      await axios.delete(getAetherCore() + '/api/scenes/' + id);
      await get().fetchScenes();
    } catch (e) {
      console.error('Failed to delete scene:', e);
    }
  },

  playScene: async (id, fadeMs = 1500, options = {}) => {
    try {
      const scene = get().scenes.find(s => s.scene_id === id || s.id === id);
      console.log('🎬 Playing scene:', scene?.name || id, options.targetChannels ? `on channels: ${options.targetChannels.length}` : 'all channels');

      const payload = { fade_ms: fadeMs };
      if (options.targetChannels && options.targetChannels.length > 0) {
        payload.target_channels = options.targetChannels;
      }

      const res = await axios.post(getAetherCore() + '/api/scenes/' + id + '/play', payload);

      set({ currentScene: scene });

      // Return the scene so caller can update DMX state
      return { scene, result: res.data };
    } catch (e) {
      console.error('Failed to play scene:', e);
      throw e;
    }
  },

  stopScene: () => set({ currentScene: null }),

  // Get scenes marked as global (for quick scenes widget)
  getGlobalScenes: () => get().scenes.filter(s => s.isGlobal),

  // Toggle global flag on a scene
  setSceneGlobal: async (id, isGlobal) => {
    try {
      const scene = get().scenes.find(s => (s.scene_id || s.id) === id);
      if (!scene) return;

      await axios.patch(getAetherCore() + '/api/scenes/' + id, { isGlobal });
      await get().fetchScenes();
    } catch (e) {
      console.error('Failed to update scene global flag:', e);
    }
  },
}));

export default useSceneStore;
