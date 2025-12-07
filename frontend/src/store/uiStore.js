import { create } from 'zustand';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

const useUIStore = create((set, get) => ({
  theme: '#3b82f6',
  accentColor: '#3b82f6',
  fontSize: 'medium',
  sidebarOpen: true,
  loading: false,
  
  loadSettings: async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/settings/all`);
      const settings = await res.json();
      if (settings.theme) {
        set({
          theme: settings.theme.accentColor || '#3b82f6',
          accentColor: settings.theme.accentColor || '#3b82f6',
          fontSize: settings.theme.fontSize || 'medium'
        });
      }
    } catch (e) {
      console.error('Failed to load UI settings:', e);
    }
  },
  
  setTheme: async (color) => {
    set({ theme: color, accentColor: color });
    try {
      await fetch(`${getApiUrl()}/api/settings/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accentColor: color })
      });
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  },
  
  setAccentColor: async (color) => {
    set({ accentColor: color, theme: color });
    try {
      await fetch(`${getApiUrl()}/api/settings/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accentColor: color })
      });
    } catch (e) {
      console.error('Failed to save accent color:', e);
    }
  },
  
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen }))
}));

export default useUIStore;
