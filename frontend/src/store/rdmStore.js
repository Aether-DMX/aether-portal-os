import { create } from 'zustand';
import axios from 'axios';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

const useRDMStore = create((set, get) => ({
  // State
  devices: [],           // All RDM devices
  scanningNodes: [],     // Node IDs currently scanning
  selectedDevice: null,  // Device being configured
  loading: false,
  error: null,

  // Fetch all RDM devices
  fetchDevices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${getApiUrl()}/api/rdm/devices`, { timeout: 10000 });
      set({ devices: response.data, loading: false });
    } catch (error) {
      console.error('Failed to fetch RDM devices:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Fetch devices for a specific node
  fetchDevicesForNode: async (nodeId) => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/nodes/${nodeId}/rdm/devices`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch RDM devices for node:', error);
      throw error;
    }
  },

  // Start discovery on a node
  startDiscovery: async (nodeId) => {
    set(state => ({
      scanningNodes: [...state.scanningNodes, nodeId],
      error: null
    }));
    try {
      const response = await axios.post(`${getApiUrl()}/api/nodes/${nodeId}/rdm/discover`, {}, { timeout: 30000 });
      // Refresh devices after discovery
      await get().fetchDevices();
      set(state => ({
        scanningNodes: state.scanningNodes.filter(id => id !== nodeId)
      }));
      return response.data;
    } catch (error) {
      console.error('RDM discovery failed:', error);
      set(state => ({
        scanningNodes: state.scanningNodes.filter(id => id !== nodeId),
        error: error.message
      }));
      throw error;
    }
  },

  // Check discovery status
  getDiscoveryStatus: async (nodeId) => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/nodes/${nodeId}/rdm/discover/status`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.error('Failed to get discovery status:', error);
      throw error;
    }
  },

  // Get device info
  getDeviceInfo: async (uid) => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/rdm/devices/${encodeURIComponent(uid)}`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('Failed to get device info:', error);
      throw error;
    }
  },

  // Identify device (flash LED)
  identifyDevice: async (uid, state = true) => {
    try {
      const response = await axios.post(
        `${getApiUrl()}/api/rdm/devices/${encodeURIComponent(uid)}/identify`,
        { state },
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to identify device:', error);
      throw error;
    }
  },

  // Set DMX address
  setDeviceAddress: async (uid, address) => {
    try {
      const response = await axios.post(
        `${getApiUrl()}/api/rdm/devices/${encodeURIComponent(uid)}/address`,
        { address },
        { timeout: 10000 }
      );
      // Refresh devices
      await get().fetchDevices();
      return response.data;
    } catch (error) {
      console.error('Failed to set device address:', error);
      throw error;
    }
  },

  // Set device label
  setDeviceLabel: async (uid, label) => {
    try {
      const response = await axios.post(
        `${getApiUrl()}/api/rdm/devices/${encodeURIComponent(uid)}/label`,
        { label },
        { timeout: 5000 }
      );
      // Refresh devices
      await get().fetchDevices();
      return response.data;
    } catch (error) {
      console.error('Failed to set device label:', error);
      throw error;
    }
  },

  // Delete device from database
  deleteDevice: async (uid) => {
    try {
      const response = await axios.delete(
        `${getApiUrl()}/api/rdm/devices/${encodeURIComponent(uid)}`,
        { timeout: 5000 }
      );
      // Refresh devices
      await get().fetchDevices();
      return response.data;
    } catch (error) {
      console.error('Failed to delete device:', error);
      throw error;
    }
  },

  // UI state management
  selectDevice: (device) => set({ selectedDevice: device }),
  clearSelectedDevice: () => set({ selectedDevice: null }),
  clearError: () => set({ error: null }),

  // Helpers
  getDevicesForNode: (nodeId) => {
    return get().devices.filter(d => d.node_id === nodeId);
  },

  getDeviceByUid: (uid) => {
    return get().devices.find(d => d.uid === uid);
  },

  isNodeScanning: (nodeId) => {
    return get().scanningNodes.includes(nodeId);
  }
}));

export default useRDMStore;
