import { create } from 'zustand';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

// Helper to apply theme to CSS variables
const applyTheme = (color) => {
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  };
  const rgb = hexToRgb(color);
  document.documentElement.style.setProperty('--theme-primary', color);
  document.documentElement.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
};

const useUIStore = create((set, get) => ({
  theme: '#3b82f6',
  accentColor: '#3b82f6',
  fontSize: 'medium',
  sidebarOpen: true,
  loading: false,

  // Called by App.jsx on startup - loads from backend and applies theme
  loadFromServer: async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/settings/all`);
      const settings = await res.json();
      if (settings.theme) {
        const color = settings.theme.accentColor || '#3b82f6';
        set({
          theme: color,
          accentColor: color,
          fontSize: settings.theme.fontSize || 'medium'
        });
        // Apply to CSS variables immediately
        applyTheme(color);
        console.log('✅ Theme loaded from server:', color);
      }
    } catch (e) {
      console.error('Failed to load UI settings:', e);
    }
  },
  
  setTheme: async (color) => {
    set({ theme: color, accentColor: color });
    applyTheme(color);
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
    applyTheme(color);
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
