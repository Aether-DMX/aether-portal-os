import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Favorites Store
 *
 * Manages quick-access favorites for scenes, chases, looks, etc.
 * Persisted to localStorage for persistence across sessions.
 */

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      // Favorites by type
      scenes: [],      // Array of scene IDs
      chases: [],      // Array of chase IDs
      looks: [],       // Array of look IDs
      sequences: [],   // Array of sequence IDs
      effects: [],     // Array of effect configs

      // Quick scenes (shown on dashboard)
      quickScenes: [],

      // Maximum favorites per category
      MAX_FAVORITES: 20,
      MAX_QUICK: 8,

      // ========== Add/Remove Methods ==========

      addFavorite: (type, id) => {
        const key = `${type}s`; // scenes, chases, looks, sequences
        const current = get()[key] || [];

        if (current.includes(id)) return false;
        if (current.length >= get().MAX_FAVORITES) {
          // Remove oldest
          current.shift();
        }

        set({ [key]: [...current, id] });
        return true;
      },

      removeFavorite: (type, id) => {
        const key = `${type}s`;
        const current = get()[key] || [];
        set({ [key]: current.filter(fid => fid !== id) });
      },

      isFavorite: (type, id) => {
        const key = `${type}s`;
        const current = get()[key] || [];
        return current.includes(id);
      },

      toggleFavorite: (type, id) => {
        if (get().isFavorite(type, id)) {
          get().removeFavorite(type, id);
          return false;
        } else {
          get().addFavorite(type, id);
          return true;
        }
      },

      // ========== Quick Scenes ==========

      addQuickScene: (sceneId) => {
        const { quickScenes, MAX_QUICK } = get();

        if (quickScenes.includes(sceneId)) return false;
        if (quickScenes.length >= MAX_QUICK) {
          // Remove oldest
          set({ quickScenes: [...quickScenes.slice(1), sceneId] });
        } else {
          set({ quickScenes: [...quickScenes, sceneId] });
        }
        return true;
      },

      removeQuickScene: (sceneId) => {
        set({ quickScenes: get().quickScenes.filter(id => id !== sceneId) });
      },

      isQuickScene: (sceneId) => {
        return get().quickScenes.includes(sceneId);
      },

      reorderQuickScenes: (fromIndex, toIndex) => {
        const { quickScenes } = get();
        const result = [...quickScenes];
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);
        set({ quickScenes: result });
      },

      // ========== Get Favorites with Data ==========

      getFavoritesWithData: (type, dataSource) => {
        const key = `${type}s`;
        const ids = get()[key] || [];
        return ids
          .map(id => dataSource.find(item => item[`${type}_id`] === id || item.id === id))
          .filter(Boolean);
      },

      getQuickScenesWithData: (scenes) => {
        const { quickScenes } = get();
        return quickScenes
          .map(id => scenes.find(s => s.scene_id === id || s.id === id))
          .filter(Boolean);
      },

      // ========== Clear ==========

      clearFavorites: (type = null) => {
        if (type) {
          const key = `${type}s`;
          set({ [key]: [] });
        } else {
          set({
            scenes: [],
            chases: [],
            looks: [],
            sequences: [],
            effects: [],
            quickScenes: [],
          });
        }
      },

      // ========== Import/Export ==========

      exportFavorites: () => {
        const { scenes, chases, looks, sequences, effects, quickScenes } = get();
        return {
          scenes,
          chases,
          looks,
          sequences,
          effects,
          quickScenes,
          exportedAt: Date.now(),
        };
      },

      importFavorites: (data) => {
        if (!data) return false;
        set({
          scenes: data.scenes || [],
          chases: data.chases || [],
          looks: data.looks || [],
          sequences: data.sequences || [],
          effects: data.effects || [],
          quickScenes: data.quickScenes || [],
        });
        return true;
      },
    }),
    {
      name: 'aether-favorites',
      version: 1,
    }
  )
);

export default useFavoritesStore;

// Convenience hooks
export const useQuickScenes = () => useFavoritesStore(s => s.quickScenes);
export const useIsFavorite = (type, id) => useFavoritesStore(s => s.isFavorite(type, id));
