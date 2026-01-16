import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * @deprecated DORMANT STORE - Methods defined but never called
 *
 * Status: DEPRECATED (January 2026)
 *
 * This store was created for channel grouping functionality but:
 * - Methods (createGroup, updateGroup, deleteGroup, getGroup) are never called
 * - Store is imported in 3 files but no methods are invoked
 * - Uses localStorage only (no backend persistence)
 *
 * Options:
 * 1. Implement backend persistence and wire up to UI
 * 2. Remove entirely if grouping is handled elsewhere
 *
 * DO NOT ADD NEW FUNCTIONALITY without first deciding the store's fate.
 *
 * See: docs/ARCHITECTURAL_TRIAGE.md
 */
const useGroupStore = create(
  persist(
    (set, get) => ({
      groups: [],
      
      // Create group
      createGroup: (group) => {
        const newGroup = {
          id: Date.now().toString(),
          name: group.name || 'New Group',
          description: group.description || '',
          channels: group.channels || [],
          color: group.color || 'blue',
          fixtureType: group.fixtureType || 'dimmer',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set((state) => ({
          groups: [...state.groups, newGroup]
        }));
        
        return newGroup;
      },
      
      // Update group
      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id
              ? { ...group, ...updates, updatedAt: Date.now() }
              : group
          )
        }));
      },
      
      // Delete group
      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id)
        }));
      },
      
      // Get group by ID
      getGroup: (id) => {
        return get().groups.find((group) => group.id === id);
      },
    }),
    {
      name: 'aether-dmx-groups',
    }
  )
);

export default useGroupStore;
