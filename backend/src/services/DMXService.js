/**
 * DMXService - Local state cache for DMX universes
 *
 * NOTE: This service is a local cache only. All DMX output is handled by
 * AETHER Core (port 8891) which sends UDPJSON commands directly to ESP32 nodes.
 * OLA is NOT used anywhere in this system.
 */
import EventEmitter from 'events';

class DMXService extends EventEmitter {
  constructor() {
    super();
    this.universeState = new Map();
    // Initialize universes 2-5 (universe 1 is offline)
    for (let i = 2; i <= 5; i++) {
      this.initializeUniverse(i);
    }
  }

  initializeUniverse(id) {
    if (!this.universeState.has(id)) {
      this.universeState.set(id, new Array(512).fill(0));
    }
  }

  getUniverseState(id) {
    this.initializeUniverse(id);
    return [...this.universeState.get(id)];
  }

  setChannel(universeId, channel, value) {
    this.initializeUniverse(universeId);
    const state = this.universeState.get(universeId);
    state[channel - 1] = value;
    this.emit('channelChange', { universeId, channel, value });
    // Note: Actual DMX output is handled by AETHER Core via UDPJSON
    // This is just local state caching for the frontend
  }

  setChannels(universeId, channelValues) {
    this.initializeUniverse(universeId);
    const state = this.universeState.get(universeId);
    Object.entries(channelValues).forEach(([ch, val]) => {
      state[parseInt(ch) - 1] = val;
    });
    this.emit('channelsChange', { universeId, channels: channelValues });
  }

  blackout(universeId) {
    this.initializeUniverse(universeId);
    this.universeState.set(universeId, new Array(512).fill(0));
    this.emit('blackout', { universeId });
  }
}

export default new DMXService();
