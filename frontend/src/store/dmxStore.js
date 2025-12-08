import { create } from 'zustand';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const useDMXStore = create((set, get) => ({
  // State that ViewLive.jsx and Console.jsx expect
  universeState: new Array(512).fill(0),
  currentUniverse: 1,
  channelLabels: {},  // { 1: "Red", 2: "Green", etc. }

  // Additional state
  universes: { 1: new Array(512).fill(0) },
  maxUniverse: 4,  // From settings (SSOT)
  configuredUniverses: [1],  // Universes that have nodes assigned
  lastUpdate: null,
  loading: false,
  polling: false,
  pollInterval: null,

  // Initialize - called by ViewLive on mount
  initSocket: () => {
    console.log('🔌 Initializing DMX state sync...');
    get().fetchSettings();
    get().fetchConfiguredUniverses();
    get().startPolling();
  },

  // Fetch settings from backend (SSOT)
  fetchSettings: async () => {
    try {
      const res = await axios.get(getAetherCore() + '/api/settings/dmx');
      if (res.data) {
        set({ maxUniverse: res.data.maxUniverse || 4 });
        console.log('✅ DMX settings loaded: maxUniverse =', res.data.maxUniverse || 4);
      }
    } catch (e) {
      console.error('Failed to fetch DMX settings:', e.message);
    }
  },

  // Fetch which universes have nodes assigned (SSOT from nodes)
  fetchConfiguredUniverses: async () => {
    try {
      const res = await axios.get(getAetherCore() + '/api/nodes');
      if (res.data && Array.isArray(res.data)) {
        const universesFromNodes = [...new Set(res.data.map(n => n.universe || 1))].sort((a, b) => a - b);
        // Always include universe 1, plus any universes with nodes
        const configured = universesFromNodes.length > 0 ? universesFromNodes : [1];
        set({ configuredUniverses: configured });
        console.log('✅ Configured universes:', configured);
      }
    } catch (e) {
      console.error('Failed to fetch configured universes:', e.message);
    }
  },

  // Fetch current state from AETHER Core
  fetchState: async (universe = 1) => {
    try {
      const res = await axios.get(getAetherCore() + '/api/dmx/universe/' + universe);
      if (res.data && res.data.channels) {
        const channels = res.data.channels;
        set(state => ({
          universeState: channels,
          universes: { ...state.universes, [universe]: channels },
          currentUniverse: universe,
          lastUpdate: Date.now()
        }));
        return channels;
      }
    } catch (e) {
      console.error('Failed to fetch DMX state:', e.message);
    }
    return null;
  },

  // Alias for Console.jsx compatibility
  fetchUniverseState: async (universe = 1) => {
    return get().fetchState(universe);
  },

  // Start polling for state updates
  startPolling: (universe = 1, intervalMs = 500) => {
    const state = get();
    if (state.polling) return;
    
    // Initial fetch
    get().fetchState(universe);
    
    // Set up interval
    const interval = setInterval(() => {
      get().fetchState(universe);
    }, intervalMs);
    
    set({ polling: true, pollInterval: interval });
    console.log('🔄 DMX polling started (every ' + intervalMs + 'ms)');
  },

  stopPolling: () => {
    const state = get();
    if (state.pollInterval) {
      clearInterval(state.pollInterval);
    }
    set({ polling: false, pollInterval: null });
    console.log('⏹️ DMX polling stopped');
  },

  // Set a single channel
  setChannel: async (universe, channel, value, fadeMs = 0) => {
    try {
      // Update local state immediately
      set(state => {
        const channels = [...state.universeState];
        channels[channel - 1] = value;
        return { 
          universeState: channels,
          universes: { ...state.universes, [universe]: channels }
        };
      });

      // Send to AETHER Core
      await axios.post(getAetherCore() + '/api/dmx/set', {
        universe,
        channels: { [channel]: value },
        fade_ms: fadeMs
      });
    } catch (e) {
      console.error('Failed to set channel:', e);
    }
  },

  // Set multiple channels at once
  setChannels: async (universe, channelValues, fadeMs = 0) => {
    try {
      console.log('🎛️ Setting', Object.keys(channelValues).length, 'channels, fade:', fadeMs + 'ms');
      
      // Update local state immediately
      set(state => {
        const channels = [...state.universeState];
        Object.entries(channelValues).forEach(([ch, val]) => {
          channels[parseInt(ch) - 1] = val;
        });
        return { 
          universeState: channels,
          universes: { ...state.universes, [universe]: channels },
          lastUpdate: Date.now()
        };
      });

      // Send to AETHER Core
      await axios.post(getAetherCore() + '/api/dmx/set', {
        universe,
        channels: channelValues,
        fade_ms: fadeMs
      });
    } catch (e) {
      console.error('Failed to set channels:', e);
    }
  },

  // Channel labels (for Faders.jsx)
  setChannelLabel: (channel, label) => {
    set(state => ({
      channelLabels: { ...state.channelLabels, [channel]: label }
    }));
  },

  getChannelLabel: (channel) => {
    return get().channelLabels[channel] || '';
  },

  // Blackout
  blackoutAll: async (universe = 1, fadeMs = 1000) => {
    try {
      console.log('🌑 Blackout universe', universe, 'fade:', fadeMs + 'ms');
      const zeros = new Array(512).fill(0);
      set(state => ({
        universeState: zeros,
        universes: { ...state.universes, [universe]: zeros },
        lastUpdate: Date.now()
      }));
      
      await axios.post(getAetherCore() + '/api/dmx/blackout', {
        universe,
        fade_ms: fadeMs
      });
    } catch (e) {
      console.error('Failed to blackout:', e);
    }
  },

  // Set universe to view
  setCurrentUniverse: (universe) => {
    set({ currentUniverse: universe });
    get().fetchState(universe);
  },

  // Get channel value
  getChannel: (channel) => {
    return get().universeState[channel - 1] || 0;
  },

  // Get all channels for current universe
  getUniverse: () => {
    return get().universeState;
  }
}));

export default useDMXStore;
