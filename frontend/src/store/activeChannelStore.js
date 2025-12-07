import { create } from 'zustand';

const useActiveChannelStore = create((set, get) => ({
  // Format: { channelNum: { type: 'scene'|'chase', id: 'scene-id', name: 'Scene Name' } }
  activeChannels: {},

  setActive: (channels, type, id, name) => {
    set((state) => {
      const newActive = { ...state.activeChannels };
      channels.forEach(ch => {
        newActive[ch] = { type, id, name };
      });
      return { activeChannels: newActive };
    });
  },

  clearChannels: (channels) => {
    set((state) => {
      const newActive = { ...state.activeChannels };
      channels.forEach(ch => {
        delete newActive[ch];
      });
      return { activeChannels: newActive };
    });
  },

  clearById: (id) => {
    set((state) => {
      const newActive = {};
      Object.entries(state.activeChannels).forEach(([ch, info]) => {
        if (info.id !== id) {
          newActive[ch] = info;
        }
      });
      return { activeChannels: newActive };
    });
  },

  getActive: () => get().activeChannels,
  
  isChannelActive: (ch) => !!get().activeChannels[ch]
}));

export default useActiveChannelStore;
