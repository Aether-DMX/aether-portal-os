import { create } from 'zustand';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

const useAIStore = create((set, get) => ({
  enabled: true,
  model: 'claude-3-sonnet',
  contextLength: 4096,
  temperature: 0.7,

  loadSettings: async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/settings/all`);
      const settings = await res.json();
      if (settings.ai) {
        set(settings.ai);
      }
    } catch (e) {
      console.error('Failed to load AI settings:', e);
    }
  },

  updateSettings: async (updates) => {
    set(updates);
    try {
      await fetch(`${getApiUrl()}/api/settings/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...get(), ...updates })
      });
    } catch (e) {
      console.error('Failed to save AI settings:', e);
    }
  }
}));

export default useAIStore;
