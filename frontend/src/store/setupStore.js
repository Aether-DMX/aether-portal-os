/**
 * setupStore.js
 * Zustand store for Setup Wizard state
 * 
 * Manages: zones, fixtures per zone, node assignments
 * On completion, creates fixtures and groups in aether-core
 * 
 * API Endpoints Used:
 * - POST /api/fixtures - Create fixture
 * - POST /api/groups - Create group (zone)
 * - POST /api/nodes/:id/configure - Assign node to universe
 * - POST /api/settings/system - Mark setup complete
 */

import { create } from 'zustand';
import axios from 'axios';

// API base URL - points to Python aether-core (SSOT)
const API = () => `http://${window.location.hostname}:8891`;

// Quick-add fixture types
export const FIXTURE_TYPES = [
  { 
    id: 'rgb-par-3ch', 
    name: 'RGB PAR', 
    channels: 3, 
    icon: '🔴',
    channelMap: [
      { name: 'Red', type: 'color', color: 'R' },
      { name: 'Green', type: 'color', color: 'G' },
      { name: 'Blue', type: 'color', color: 'B' },
    ]
  },
  { 
    id: 'rgbw-par-4ch', 
    name: 'RGBW PAR', 
    channels: 4, 
    icon: '⚪',
    channelMap: [
      { name: 'Red', type: 'color', color: 'R' },
      { name: 'Green', type: 'color', color: 'G' },
      { name: 'Blue', type: 'color', color: 'B' },
      { name: 'White', type: 'color', color: 'W' },
    ]
  },
  { 
    id: 'rgbw-par-5ch', 
    name: 'RGBW+Dim', 
    channels: 5, 
    icon: '💡',
    channelMap: [
      { name: 'Red', type: 'color', color: 'R' },
      { name: 'Green', type: 'color', color: 'G' },
      { name: 'Blue', type: 'color', color: 'B' },
      { name: 'White', type: 'color', color: 'W' },
      { name: 'Dimmer', type: 'intensity' },
    ]
  },
  { 
    id: 'dimmer-1ch', 
    name: 'Dimmer', 
    channels: 1, 
    icon: '🔆',
    channelMap: [
      { name: 'Dimmer', type: 'intensity' },
    ]
  },
  { 
    id: 'cct-2ch', 
    name: 'CCT/Tunable', 
    channels: 2, 
    icon: '🌡️',
    channelMap: [
      { name: 'Dimmer', type: 'intensity' },
      { name: 'Color Temp', type: 'colorTemp' },
    ]
  },
  { 
    id: 'led-bar-8ch', 
    name: 'LED Bar', 
    channels: 8, 
    icon: '📊',
    channelMap: [
      { name: 'Red', type: 'color', color: 'R' },
      { name: 'Green', type: 'color', color: 'G' },
      { name: 'Blue', type: 'color', color: 'B' },
      { name: 'Dimmer', type: 'intensity' },
      { name: 'Strobe', type: 'strobe' },
      { name: 'Mode', type: 'macro' },
      { name: 'Speed', type: 'speed' },
      { name: 'Color Macro', type: 'macro' },
    ]
  },
];

