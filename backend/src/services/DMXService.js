import olaService from './OLAService.js';
import EventEmitter from 'events';

class DMXService extends EventEmitter {
  constructor() {
    super();
    this.universeState = new Map();
    this.initializeUniverse(1);
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
    olaService.setDMX(universeId, state);
  }
}

export default new DMXService();
