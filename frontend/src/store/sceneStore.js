import { create } from 'zustand';
import axios from 'axios';
import usePlaybackStore from './playbackStore';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const useSceneStore = create((set, get) => ({
  scenes: [],
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
      const isTargeted = options.targetChannels && options.targetChannels.length > 0;
      console.log('🎬 Playing scene:', scene?.name || id, isTargeted ? `on channels: ${options.targetChannels.length}` : 'all channels');

      const payload = { fade_ms: fadeMs };
      if (isTargeted) {
        payload.target_channels = options.targetChannels;
      }

      const res = await axios.post(getAetherCore() + '/api/scenes/' + id + '/play', payload);

      // Update playback store (SSOT) - only if full scene play (not targeted)
      if (!isTargeted && scene) {
        const universe = scene.universe || 1;
        usePlaybackStore.getState().setPlayback(universe, {
          type: 'scene',
          id: scene.scene_id || scene.id,
          started: new Date().toISOString()
        });
      }

      return { scene, result: res.data };
    } catch (e) {
      console.error('Failed to play scene:', e);
      throw e;
    }
  },

  // Check if a scene is currently playing (uses SSOT)
  isScenePlaying: (sceneId) => {
    return usePlaybackStore.getState().isScenePlaying(sceneId);
  },

  // Get the currently playing scene (uses SSOT)
  getCurrentScene: (universe = 1) => {
    const playback = usePlaybackStore.getState().getPlayback(universe);
    if (playback?.type === 'scene') {
      return get().scenes.find(s => (s.scene_id || s.id) === playback.id);
    }
    return null;
  },

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