// Generate unique IDs
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const useSetupStore = create((set, get) => ({
  // Current wizard step (1-5)
  step: 1,
  
  // Setup mode
  mode: null, // 'guided' | 'manual' | 'import'
  
  // Zone data - each zone will become a "group" in the backend
  zones: [
    { id: generateId('zone'), name: '', fixtures: [], color: '#3b82f6' }
  ],
  
  // Current zone being edited (for fixtures step)
  currentZoneIndex: 0,
  
  // Node assignments { zoneId: nodeId }
  nodeAssignments: {},
  
  // Available nodes (fetched from backend)
  availableNodes: [],
  
  // Loading/error states
  loading: false,
  error: null,
  
  // Results after completion
  createdFixtures: [],
  createdGroups: [],

  // ========== STEP NAVIGATION ==========
  
  setStep: (step) => set({ step }),
  
  nextStep: () => set(state => ({ 
    step: Math.min(state.step + 1, 5),
    error: null 
  })),
  
  prevStep: () => set(state => ({ 
    step: Math.max(state.step - 1, 1),
    error: null
  })),

  setMode: (mode) => set({ mode }),

  // ========== ZONE MANAGEMENT ==========
  
  addZone: () => set(state => ({
    zones: [
      ...state.zones, 
      { 
        id: generateId('zone'), 
        name: '', 
        fixtures: [],
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][state.zones.length % 5]
      }
    ]
  })),
  
  removeZone: (zoneId) => set(state => ({
    zones: state.zones.filter(z => z.id !== zoneId),
    // Also remove node assignment
    nodeAssignments: Object.fromEntries(
      Object.entries(state.nodeAssignments).filter(([k]) => k !== zoneId)
    )
  })),
  
  updateZoneName: (zoneId, name) => set(state => ({
    zones: state.zones.map(z => z.id === zoneId ? { ...z, name } : z)
  })),

  updateZoneColor: (zoneId, color) => set(state => ({
    zones: state.zones.map(z => z.id === zoneId ? { ...z, color } : z)
  })),

  setCurrentZoneIndex: (index) => set({ currentZoneIndex: index }),

  // ========== FIXTURE MANAGEMENT ==========
  
  addFixtureToZone: (zoneId, fixtureType, quantity = 1) => set(state => {
    const zone = state.zones.find(z => z.id === zoneId);
    if (!zone) return state;
    
    const newFixtures = [];
    for (let i = 0; i < quantity; i++) {
      newFixtures.push({
        id: generateId('fix'),
        typeId: fixtureType.id,
        type: fixtureType.name,
        channels: fixtureType.channels,
        channelMap: fixtureType.channelMap,
        name: `${fixtureType.name} ${zone.fixtures.length + i + 1}`
      });
    }
    
    return {
      zones: state.zones.map(z => 
        z.id === zoneId 
          ? { ...z, fixtures: [...z.fixtures, ...newFixtures] }
          : z
      )
    };
  }),
  
  removeFixtureFromZone: (zoneId, fixtureId) => set(state => ({
    zones: state.zones.map(z => 
      z.id === zoneId 
        ? { ...z, fixtures: z.fixtures.filter(f => f.id !== fixtureId) }
        : z
    )
  })),

  updateFixtureQuantity: (zoneId, fixtureTypeId, delta) => set(state => {
    const zone = state.zones.find(z => z.id === zoneId);
    if (!zone) return state;
    
    const fixtureType = FIXTURE_TYPES.find(t => t.id === fixtureTypeId);
    if (!fixtureType) return state;
    
    const currentCount = zone.fixtures.filter(f => f.typeId === fixtureTypeId).length;
    const newCount = Math.max(0, currentCount + delta);
    
    if (delta > 0) {
      // Add fixtures
      const newFixtures = [];
      for (let i = 0; i < delta; i++) {
        newFixtures.push({
          id: generateId('fix'),
          typeId: fixtureType.id,
          type: fixtureType.name,
          channels: fixtureType.channels,
          channelMap: fixtureType.channelMap,
          name: `${fixtureType.name} ${zone.fixtures.length + i + 1}`
        });
      }
      return {
        zones: state.zones.map(z => 
          z.id === zoneId 
            ? { ...z, fixtures: [...z.fixtures, ...newFixtures] }
            : z
        )
      };
    } else {
      // Remove fixtures (remove from end)
      const toRemove = Math.abs(delta);
      const fixturesToRemove = zone.fixtures
        .filter(f => f.typeId === fixtureTypeId)
        .slice(-toRemove)
        .map(f => f.id);
      
      return {
        zones: state.zones.map(z => 
          z.id === zoneId 
            ? { ...z, fixtures: z.fixtures.filter(f => !fixturesToRemove.includes(f.id)) }
            : z
        )
      };
    }
  }),

  // ========== NODE MANAGEMENT ==========
  
  fetchNodes: async () => {
    set({ loading: true });
    try {
      const res = await axios.get(API() + '/api/nodes');
      set({ 
        availableNodes: res.data || [], 
        loading: false 
      });
    } catch (e) {
      console.error('Failed to fetch nodes:', e);
      set({ 
        loading: false, 
        error: 'Failed to fetch nodes' 
      });
    }
  },
  
  assignNodeToZone: (zoneId, nodeId) => set(state => ({
    nodeAssignments: { ...state.nodeAssignments, [zoneId]: nodeId }
  })),

  autoAssignNodes: () => set(state => {
    const onlineNodes = state.availableNodes.filter(n => n.status === 'online');
    const assignments = {};
    
    state.zones.forEach((zone, i) => {
      if (zone.name && zone.fixtures.length > 0 && onlineNodes[i]) {
        assignments[zone.id] = onlineNodes[i].node_id;
      }
    });
    
    return { nodeAssignments: assignments };
  }),

  // ========== COMPLETE SETUP ==========
  
  completeSetup: async () => {
    const { zones, nodeAssignments, availableNodes } = get();
    set({ loading: true, error: null });
    
    try {
      const createdFixtures = [];
      const createdGroups = [];
      
      // Track channel assignments per universe
      const universeChannels = {}; // { universeId: nextChannel }
      
      for (const zone of zones) {
        // Skip empty zones
        if (!zone.name || zone.fixtures.length === 0) continue;
        
        // Determine universe from assigned node
        const nodeId = nodeAssignments[zone.id];
        const node = availableNodes.find(n => n.node_id === nodeId);
        const universe = node?.universe || 1;
        
        // Initialize channel counter for this universe
        if (!universeChannels[universe]) {
          universeChannels[universe] = 1;
        }
        
        const zoneChannels = [];
        const zoneStartChannel = universeChannels[universe];
        
        // Create fixtures in backend
        for (const fixture of zone.fixtures) {
          const startChannel = universeChannels[universe];
          
          const fixtureData = {
            name: fixture.name,
            type: fixture.typeId || fixture.type,
            manufacturer: 'Generic',
            model: fixture.type,
            universe: universe,
            start_channel: startChannel,
            channel_count: fixture.channels,
            channel_map: JSON.stringify(fixture.channelMap || []),
            color: zone.color,
            notes: `Created by Setup Wizard for zone: ${zone.name}`
          };
          
          try {
            const res = await axios.post(API() + '/api/fixtures', fixtureData);
            createdFixtures.push(res.data);
            
            // Track channels for this zone's group
            for (let ch = startChannel; ch < startChannel + fixture.channels; ch++) {
              zoneChannels.push(ch);
            }
            
            // Advance channel counter
            universeChannels[universe] += fixture.channels;
          } catch (e) {
            console.error('Failed to create fixture:', e);
          }
        }
        
        // Create group for this zone
        if (zoneChannels.length > 0) {
          const groupData = {
            name: zone.name,
            universe: universe,
            channels: JSON.stringify(zoneChannels),
            color: zone.color
          };
          
          try {
            const res = await axios.post(API() + '/api/groups', groupData);
            createdGroups.push(res.data);
          } catch (e) {
            console.error('Failed to create group:', e);
          }
        }
        
        // Configure node if assigned
        if (nodeId && node) {
          try {
            await axios.post(API() + `/api/nodes/${nodeId}/configure`, {
              name: `${zone.name} Node`,
              universe: universe,
              channel_start: zoneStartChannel,
              channel_end: universeChannels[universe] - 1
            });
          } catch (e) {
            console.error('Failed to configure node:', e);
          }
        }
      }
      
      // Mark setup as complete in settings
      try {
        await axios.post(API() + '/api/settings/system', {
          setupComplete: true,
          setupDate: new Date().toISOString(),
          setupVersion: '1.0'
        });
      } catch (e) {
        console.warn('Failed to save setup completion status:', e);
      }
      
      set({ 
        loading: false,
        createdFixtures,
        createdGroups,
        step: 5 // Move to complete step
      });
      
      return { fixtures: createdFixtures, groups: createdGroups };
      
    } catch (e) {
      console.error('Setup completion failed:', e);
      set({ 
        loading: false, 
        error: 'Failed to complete setup. Please try again.' 
      });
      throw e;
    }
  },

  // ========== TEST LIGHTS ==========
  
  testZone: async (zoneId) => {
    const { zones, nodeAssignments, availableNodes, createdGroups } = get();
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    
    const nodeId = nodeAssignments[zoneId];
    const node = availableNodes.find(n => n.node_id === nodeId);
    const universe = node?.universe || 1;
    
    // Find the created group for this zone
    const group = createdGroups.find(g => g.name === zone.name);
    const channels = group ? JSON.parse(group.channels || '[]') : [];
    
    // Build channel values (all white at 100%)
    const onValues = {};
    channels.forEach(ch => {
      onValues[ch] = 255;
    });
    
    try {
      // Fade up
      await axios.post(API() + '/api/dmx/set', {
        universe,
        channels: onValues,
        fade_ms: 1000
      });
      
      // Hold
      await new Promise(r => setTimeout(r, 2000));
      
      // Fade down
      const offValues = {};
      channels.forEach(ch => {
        offValues[ch] = 0;
      });
      
      await axios.post(API() + '/api/dmx/set', {
        universe,
        channels: offValues,
        fade_ms: 500
      });
      
    } catch (e) {
      console.error('Test failed:', e);
    }
  },

  testAllZones: async () => {
    const { zones, testZone } = get();
    
    for (const zone of zones) {
      if (zone.name && zone.fixtures.length > 0) {
        await testZone(zone.id);
        await new Promise(r => setTimeout(r, 500)); // Pause between zones
      }
    }
  },

  // ========== UTILITIES ==========
  
  getZoneSummary: () => {
    const { zones } = get();
    return zones
      .filter(z => z.name && z.fixtures.length > 0)
      .map(z => ({
        name: z.name,
        fixtureCount: z.fixtures.length,
        channelCount: z.fixtures.reduce((sum, f) => sum + f.channels, 0)
      }));
  },

  getTotalChannels: () => {
    const { zones } = get();
    return zones.reduce((sum, z) => 
      sum + z.fixtures.reduce((fSum, f) => fSum + f.channels, 0), 0
    );
  },
  
  reset: () => set({
    step: 1,
    mode: null,
    zones: [{ id: generateId('zone'), name: '', fixtures: [], color: '#3b82f6' }],
    currentZoneIndex: 0,
    nodeAssignments: {},
    availableNodes: [],
    loading: false,
    error: null,
    createdFixtures: [],
    createdGroups: []
  })
}));

export default useSetupStore;
