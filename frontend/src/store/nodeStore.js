import { create } from 'zustand';
import axios from 'axios';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

const useNodeStore = create((set, get) => ({
  nodes: [],
  loading: false,
  error: null,

  fetchNodes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${getApiUrl()}/api/nodes`, { timeout: 5000 });
      set({ nodes: response.data, loading: false });
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
      set({ error: error.message, loading: false });
    }
  },

  pairNode: async (nodeId, config) => {
    try {
      await axios.post(`${getApiUrl()}/api/nodes/${nodeId}/pair`, config);
      await get().fetchNodes();
    } catch (error) {
      console.error('Failed to pair node:', error);
      throw error;
    }
  },

  unpairNode: async (nodeId) => {
    try {
      await axios.post(`${getApiUrl()}/api/nodes/${nodeId}/unpair`);
      await get().fetchNodes();
    } catch (error) {
      console.error('Failed to unpair node:', error);
      throw error;
    }
  },

  deleteNode: async (nodeId) => {
    try {
      await axios.delete(`${getApiUrl()}/api/nodes/${nodeId}`);
      await get().fetchNodes();
    } catch (error) {
      console.error('Failed to delete node:', error);
      throw error;
    }
  },

  getOnlineNodes: () => {
    return get().nodes.filter(n => n.status === 'online');
  },

  getNodesByUniverse: (universe) => {
    return get().nodes.filter(n => n.universe === universe);
  }
}));

export default useNodeStore;
