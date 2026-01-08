import { create } from 'zustand';
import axios from 'axios';
import usePlaybackStore from './playbackStore';

const getAetherCore = () => `http://${window.location.hostname}:8891`;

/**
 * Look & Sequence Store
 *
 * Manages:
 * - Looks: Base channels + modifiers (replaces Scenes)
 * - Sequences: Ordered steps with timing (replaces Chases)
 * - Preview sessions for safe editing
 * - Modifier schemas/presets from backend
 */
const useLookStore = create((set, get) => ({
  // Data
  looks: [],
  sequences: [],
  modifierSchemas: null,
  loading: false,

  // Preview state
  previewSession: null,
  previewArmed: false,

  // Initialize store
  initialize: async () => {
    await Promise.all([
      get().fetchLooks(),
      get().fetchSequences(),
      get().fetchModifierSchemas(),
    ]);
    console.log('✅ Look store initialized');
  },

  // ─────────────────────────────────────────────────────────
  // Looks CRUD
  // ─────────────────────────────────────────────────────────

  fetchLooks: async () => {
    set({ loading: true });
    try {
      const res = await axios.get(getAetherCore() + '/api/looks');
      set({ looks: res.data || [], loading: false });
      console.log('✅ Loaded', (res.data || []).length, 'looks');
    } catch (e) {
      console.error('❌ Failed to fetch looks:', e);
      set({ loading: false });
    }
  },

  createLook: async (look) => {
    try {
      const res = await axios.post(getAetherCore() + '/api/looks', look);
      await get().fetchLooks();
      return res.data;
    } catch (e) {
      console.error('Failed to create look:', e);
      throw e;
    }
  },

  updateLook: async (id, look) => {
    try {
      const res = await axios.put(getAetherCore() + '/api/looks/' + id, look);
      await get().fetchLooks();
      return res.data;
    } catch (e) {
      console.error('Failed to update look:', e);
      throw e;
    }
  },

  deleteLook: async (id) => {
    try {
      await axios.delete(getAetherCore() + '/api/looks/' + id);
      await get().fetchLooks();
    } catch (e) {
      console.error('Failed to delete look:', e);
    }
  },

  // ─────────────────────────────────────────────────────────
  // Look Playback
  // ─────────────────────────────────────────────────────────

  playLook: async (id, options = {}) => {
    try {
      const look = get().looks.find(l => l.look_id === id || l.id === id);
      const universes = options.universes || [1];
      const fadeMs = options.fade_ms ?? 1000;

      console.log('🎬 Playing look:', look?.name || id, 'on universes', universes);

      const payload = {
        fade_ms: fadeMs,
        universes
      };

      const res = await axios.post(getAetherCore() + '/api/looks/' + id + '/play', payload);

      // Update playback store
      if (look) {
        for (const u of universes) {
          usePlaybackStore.getState().setPlayback(u, {
            type: 'look',
            id: look.look_id || look.id,
            started: new Date().toISOString()
          });
        }
      }

      return { look, result: res.data };
    } catch (e) {
      console.error('❌ Failed to play look:', e);
      throw e;
    }
  },

  stopLook: async (id, universe = 1) => {
    try {
      console.log('⏹️ Stopping look:', id);
      await axios.post(getAetherCore() + '/api/looks/' + id + '/stop', { universe });
      usePlaybackStore.getState().clearPlayback(universe);
    } catch (e) {
      console.error('Failed to stop look:', e);
    }
  },

  isLookPlaying: (lookId) => {
    const playback = usePlaybackStore.getState().playback;
    return Object.values(playback).some(
      p => p?.type === 'look' && p?.id === lookId
    );
  },

  // ─────────────────────────────────────────────────────────
  // Sequences CRUD
  // ─────────────────────────────────────────────────────────

  fetchSequences: async () => {
    set({ loading: true });
    try {
      const res = await axios.get(getAetherCore() + '/api/sequences');
      set({ sequences: res.data || [], loading: false });
      console.log('✅ Loaded', (res.data || []).length, 'sequences');
    } catch (e) {
      console.error('❌ Failed to fetch sequences:', e);
      set({ loading: false });
    }
  },

  createSequence: async (sequence) => {
    try {
      const res = await axios.post(getAetherCore() + '/api/sequences', sequence);
      await get().fetchSequences();
      return res.data;
    } catch (e) {
      console.error('Failed to create sequence:', e);
      throw e;
    }
  },

  updateSequence: async (id, sequence) => {
    try {
      const res = await axios.put(getAetherCore() + '/api/sequences/' + id, sequence);
      await get().fetchSequences();
      return res.data;
    } catch (e) {
      console.error('Failed to update sequence:', e);
      throw e;
    }
  },

  deleteSequence: async (id) => {
    try {
      await axios.delete(getAetherCore() + '/api/sequences/' + id);
      await get().fetchSequences();
    } catch (e) {
      console.error('Failed to delete sequence:', e);
    }
  },

  // ─────────────────────────────────────────────────────────
  // Sequence Playback
  // ─────────────────────────────────────────────────────────

  playSequence: async (id, options = {}) => {
    try {
      const sequence = get().sequences.find(s => s.sequence_id === id || s.id === id);
      const universes = options.universes || [1];

      console.log('🎬 Playing sequence:', sequence?.name || id, 'on universes', universes);

      const payload = {
        universes,
        loop_mode: options.loop_mode || 'loop',
      };

      const res = await axios.post(getAetherCore() + '/api/sequences/' + id + '/play', payload);

      // Update playback store
      if (sequence) {
        for (const u of universes) {
          usePlaybackStore.getState().setPlayback(u, {
            type: 'sequence',
            id: sequence.sequence_id || sequence.id,
            started: new Date().toISOString()
          });
        }
      }

      return { sequence, result: res.data };
    } catch (e) {
      console.error('❌ Failed to play sequence:', e);
      throw e;
    }
  },

  stopSequence: async (id, universe = 1) => {
    try {
      console.log('⏹️ Stopping sequence:', id);
      await axios.post(getAetherCore() + '/api/sequences/' + id + '/stop', { universe });
      usePlaybackStore.getState().clearPlayback(universe);
    } catch (e) {
      console.error('Failed to stop sequence:', e);
    }
  },

  isSequencePlaying: (sequenceId) => {
    const playback = usePlaybackStore.getState().playback;
    return Object.values(playback).some(
      p => p?.type === 'sequence' && p?.id === sequenceId
    );
  },

  // ─────────────────────────────────────────────────────────
  // Modifier Schemas
  // ─────────────────────────────────────────────────────────

  fetchModifierSchemas: async () => {
    try {
      const res = await axios.get(getAetherCore() + '/api/modifiers/schemas');
      set({ modifierSchemas: res.data });
      console.log('✅ Loaded modifier schemas:', Object.keys(res.data.schemas || {}).length, 'types');
    } catch (e) {
      console.error('❌ Failed to fetch modifier schemas:', e);
    }
  },

  getModifierSchema: (type) => {
    const schemas = get().modifierSchemas;
    return schemas?.schemas?.[type] || null;
  },

  getModifierPresets: (type) => {
    const schema = get().getModifierSchema(type);
    return schema?.presets || {};
  },

  // ─────────────────────────────────────────────────────────
  // Live Preview (Sandbox Mode)
  // ─────────────────────────────────────────────────────────

  startPreview: async (channels, modifiers, universes = [1]) => {
    try {
      const sessionId = 'editor_preview_' + Date.now();

      const res = await axios.post(getAetherCore() + '/api/preview/session', {
        session_id: sessionId,
        preview_type: 'look',
        channels,
        modifiers,
        universes,
      });

      // Start playback
      await axios.post(getAetherCore() + '/api/preview/session/' + sessionId + '/start');

      set({ previewSession: sessionId, previewArmed: false });
      console.log('🔍 Preview started:', sessionId);
      return sessionId;
    } catch (e) {
      console.error('Failed to start preview:', e);
      throw e;
    }
  },

  updatePreview: async (channels, modifiers) => {
    const sessionId = get().previewSession;
    if (!sessionId) return;

    try {
      await axios.put(getAetherCore() + '/api/preview/session/' + sessionId, {
        channels,
        modifiers,
      });
    } catch (e) {
      console.error('Failed to update preview:', e);
    }
  },

  stopPreview: async () => {
    const sessionId = get().previewSession;
    if (!sessionId) return;

    try {
      await axios.delete(getAetherCore() + '/api/preview/session/' + sessionId);
      set({ previewSession: null, previewArmed: false });
      console.log('🔍 Preview stopped');
    } catch (e) {
      console.error('Failed to stop preview:', e);
    }
  },

  armPreview: async () => {
    const sessionId = get().previewSession;
    if (!sessionId) return;

    try {
      await axios.post(getAetherCore() + '/api/preview/session/' + sessionId + '/arm');
      set({ previewArmed: true });
      console.log('🔴 Preview ARMED - live output enabled');
    } catch (e) {
      console.error('Failed to arm preview:', e);
    }
  },

  disarmPreview: async () => {
    const sessionId = get().previewSession;
    if (!sessionId) return;

    try {
      await axios.post(getAetherCore() + '/api/preview/session/' + sessionId + '/disarm');
      set({ previewArmed: false });
      console.log('🟢 Preview DISARMED - sandbox mode');
    } catch (e) {
      console.error('Failed to disarm preview:', e);
    }
  },

  // Single frame preview (instant feedback)
  previewFrame: async (channels, modifiers, elapsedTime = 0) => {
    try {
      const res = await axios.post(getAetherCore() + '/api/preview/frame', {
        channels,
        modifiers,
        elapsed_time: elapsedTime,
      });
      return res.data.channels;
    } catch (e) {
      console.error('Failed to preview frame:', e);
      return null;
    }
  },
}));

export default useLookStore;
