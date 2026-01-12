import { create } from 'zustand';
import axios from 'axios';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

/**
 * Cue Stack Store
 *
 * Manages theatrical manual cueing with Go/Back controls:
 * - CueStacks: Ordered lists of cues for manual triggering
 * - Playback state: Current cue, next/prev cue info
 * - Go/Back/Goto controls for theatrical operation
 */
const useCueStackStore = create((set, get) => ({
  // Data
  cueStacks: [],
  loading: false,
  error: null,

  // Playback state (per stack)
  activeStack: null,  // Currently loaded stack ID
  playbackStatus: null,  // Status from server

  // Initialize store
  initialize: async () => {
    await get().fetchCueStacks();
    console.log('✅ Cue Stack store initialized');
  },

  // ─────────────────────────────────────────────────────────
  // Cue Stacks CRUD
  // ─────────────────────────────────────────────────────────

  fetchCueStacks: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get(getAetherCore() + '/api/cue-stacks');
      set({ cueStacks: res.data || [], loading: false });
      console.log('✅ Loaded', (res.data || []).length, 'cue stacks');
    } catch (e) {
      console.error('❌ Failed to fetch cue stacks:', e);
      set({ loading: false, error: e.message });
    }
  },

  createCueStack: async (stack) => {
    try {
      const res = await axios.post(getAetherCore() + '/api/cue-stacks', stack);
      await get().fetchCueStacks();
      return res.data;
    } catch (e) {
      console.error('Failed to create cue stack:', e);
      throw e;
    }
  },

  updateCueStack: async (id, stack) => {
    try {
      const res = await axios.put(getAetherCore() + '/api/cue-stacks/' + id, stack);
      await get().fetchCueStacks();
      return res.data;
    } catch (e) {
      console.error('Failed to update cue stack:', e);
      throw e;
    }
  },

  deleteCueStack: async (id) => {
    try {
      await axios.delete(getAetherCore() + '/api/cue-stacks/' + id);
      // Clear active stack if it was deleted
      if (get().activeStack === id) {
        set({ activeStack: null, playbackStatus: null });
      }
      await get().fetchCueStacks();
    } catch (e) {
      console.error('Failed to delete cue stack:', e);
    }
  },

  getCueStack: (id) => {
    return get().cueStacks.find(s => s.stack_id === id);
  },

  // ─────────────────────────────────────────────────────────
  // Playback Controls
  // ─────────────────────────────────────────────────────────

  /**
   * Load a cue stack for playback (sets it as active)
   */
  loadStack: async (stackId) => {
    set({ activeStack: stackId });
    await get().refreshStatus(stackId);
    console.log('📋 Loaded cue stack:', stackId);
  },

  /**
   * Execute the next cue (Go button)
   */
  go: async () => {
    const stackId = get().activeStack;
    if (!stackId) {
      console.warn('No cue stack loaded');
      return null;
    }

    try {
      const res = await axios.post(getAetherCore() + '/api/cue-stacks/' + stackId + '/go');
      set({ playbackStatus: res.data });
      console.log('▶️ GO:', res.data.cue?.cue_number, '-', res.data.cue?.name);
      return res.data;
    } catch (e) {
      console.error('❌ Go failed:', e);
      throw e;
    }
  },

  /**
   * Go back to previous cue (Back button)
   */
  back: async () => {
    const stackId = get().activeStack;
    if (!stackId) {
      console.warn('No cue stack loaded');
      return null;
    }

    try {
      const res = await axios.post(getAetherCore() + '/api/cue-stacks/' + stackId + '/back');
      set({ playbackStatus: res.data });
      console.log('◀️ BACK:', res.data.cue?.cue_number, '-', res.data.cue?.name);
      return res.data;
    } catch (e) {
      console.error('❌ Back failed:', e);
      throw e;
    }
  },

  /**
   * Jump to a specific cue by number
   */
  goto: async (cueNumber) => {
    const stackId = get().activeStack;
    if (!stackId) {
      console.warn('No cue stack loaded');
      return null;
    }

    try {
      const res = await axios.post(getAetherCore() + '/api/cue-stacks/' + stackId + '/goto/' + encodeURIComponent(cueNumber));
      set({ playbackStatus: res.data });
      console.log('⏭️ GOTO:', cueNumber);
      return res.data;
    } catch (e) {
      console.error('❌ Goto failed:', e);
      throw e;
    }
  },

  /**
   * Stop playback and release output
   */
  stop: async () => {
    const stackId = get().activeStack;
    if (!stackId) return;

    try {
      await axios.post(getAetherCore() + '/api/cue-stacks/' + stackId + '/stop');
      set({ playbackStatus: null });
      console.log('⏹️ Cue stack stopped');
    } catch (e) {
      console.error('❌ Stop failed:', e);
    }
  },

  /**
   * Refresh playback status from server
   */
  refreshStatus: async (stackId = null) => {
    const id = stackId || get().activeStack;
    if (!id) return;

    try {
      const res = await axios.get(getAetherCore() + '/api/cue-stacks/' + id + '/status');
      set({ playbackStatus: res.data });
      return res.data;
    } catch (e) {
      // Stack might not exist or no playback active
      console.warn('Could not get cue stack status:', e.message);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────
  // State Getters
  // ─────────────────────────────────────────────────────────

  getCurrentCue: () => {
    return get().playbackStatus?.current_cue || null;
  },

  getNextCue: () => {
    return get().playbackStatus?.next_cue || null;
  },

  getPrevCue: () => {
    return get().playbackStatus?.prev_cue || null;
  },

  getCurrentIndex: () => {
    return get().playbackStatus?.current_index ?? -1;
  },

  getTotalCues: () => {
    return get().playbackStatus?.total_cues ?? 0;
  },

  isPlaying: () => {
    return get().playbackStatus?.is_playing ?? false;
  },

  isAtEnd: () => {
    const status = get().playbackStatus;
    if (!status) return false;
    return status.current_index >= status.total_cues - 1;
  },

  isAtStart: () => {
    const status = get().playbackStatus;
    if (!status) return true;
    return status.current_index <= 0;
  },

  // ─────────────────────────────────────────────────────────
  // Cue Management (within a stack)
  // ─────────────────────────────────────────────────────────

  /**
   * Add a cue to a stack
   */
  addCue: async (stackId, cue) => {
    const stack = get().getCueStack(stackId);
    if (!stack) return;

    const newCues = [...(stack.cues || []), cue];
    await get().updateCueStack(stackId, { cues: newCues });
  },

  /**
   * Update a cue in a stack
   */
  updateCue: async (stackId, cueId, updates) => {
    const stack = get().getCueStack(stackId);
    if (!stack) return;

    const newCues = (stack.cues || []).map(c =>
      c.cue_id === cueId ? { ...c, ...updates } : c
    );
    await get().updateCueStack(stackId, { cues: newCues });
  },

  /**
   * Remove a cue from a stack
   */
  removeCue: async (stackId, cueId) => {
    const stack = get().getCueStack(stackId);
    if (!stack) return;

    const newCues = (stack.cues || []).filter(c => c.cue_id !== cueId);
    await get().updateCueStack(stackId, { cues: newCues });
  },

  /**
   * Reorder cues in a stack
   */
  reorderCues: async (stackId, cueIds) => {
    const stack = get().getCueStack(stackId);
    if (!stack) return;

    // Create new order based on provided IDs
    const cueMap = new Map((stack.cues || []).map(c => [c.cue_id, c]));
    const newCues = cueIds.map(id => cueMap.get(id)).filter(Boolean);
    await get().updateCueStack(stackId, { cues: newCues });
  },

  /**
   * Generate next available cue number
   */
  getNextCueNumber: (stackId) => {
    const stack = get().getCueStack(stackId);
    if (!stack || !stack.cues?.length) return '1';

    // Find highest numeric cue number
    let maxNum = 0;
    for (const cue of stack.cues) {
      const num = parseFloat(cue.cue_number);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    return String(Math.floor(maxNum) + 1);
  },
}));

export default useCueStackStore;
