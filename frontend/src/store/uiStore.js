import { create } from 'zustand';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

// Helper to convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 255, b: 170 }; // Default accent color
};

// Helper to apply accent color to CSS variables
const applyAccentColor = (color) => {
  const rgb = hexToRgb(color);
  const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  // Set accent variables
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-rgb', rgbString);
  document.documentElement.style.setProperty('--accent-dim', `rgba(${rgbString}, 0.15)`);
  document.documentElement.style.setProperty('--accent-glow', `rgba(${rgbString}, 0.4)`);

  // Keep backward compatibility with theme-primary
  document.documentElement.style.setProperty('--theme-primary', color);
  document.documentElement.style.setProperty('--theme-primary-rgb', rgbString);
};

// Legacy alias
const applyTheme = applyAccentColor;

const useUIStore = create((set, get) => ({
  theme: '#00ffaa',
  accentColor: '#00ffaa',
  fontSize: 'medium',
  sidebarOpen: true,
  loading: false,

  // Called by App.jsx on startup - loads from backend and applies theme
  loadFromServer: async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/settings/all`);
      const settings = await res.json();
      if (settings.theme) {
        const color = settings.theme.accentColor || '#00ffaa';
        set({
          theme: color,
          accentColor: color,
          fontSize: settings.theme.fontSize || 'medium'
        });
        // Apply to CSS variables immediately
        applyAccentColor(color);
        console.log('✅ Accent color loaded from server:', color);
      }
    } catch (e) {
      console.error('Failed to load UI settings:', e);
    }
  },
  
  setTheme: async (color) => {
    set({ theme: color, accentColor: color });
    applyAccentColor(color);
    try {
      await fetch(`${getApiUrl()}/api/settings/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accentColor: color })
      });
      console.log('✅ Accent color saved:', color);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  },

  setAccentColor: async (color) => {
    set({ accentColor: color, theme: color });
    applyAccentColor(color);
    try {
      await fetch(`${getApiUrl()}/api/settings/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accentColor: color })
      });
      console.log('✅ Accent color saved:', color);
    } catch (e) {
      console.error('Failed to save accent color:', e);
    }
  },
  
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen }))
}));

export default useUIStore;
