import { create } from 'zustand';

const useStageStore = create((set) => ({
  fixtures: [],

  addFixture: (fixture) => {
    const newFixture = {
      id: Date.now().toString(),
      name: fixture.name,
      type: fixture.type,
      dmxAddress: fixture.dmxAddress,
      channels: fixture.channels,
      universe: fixture.universe || 1,
      x: fixture.x || 0,
      y: fixture.y || 0,
      notes: fixture.notes || '',
      ...fixture,
    };
    set((state) => ({ fixtures: [...state.fixtures, newFixture] }));
  },

  updateFixture: (id, updates) => {
    set((state) => ({
      fixtures: state.fixtures.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }));
  },

  deleteFixture: (id) => {
    set((state) => ({
      fixtures: state.fixtures.filter((f) => f.id !== id),
    }));
  },

  clearStage: () => {
    set({ fixtures: [] });
  },

  getFixture: (id) => {
    return useStageStore.getState().fixtures.find((f) => f.id === id);
  },
}));

export default useStageStore;
