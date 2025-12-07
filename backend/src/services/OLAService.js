import axios from 'axios';
import logger from '../utils/logger.js';

class OLAService {
  constructor() {
    this.baseURL = 'http://localhost:9090';
    this.connected = false;
    this.checkConnection();
  }

  async checkConnection() {
    try {
      await axios.get(`${this.baseURL}/get_server_info`, { timeout: 2000 });
      this.connected = true;
      logger.info('OLA connected');
    } catch (error) {
      this.connected = false;
      setTimeout(() => this.checkConnection(), 5000);
    }
  }

  async setDMX(universe, dmxData) {
    const dmxString = dmxData.join(',');
    await axios.post(`${this.baseURL}/set_dmx`, `u=${universe}&d=${dmxString}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  isConnected() {
    return this.connected;
  }
}

export default new OLAService();
