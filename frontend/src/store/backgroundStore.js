import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useBackgroundStore = create(
  persist(
    (set, get) => ({
      // State
      enabled: true,
      preset: 'default',
      speed: 'normal',
      bubbleCount: 25,
      intensity: 0.6,
      size: 1.0,

      // Setters
      setEnabled: (enabled) => set({ enabled }),
      setPreset: (preset) => set({ preset }),
      setSpeed: (speed) => set({ speed }),
      setBubbleCount: (bubbleCount) => set({ bubbleCount }),
      setIntensity: (intensity) => set({ intensity }),
      setSize: (size) => set({ size }),

      // Placeholder for App.jsx compatibility
      loadFromServer: async () => {
        // Settings are loaded from localStorage via persist
        // This is a no-op but prevents errors
        return Promise.resolve();
      },

      // Color presets
      getColors: (preset) => {
        const themeColor = document.documentElement.style.getPropertyValue('--theme-primary') || '#3b82f6';
        
        const presets = {
          live: [themeColor, `${themeColor}aa`, `${themeColor}66`],  // Dynamic - syncs with current playback
          default: [themeColor, `${themeColor}aa`, `${themeColor}66`],
          warm: ['#ff6b6b', '#feca57', '#ff9ff3', '#ff6348'],
          cool: ['#54a0ff', '#5f27cd', '#48dbfb', '#00d2d3'],
          sunset: ['#ff6b6b', '#feca57', '#ff9ff3', '#ee5a24', '#f8b739'],
          ocean: ['#0abde3', '#10ac84', '#48dbfb', '#1dd1a1', '#00cec9'],
          forest: ['#10ac84', '#1dd1a1', '#2ecc71', '#27ae60', '#58B19F'],
          aurora: ['#a29bfe', '#74b9ff', '#55efc4', '#81ecec', '#dfe6e9'],
          cosmic: ['#6c5ce7', '#a29bfe', '#fd79a8', '#e84393', '#00cec9'],
          cyberpunk: ['#ff00ff', '#00ffff', '#ff006e', '#8338ec', '#3a86ff'],
          neon: ['#39ff14', '#ff073a', '#00fff7', '#ff00ff', '#fff01f'],
          fire: ['#ff4500', '#ff6347', '#ff7f50', '#ffa500', '#ffcc00'],
          midnight: ['#2c3e50', '#34495e', '#5d6d7e', '#7f8c8d', '#95a5a6'],
        };
        
        return presets[preset] || presets.default;
      },

      // Speed multiplier (higher = slower animation)
      getSpeedMultiplier: (speed) => {
        const multipliers = {
          slow: 1.5,
          normal: 1.0,
          fast: 0.6,
        };
        return multipliers[speed] || 1.0;
      },
    }),
    {
      name: 'aether-background',
    }
  )
);

export default useBackgroundStore;
