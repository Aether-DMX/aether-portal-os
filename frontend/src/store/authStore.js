import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Security settings
      securityEnabled: false,
      userPin: '1234',           // Default USER PIN
      adminPin: '0000',          // Default ADMIN PIN
      
      // Current session
      currentRole: 'admin',      // 'none', 'user', 'admin'
      isLocked: false,
      lastActivity: Date.now(),
      
      // Permission configuration (what each role can do)
      permissions: {
        none: {
          wakeScreen: true,
          viewDashboard: false,
          controlFaders: false,
          runScenes: false,
          runChases: false,
          editScenes: false,
          editChases: false,
          editGroups: false,
          editSchedules: false,
          accessSettings: false,
          accessAI: false,
          accessStage: false,
        },
        user: {
          wakeScreen: true,
          viewDashboard: true,
          controlFaders: true,
          runScenes: true,
          runChases: true,
          editScenes: false,
          editChases: false,
          editGroups: false,
          editSchedules: false,
          accessSettings: false,
          accessAI: true,
          accessStage: true,
        },
        admin: {
          wakeScreen: true,
          viewDashboard: true,
          controlFaders: true,
          runScenes: true,
          runChases: true,
          editScenes: true,
          editChases: true,
          editGroups: true,
          editSchedules: true,
          accessSettings: true,
          accessAI: true,
          accessStage: true,
        },
      },

      // Actions
      setSecurityEnabled: (enabled) => set({ securityEnabled: enabled }),
      
      setUserPin: (pin) => set({ userPin: pin }),
      
      setAdminPin: (pin) => set({ adminPin: pin }),
      
      authenticate: (pin) => {
        const { userPin, adminPin } = get();
        
        if (pin === adminPin) {
          set({ currentRole: 'admin', isLocked: false, lastActivity: Date.now() });
          return 'admin';
        } else if (pin === userPin) {
          set({ currentRole: 'user', isLocked: false, lastActivity: Date.now() });
          return 'user';
        }
        
        return null;
      },
      
      lock: () => set({ 
        currentRole: get().securityEnabled ? 'none' : 'admin', 
        isLocked: true 
      }),
      
      logout: () => set({ 
        currentRole: get().securityEnabled ? 'none' : 'admin',
        isLocked: false 
      }),
      
      updateActivity: () => set({ lastActivity: Date.now() }),
      
      hasPermission: (action) => {
        const { securityEnabled, currentRole, permissions } = get();
        
        // If security disabled, allow everything
        if (!securityEnabled) return true;
        
        // Check permission for current role
        return permissions[currentRole]?.[action] || false;
      },
      
      setPermission: (role, action, allowed) => {
        set((state) => ({
          permissions: {
            ...state.permissions,
            [role]: {
              ...state.permissions[role],
              [action]: allowed,
            },
          },
        }));
      },
      
      getRoleColor: (role) => {
        const colors = {
          none: '#6b7280',    // Gray
          user: '#3b82f6',    // Blue
          admin: '#ef4444',   // Red
        };
        return colors[role] || colors.none;
      },
      
      getRoleLabel: (role) => {
        const labels = {
          none: 'No Access',
          user: 'User',
          admin: 'Admin',
        };
        return labels[role] || 'Unknown';
      },

      // Placeholder for App.jsx compatibility - auth uses localStorage persist
      loadFromServer: async () => {
        // Settings are loaded from localStorage via persist middleware
        return Promise.resolve();
      },
    }),
    {
      name: 'aether-auth',
    }
  )
);

export default useAuthStore;
