import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useScheduleStore = create(
  persist(
    (set) => ({
      schedules: [],

      createSchedule: (schedule) =>
        set((state) => ({
          schedules: [
            ...state.schedules,
            {
              ...schedule,
              id: `schedule-${Date.now()}`,
              createdAt: new Date().toISOString(),
              enabled: true,
            },
          ],
        })),

      deleteSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        })),

      toggleSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
          ),
        })),

      updateSchedule: (id, updates) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
    }),
    {
      name: 'schedule-storage',
    }
  )
);

export default useScheduleStore;
