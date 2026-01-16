/**
 * Fixture Library Store
 *
 * Manages fixture profiles, Open Fixture Library integration,
 * and intelligent fixture mapping.
 */

import { create } from 'zustand';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const useFixtureLibraryStore = create((set, get) => ({
  // State
  profiles: [],
  oflManufacturers: [],
  oflSearchResults: [],
  loading: false,
  error: null,

  // Fetch all fixture profiles
  fetchProfiles: async (category = null) => {
    set({ loading: true, error: null });
    try {
      const url = category
        ? `/api/fixture-library/profiles?category=${category}`
        : '/api/fixture-library/profiles';
      const response = await axios.get(getAetherCore() + url);
      set({ profiles: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return [];
    }
  },

  // Get single profile with full details
  getProfile: async (profileId) => {
    try {
      const response = await axios.get(getAetherCore() + `/api/fixture-library/profiles/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  },

  // Create custom profile
  createProfile: async (profileData) => {
    try {
      const response = await axios.post(getAetherCore() + '/api/fixture-library/profiles', profileData);
      if (response.data.success) {
        get().fetchProfiles();
      }
      return response.data;
    } catch (error) {
      console.error('Failed to create profile:', error);
      return { success: false, error: error.message };
    }
  },

  // ─────────────────────────────────────────────────────────
  // Open Fixture Library Integration
  // ─────────────────────────────────────────────────────────

  // Fetch OFL manufacturers
  fetchOFLManufacturers: async () => {
    try {
      const response = await axios.get(getAetherCore() + '/api/fixture-library/ofl/manufacturers');
      set({ oflManufacturers: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch OFL manufacturers:', error);
      return [];
    }
  },

  // Search OFL
  searchOFL: async (query) => {
    if (!query || query.length < 2) {
      set({ oflSearchResults: [] });
      return [];
    }
    try {
      const response = await axios.get(getAetherCore() + `/api/fixture-library/ofl/search?q=${encodeURIComponent(query)}`);
      set({ oflSearchResults: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to search OFL:', error);
      return [];
    }
  },

  // Import from OFL
  importFromOFL: async (manufacturer, fixture) => {
    set({ loading: true });
    try {
      const response = await axios.post(getAetherCore() + '/api/fixture-library/ofl/import', {
        manufacturer,
        fixture
      });
      if (response.data.success) {
        get().fetchProfiles();
      }
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ loading: false });
      console.error('Failed to import from OFL:', error);
      return { success: false, error: error.message };
    }
  },

  // ─────────────────────────────────────────────────────────
  // RDM Integration
  // ─────────────────────────────────────────────────────────

  // Auto-configure fixture from RDM device
  autoConfigureFromRDM: async (rdmUid) => {
    try {
      const response = await axios.post(getAetherCore() + '/api/fixture-library/rdm/auto-configure', {
        rdm_uid: rdmUid
      });
      return response.data;
    } catch (error) {
      console.error('Failed to auto-configure from RDM:', error);
      return { success: false, error: error.message };
    }
  },

  // ─────────────────────────────────────────────────────────
  // Intelligent Fixture Control
  // ─────────────────────────────────────────────────────────

  // Apply color to fixtures
  applyColorToFixtures: async (fixtureIds, color, fadeMs = 0, universe = 1) => {
    try {
      const response = await axios.post(getAetherCore() + '/api/fixture-library/apply-color', {
        fixture_ids: fixtureIds,
        color, // { r, g, b, w, dimmer }
        fade_ms: fadeMs,
        universe
      });
      return response.data;
    } catch (error) {
      console.error('Failed to apply color:', error);
      return { success: false, error: error.message };
    }
  },

  // ─────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────

  // Get profiles by category
  getProfilesByCategory: (category) => {
    return get().profiles.filter(p => p.category === category);
  },

  // Get profile by ID from cache
  getCachedProfile: (profileId) => {
    return get().profiles.find(p => p.profile_id === profileId);
  },

  // Get channel types for a profile mode
  getChannelTypes: async (profileId, modeId) => {
    const profile = await get().getProfile(profileId);
    if (!profile) return [];

    const mode = profile.modes.find(m => m.mode_id === modeId);
    if (!mode) return [];

    return mode.channels.map((ch, i) => ({
      offset: i,
      name: ch.name,
      type: ch.type,
      default: ch.default
    }));
  },

  // Clear state
  clear: () => {
    set({
      profiles: [],
      oflManufacturers: [],
      oflSearchResults: [],
      loading: false,
      error: null
    });
  }
}));

export default useFixtureLibraryStore;
