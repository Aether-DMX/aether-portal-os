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

  playScene: async (id, fadeMs = 1500) => {
    try {
      const scene = get().scenes.find(s => s.scene_id === id || s.id === id);
      console.log('🎬 Playing scene:', scene?.name || id);
      
      const res = await axios.post(getAetherCore() + '/api/scenes/' + id + '/play', {
        fade_ms: fadeMs
      });
      
      set({ currentScene: scene });
      
      // Return the scene so caller can update DMX state
      return { scene, result: res.data };
    } catch (e) {
      console.error('Failed to play scene:', e);
      throw e;
    }
  },

  stopScene: () => set({ currentScene: null }),
}));

export default useSceneStore;
