import { create } from 'zustand';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const usePixelArrayStore = create((set, get) => ({
  pixelArrays: {},  // Map of array_id -> array data
  loading: false,
  error: null,

  // Initialize store
  initialize: async () => {
    await get().fetchPixelArrays();
    console.log('✅ Pixel Array store initialized');
  },

  // Fetch all pixel arrays
  fetchPixelArrays: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(getAetherCore() + '/api/pixel-arrays');
      set({ pixelArrays: res.data || {}, loading: false });
      console.log('✅ Loaded', Object.keys(res.data || {}).length, 'pixel arrays');
    } catch (e) {
      console.error('❌ Failed to fetch pixel arrays:', e);
      set({ loading: false, error: e.message });
    }
  },

  // Create a new pixel array
  createPixelArray: async (config) => {
    try {
      const res = await axios.post(getAetherCore() + '/api/pixel-arrays', config);
      await get().fetchPixelArrays();
      return res.data;
    } catch (e) {
      console.error('Failed to create pixel array:', e);
      throw e;
    }
  },

  // Get a specific pixel array
  getPixelArray: async (arrayId) => {
    try {
      const res = await axios.get(getAetherCore() + `/api/pixel-arrays/${arrayId}`);
      return res.data;
    } catch (e) {
      console.error('Failed to get pixel array:', e);
      throw e;
    }
  },

  // Delete a pixel array
  deletePixelArray: async (arrayId) => {
    try {
      await axios.delete(getAetherCore() + `/api/pixel-arrays/${arrayId}`);
      await get().fetchPixelArrays();
    } catch (e) {
      console.error('Failed to delete pixel array:', e);
      throw e;
    }
  },

  // Set operation mode (grouped or pixel_array)
  setMode: async (arrayId, mode) => {
    try {
      await axios.post(getAetherCore() + `/api/pixel-arrays/${arrayId}/mode`, { mode });
      await get().fetchPixelArrays();
    } catch (e) {
      console.error('Failed to set mode:', e);
      throw e;
    }
  },

  // Set pixels (for pixel_array mode)
  setPixels: async (arrayId, pixels) => {
    try {
      // pixels should be an array of {index, r, g, b, w} objects
      await axios.post(getAetherCore() + `/api/pixel-arrays/${arrayId}/pixels`, { pixels });
      await get().fetchPixelArrays();
    } catch (e) {
      console.error('Failed to set pixels:', e);
      throw e;
    }
  },

  // Set all pixels to one color (for grouped mode)
  setAllPixels: async (arrayId, r, g, b, w = 0) => {
    try {
      await axios.post(getAetherCore() + `/api/pixel-arrays/${arrayId}/pixels`, {
        all: { r, g, b, w }
      });
      await get().fetchPixelArrays();
    } catch (e) {
      console.error('Failed to set all pixels:', e);
      throw e;
    }
  },

  // Set effect
  setEffect: async (arrayId, effectType, options = {}) => {
    try {
      await axios.post(getAetherCore() + `/api/pixel-arrays/${arrayId}/effect`, {
        effect_type: effectType,
        ...options
      });
      await get().fetchPixelArrays();
    } catch (e) {
      console.error('Failed to set effect:', e);
      throw e;
    }
  },

  // Start effect playback
  startEffect: async (arrayId) => {
    try {
      await axios.post(getAetherCore() + `/api/pixel-arrays/${arrayId}/start`);
      await get().fetchPixelArrays();
    } catch (e) {
      console.error('Failed to start effect:', e);
      throw e;
    }
  },

  // Stop effect playback
  stopEffect: async (arrayId) => {
    try {
      await axios.post(getAetherCore() + `/api/pixel-arrays/${arrayId}/stop`);
      await get().fetchPixelArrays();
    } catch (e) {
      console.error('Failed to stop effect:', e);
      throw e;
    }
  },

  // Blackout (all pixels off)
  blackout: async (arrayId) => {
    try {
      await axios.post(getAetherCore() + `/api/pixel-arrays/${arrayId}/blackout`);
      await get().fetchPixelArrays();
    } catch (e) {
      console.error('Failed to blackout:', e);
      throw e;
    }
  },

  // Get fixture map for an array
  getFixtureMap: async (arrayId) => {
    try {
      const res = await axios.get(getAetherCore() + `/api/pixel-arrays/${arrayId}/fixture-map`);
      return res.data;
    } catch (e) {
      console.error('Failed to get fixture map:', e);
      throw e;
    }
  },

  // Check if an effect is running
  isEffectRunning: (arrayId) => {
    const array = get().pixelArrays[arrayId];
    return array?.status?.is_running || false;
  },

  // Get array by ID from local state
  getArrayById: (arrayId) => {
    return get().pixelArrays[arrayId] || null;
  },
}));

export default usePixelArrayStore;
