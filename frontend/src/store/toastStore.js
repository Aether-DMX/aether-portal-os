import { create } from 'zustand';

const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };

    set(state => ({
      toasts: [...state.toasts, toast]
    }));

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },

  // Convenience methods
  success: (message, duration = 3000) => get().addToast(message, 'success', duration),
  error: (message, duration = 4000) => get().addToast(message, 'error', duration),
  warning: (message, duration = 3500) => get().addToast(message, 'warning', duration),
  info: (message, duration = 3000) => get().addToast(message, 'info', duration),
}));

export default useToastStore;
