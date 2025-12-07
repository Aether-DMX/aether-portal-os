import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFixtureStore = create(
  persist(
    (set, get) => ({
      fixtures: [],

      addFixture: (fixture) => {
        const newFixture = {
          id: Date.now().toString(),
          name: fixture.name,
          type: fixture.type,
          startAddress: fixture.startAddress,
          endAddress: fixture.endAddress,
          universe: fixture.universe || 1,
          createdAt: Date.now()
        };
        set((state) => ({ fixtures: [...state.fixtures, newFixture] }));
        return newFixture;
      },

      removeFixture: (id) => {
        set((state) => ({ fixtures: state.fixtures.filter(f => f.id !== id) }));
      },

      updateFixture: (id, updates) => {
        set((state) => ({
          fixtures: state.fixtures.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
      },

      getFixture: (id) => get().fixtures.find(f => f.id === id)
    }),
    { name: 'aether-fixtures' }
  )
);

export { useFixtureStore };
