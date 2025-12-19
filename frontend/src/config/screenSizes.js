export const SCREEN_SIZES = {
  '5inch': {
    name: '5" Touchscreen', width: 800, height: 480,
    iconSize: 48, gridCols: 4, rightPanelWidth: 140, padding: 6, gap: 4
  },
  '7inch': {
    name: '7" Touchscreen', width: 800, height: 480,
    iconSize: 56, gridCols: 5, rightPanelWidth: 160, padding: 8, gap: 6
  },
  '10inch': {
    name: '10" Touchscreen', width: 1280, height: 800,
    iconSize: 64, gridCols: 6, rightPanelWidth: 200, padding: 12, gap: 8
  },
  'pc': {
    name: 'PC / Headless', width: null, height: null,
    iconSize: 64, gridCols: 8, rightPanelWidth: 240, padding: 16, gap: 12
  }
};

export const getScreenSize = () => localStorage.getItem('aether-screen-size') || '7inch';
export const setScreenSize = (size) => { localStorage.setItem('aether-screen-size', size); window.location.reload(); };
export const getScreenConfig = () => SCREEN_SIZES[getScreenSize()];
