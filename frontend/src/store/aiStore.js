import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

const useAIStore = create(
  persist(
    (set, get) => ({
      // AI Configuration
      enabled: true,
      apiKey: '',
      model: 'claude-sonnet-4-5-20250929',
      contextLength: 4096,
      temperature: 0.7,

      // Safety settings
      confirmationRules: true,
      safetyWarnings: true,

      // Chat history
      history: [],

      // Setters for Settings.jsx compatibility
      setApiKey: (apiKey) => {
        set({ apiKey });
        get().syncToBackend();
      },

      setModel: (model) => {
        set({ model });
        get().syncToBackend();
      },

      setConfirmationRules: (confirmationRules) => {
        set({ confirmationRules });
        get().syncToBackend();
      },

      setSafetyWarnings: (safetyWarnings) => {
        set({ safetyWarnings });
        get().syncToBackend();
      },

      setEnabled: (enabled) => {
        set({ enabled });
        get().syncToBackend();
      },

      // Chat history management
      addMessage: (message) => {
        set((state) => ({
          history: [...state.history, { ...message, timestamp: Date.now() }]
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      // Sync settings to backend
      syncToBackend: async () => {
        const state = get();
        try {
          await fetch(`${getApiUrl()}/api/settings/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enabled: state.enabled,
              model: state.model,
              contextLength: state.contextLength,
              temperature: state.temperature,
              confirmationRules: state.confirmationRules,
              safetyWarnings: state.safetyWarnings
            })
          });
        } catch (e) {
          console.error('Failed to sync AI settings to backend:', e);
        }
      },

      // Load settings from backend (on startup) - called by App.jsx
      loadFromServer: async () => {
        try {
          const res = await fetch(`${getApiUrl()}/api/settings/all`);
          const settings = await res.json();
          if (settings.ai) {
            set({
              enabled: settings.ai.enabled ?? true,
              model: settings.ai.model ?? 'claude-sonnet-4-5-20250929',
              contextLength: settings.ai.contextLength ?? 4096,
              temperature: settings.ai.temperature ?? 0.7,
              confirmationRules: settings.ai.confirmationRules ?? true,
              safetyWarnings: settings.ai.safetyWarnings ?? true
            });
            console.log('✅ AI settings loaded from server');
          }
        } catch (e) {
          console.error('Failed to load AI settings:', e);
        }
      },

      // Alias for backwards compatibility
      loadSettings: async () => get().loadFromServer(),

      // Legacy method for compatibility
      updateSettings: async (updates) => {
        set(updates);
        get().syncToBackend();
      }
    }),
    {
      name: 'aether-ai-store',
      partialize: (state) => ({
        apiKey: state.apiKey,
        model: state.model,
        confirmationRules: state.confirmationRules,
        safetyWarnings: state.safetyWarnings,
        history: state.history.slice(-50) // Keep last 50 messages
      })
    }
  )
);

export default useAIStore;
