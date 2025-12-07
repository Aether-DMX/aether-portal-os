import { create } from 'zustand';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

const useFixtureStore = create((set, get) => ({
  fixtures: [],
  loading: false,
  error: null,

  // Initialize - fetch from backend
  initialize: async () => {
    await get().fetchFixtures();
    console.log('✅ Fixture store initialized');
  },

  fetchFixtures: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(getAetherCore() + '/api/fixtures');
      set({ fixtures: res.data || [], loading: false });
      console.log('✅ Loaded', (res.data || []).length, 'fixtures');
    } catch (e) {
      console.error('❌ Failed to fetch fixtures:', e);
      set({ loading: false, error: e.message });
    }
  },

  addFixture: async (fixture) => {
    try {
      const res = await axios.post(getAetherCore() + '/api/fixtures', {
        name: fixture.name,
        type: fixture.type || 'generic',
        manufacturer: fixture.manufacturer,
        model: fixture.model,
        universe: fixture.universe || 1,
        start_channel: fixture.startAddress || fixture.start_channel,
        channel_count: fixture.channelCount || fixture.channel_count ||
                       (fixture.endAddress ? fixture.endAddress - fixture.startAddress + 1 : 1),
        channel_map: fixture.channelMap || fixture.channel_map,
        color: fixture.color || '#8b5cf6',
        notes: fixture.notes
      });
      await get().fetchFixtures();
      return res.data;
    } catch (e) {
      console.error('Failed to create fixture:', e);
      throw e;
    }
  },

  updateFixture: async (id, updates) => {
    try {
      const res = await axios.put(getAetherCore() + '/api/fixtures/' + id, {
        name: updates.name,
        type: updates.type,
        manufacturer: updates.manufacturer,
        model: updates.model,
        universe: updates.universe,
        start_channel: updates.startAddress || updates.start_channel,
        channel_count: updates.channelCount || updates.channel_count,
        channel_map: updates.channelMap || updates.channel_map,
        color: updates.color,
        notes: updates.notes
      });
      await get().fetchFixtures();
      return res.data;
    } catch (e) {
      console.error('Failed to update fixture:', e);
      throw e;
    }
  },

  removeFixture: async (id) => {
    try {
      await axios.delete(getAetherCore() + '/api/fixtures/' + id);
      await get().fetchFixtures();
    } catch (e) {
      console.error('Failed to delete fixture:', e);
      throw e;
    }
  },

  getFixture: (id) => get().fixtures.find(f => f.fixture_id === id || f.id === id),

  getFixturesByUniverse: (universe) =>
    get().fixtures.filter(f => f.universe === universe),

  getFixturesForChannels: async (universe, channels) => {
    try {
      const res = await axios.post(getAetherCore() + '/api/fixtures/channels', {
        universe,
        channels
      });
      return res.data || [];
    } catch (e) {
      console.error('Failed to get fixtures for channels:', e);
      return [];
    }
  },

  // Helper to get channel range for a fixture
  getFixtureChannelRange: (fixture) => {
    const start = fixture.start_channel || fixture.startAddress;
    const count = fixture.channel_count || fixture.channelCount || 1;
    return {
      start,
      end: start + count - 1,
      channels: Array.from({ length: count }, (_, i) => start + i)
    };
  }
}));

export { useFixtureStore };
export default useFixtureStore;
