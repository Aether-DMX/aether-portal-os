import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const HOLIDAYS = {
  '01-01': { name: "New Year's Day", mood: 'celebration', colors: ['#FFD700', '#FFFFFF'] },
  '02-14': { name: "Valentine's Day", mood: 'romantic', colors: ['#FF1493', '#FF69B4'] },
  '07-04': { name: 'Independence Day', mood: 'patriotic', colors: ['#FF0000', '#FFFFFF', '#0000FF'] },
  '10-31': { name: 'Halloween', mood: 'spooky', colors: ['#FF6600', '#800080'] },
  '11-28': { name: 'Thanksgiving', mood: 'warm', colors: ['#FF8C00', '#8B4513'] },
  '12-25': { name: 'Christmas', mood: 'festive', colors: ['#FF0000', '#00FF00', '#FFD700'] },
  '12-31': { name: "New Year's Eve", mood: 'celebration', colors: ['#FFD700', '#C0C0C0'] },
};

const TIME_CONTEXTS = {
  earlyMorning: { start: 5, end: 7, mood: 'sunrise', suggestion: 'Gentle warm-up lighting?' },
  morning: { start: 7, end: 12, mood: 'energetic', suggestion: 'Bright and energizing!' },
  afternoon: { start: 12, end: 17, mood: 'productive', suggestion: 'Good working light' },
  evening: { start: 17, end: 20, mood: 'relaxed', suggestion: 'Time to wind down?' },
  night: { start: 20, end: 23, mood: 'calm', suggestion: 'Dim and cozy?' },
  lateNight: { start: 23, end: 5, mood: 'minimal', suggestion: 'Night owl mode?' },
};

const useAIContext = create(persist((set, get) => ({
  patterns: { usualScenes: {}, preferredIntensity: { morning: 80, evening: 50, night: 25 }, lastActions: [] },
  setupComplete: false,
  setupMode: null,
  userProfile: { name: '', venueType: null, experienceLevel: null, internetMode: 'offline' },
  currentContext: { timeOfDay: null, holiday: null, dayOfWeek: null },
  aiEnabled: true,
  dismissedSuggestions: [],
  dismissedUntil: {}, // Track when suggestions can reappear { suggestionId: timestamp }
  
  setSetupComplete: (complete) => set({ setupComplete: complete }),
  setSetupMode: (mode) => set({ setupMode: mode }),
  setUserProfile: (profile) => set({ userProfile: { ...get().userProfile, ...profile } }),
  
  recordAction: (action) => {
    const { patterns } = get();
    const now = new Date();
    const lastActions = [{ ...action, timestamp: now.toISOString(), hour: now.getHours() }, ...patterns.lastActions].slice(0, 20);
    set({ patterns: { ...patterns, lastActions } });
  },
  
  updateContext: () => {
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay = 'day', timeSuggestion = '';
    
    for (const [key, ctx] of Object.entries(TIME_CONTEXTS)) {
      if (ctx.start <= ctx.end ? (hour >= ctx.start && hour < ctx.end) : (hour >= ctx.start || hour < ctx.end)) {
        timeOfDay = key; 
        timeSuggestion = ctx.suggestion; 
        break;
      }
    }
    
    let holiday = null;
    const checkDate = new Date(now);
    for (let i = 0; i <= 7; i++) {
      const checkKey = `${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (HOLIDAYS[checkKey]) { 
        holiday = { ...HOLIDAYS[checkKey], daysAway: i }; 
        break; 
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    set({ currentContext: { timeOfDay, timeSuggestion, holiday, dayOfWeek: now.getDay(), hour } });
  },
  
  // Dismiss for 4 hours (time-based) or until next day (holiday)
  dismissSuggestion: (id) => {
    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000;
    const untilTomorrow = new Date();
    untilTomorrow.setHours(23, 59, 59, 999);
    
    const duration = id.startsWith('time-') ? fourHours : (untilTomorrow.getTime() - now);
    
    set({ 
      dismissedSuggestions: [...get().dismissedSuggestions, id],
      dismissedUntil: { ...get().dismissedUntil, [id]: now + duration }
    });
  },
  
  // Check if a suggestion is currently dismissed
  isSuggestionDismissed: (id) => {
    const { dismissedUntil } = get();
    const until = dismissedUntil[id];
    if (!until) return false;
    if (Date.now() > until) {
      // Expired - clean up
      const newDismissed = get().dismissedSuggestions.filter(d => d !== id);
      const newUntil = { ...dismissedUntil };
      delete newUntil[id];
      set({ dismissedSuggestions: newDismissed, dismissedUntil: newUntil });
      return false;
    }
    return true;
  },
  
  getGreeting: () => {
    const { userProfile } = get();
    const hour = new Date().getHours();
    const name = userProfile.name ? `, ${userProfile.name}` : '';
    if (hour < 12) return `Good morning${name}!`;
    if (hour < 17) return `Good afternoon${name}!`;
    if (hour < 21) return `Good evening${name}!`;
    return `Burning the midnight oil${name}?`;
  },
}), { 
  name: 'aether-ai-context', 
  partialize: (state) => ({ 
    patterns: state.patterns, 
    setupComplete: state.setupComplete, 
    setupMode: state.setupMode, 
    userProfile: state.userProfile,
    dismissedSuggestions: state.dismissedSuggestions,
    dismissedUntil: state.dismissedUntil,
  }) 
}));

export default useAIContext;
export { HOLIDAYS, TIME_CONTEXTS };
