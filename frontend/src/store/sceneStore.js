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

  updateScene: async (id, scene) => {
    try {
      const res = await axios.put(getAetherCore() + "/api/scenes/" + id, scene);
      await get().fetchScenes();
      return res.data;
    } catch (e) {
      console.error("Failed to update scene:", e);
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
    console.log('🟢 sceneStore.playScene called:', { id, fadeMs, options });
    try {
      const scene = get().scenes.find(s => s.scene_id === id || s.id === id);
      const isTargeted = options.targetChannels && options.targetChannels.length > 0;
      // Use provided universe or fall back to scene's stored universe
      const universe = options.universe || scene?.universe || 1;
      console.log('🎬 Playing scene:', scene?.name || id, `on universe ${universe}`, isTargeted ? `channels: ${options.targetChannels.length}` : 'all channels');

      const payload = { fade_ms: fadeMs, universe };
      if (isTargeted) {
        payload.target_channels = options.targetChannels;
      }

      const res = await axios.post(getAetherCore() + '/api/scenes/' + id + '/play', payload);

      // Update playback store (SSOT) - only if full scene play (not targeted)
      if (!isTargeted && scene) {
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
  stopScene: async (universe = 1) => {
    try {
      console.log("⏹️ Stopping scene on U" + universe);
      await axios.post(getAetherCore() + "/api/dmx/stop", { universe });
      usePlaybackStore.getState().clearPlayback(universe);
    } catch (e) {
      console.error("Failed to stop scene:", e);
    }
  },

}));

export default useSceneStore;
