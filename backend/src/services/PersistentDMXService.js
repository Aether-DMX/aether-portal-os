import { spawn } from 'child_process';
import EventEmitter from 'events';
import dgram from 'dgram';
import fs from 'fs/promises';

const NODES_FILE = '/home/ramzt/aether-nodes.json';
const WIRELESS_UDP_PORT = 5555;

class PersistentDMXService extends EventEmitter {
  constructor() {
    super();
    this.dmxBuffer = new Array(512).fill(0);
    this.pythonProcess = null;
    this.isRunning = false;
    this.effectRunning = false;
    this.udpSocket = dgram.createSocket('udp4');
    this.startPersistentProcess();
  }

  async getNodes() {
    try {
      const data = await fs.readFile(NODES_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load nodes:', error);
      return {};
    }
  }

  async sendToNode(channel, value) {
    const nodes = await this.getNodes();
    
    // Find which node handles this channel
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (channel >= node.channelStart && channel <= node.channelEnd) {
        // Calculate local channel for this node
        const localChannel = channel - node.channelStart + 1;
        const cmd = { cmd: 'set', ch: localChannel, val: value };
        
        if (node.type === 'hardwired' || node.ip === 'localhost') {
          // Send via serial to wired ESP32
          this.sendToSerial(cmd);
        } else {
          // Send via UDP to wireless ESP32
          this.sendToWireless(node.ip, cmd);
        }
        return;
      }
    }
  }

  sendToSerial(cmd) {
    if (!this.pythonProcess) return;
    const jsonStr = JSON.stringify(cmd);
    this.pythonProcess.stdin.write(jsonStr + '\n');
  }

  sendToWireless(ip, cmd) {
    const jsonStr = JSON.stringify(cmd);
    const buffer = Buffer.from(jsonStr + '\n');
    
    this.udpSocket.send(buffer, WIRELESS_UDP_PORT, ip, (err) => {
      if (err) {
        console.error(`Failed to send to ${ip}:`, err);
      } else {
        console.log(`📡 Sent to ${ip}: ${jsonStr}`);
      }
    });
  }

  async setChannel(channel, value) {
    this.dmxBuffer[channel - 1] = value;
    await this.sendToNode(channel, value);
    this.emit('buffer-update', { channel, value });
  }

  async setChannelQuiet(channel, value) {
    this.dmxBuffer[channel - 1] = value;
    await this.sendToNode(channel, value);
  }

  async blackout() {
    const nodes = await this.getNodes();
    const cmd = { cmd: 'blackout' };
    
    for (const node of Object.values(nodes)) {
      if (node.type === 'hardwired' || node.ip === 'localhost') {
        this.sendToSerial(cmd);
      } else {
        this.sendToWireless(node.ip, cmd);
      }
    }
    
    this.dmxBuffer.fill(0);
    this.emit('buffer-update', { buffer: this.dmxBuffer });
  }

  async effect(name, params = {}) {
    // Effects go to all nodes for now
    const nodes = await this.getNodes();
    const cmd = {
      cmd: 'effect',
      name: name,
      ch: params.startChannel || 1,
      count: params.count || 50,
      speed: params.speed || 1.0
    };
    
    for (const node of Object.values(nodes)) {
      if (node.type === 'hardwired' || node.ip === 'localhost') {
        this.sendToSerial(cmd);
      } else {
        this.sendToWireless(node.ip, cmd);
      }
    }
  }

  getBuffer() {
    return [...this.dmxBuffer];
  }

  startPersistentProcess() {
    console.log('🚀 Starting persistent DMX process...');

    const pythonCode = `
import sys
import time
sys.path.insert(0, '/opt/aether-dmx')
from aether_dmx import AetherDMX

dmx = AetherDMX()
print("DMX_READY", flush=True)

# Keep connection open and listen for commands
while True:
    try:
        line = sys.stdin.readline().strip()
        if not line:
            continue
            
        import json
        cmd = json.loads(line)
        
        if cmd['cmd'] == 'set':
            dmx.set_channel(cmd['ch'], cmd['val'])
            print(f"OK,{cmd['ch']},{cmd['val']}", flush=True)
        elif cmd['cmd'] == 'blackout':
            dmx.blackout()
            print("OK,BLACKOUT", flush=True)
        elif cmd['cmd'] == 'effect':
            if cmd['name'] == 'rainbow':
                dmx.effect_rainbow(cmd.get('ch', 1), cmd.get('count', 50), cmd.get('speed', 1.0))
                print(f"OK,EFFECT,{cmd['name']}", flush=True)
            elif cmd['name'] == 'stop':
                dmx.effect_stop()
                print("OK,EFFECT,stop", flush=True)
    except Exception as e:
        print(f"ERROR,{str(e)}", flush=True)
`;

    this.pythonProcess = spawn('python3', ['-c', pythonCode]);
    
    this.pythonProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output === 'DMX_READY') {
        this.isRunning = true;
        console.log('✅ DMX service ready!');
      } else {
        console.log('DMX:', output);
      }
    });

    this.pythonProcess.stderr.on('data', (data) => {
      console.error('DMX Error:', data.toString());
    });

    this.pythonProcess.on('close', (code) => {
      console.log(`DMX process exited with code ${code}`);
      this.isRunning = false;
    });
  }
}

export default new PersistentDMXService();
