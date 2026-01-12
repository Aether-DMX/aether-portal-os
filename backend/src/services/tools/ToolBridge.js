/**
 * ToolBridge - AI Tool Routing System for AETHER DMX
 * Routes Claude's tool calls to the appropriate API endpoints
 */

const AETHER_CORE_URL = process.env.AETHER_CORE_URL || 'http://localhost:8891';

export default class ToolBridge {
  constructor() {
    console.log('ToolBridge initialized with AETHER Core at:', AETHER_CORE_URL);
    this._cachedOnlineUniverses = null;
    this._cacheTimestamp = 0;
    this._cacheLifetimeMs = 10000; // Refresh every 10 seconds
  }

  /**
   * Get list of online universes from node status
   * Caches result for performance
   */
  async getOnlineUniverses() {
    const now = Date.now();
    if (this._cachedOnlineUniverses && (now - this._cacheTimestamp) < this._cacheLifetimeMs) {
      return this._cachedOnlineUniverses;
    }

    try {
      const nodes = await this.apiCall('GET', '/api/nodes');
      const onlineUniverses = nodes
        .filter(n => n.status === 'online')
        .map(n => n.universe)
        .filter(u => u !== undefined && u !== null)
        .sort((a, b) => a - b);

      this._cachedOnlineUniverses = onlineUniverses.length > 0 ? onlineUniverses : [1];
      this._cacheTimestamp = now;
      console.log('ToolBridge: Online universes:', this._cachedOnlineUniverses);
      return this._cachedOnlineUniverses;
    } catch (error) {
      console.error('ToolBridge: Failed to get online universes:', error);
      return this._cachedOnlineUniverses || [1];
    }
  }

  /**
   * Get the first available online universe (for single-universe operations)
   */
  async getDefaultUniverse() {
    const universes = await this.getOnlineUniverses();
    return universes[0] || 1;
  }

  /**
   * Returns tool definitions for Claude API
   * These define what the AI can do with DMX
   */
  getToolDefinitions() {
    return [
      // ===== DMX CONTROL =====
      {
        name: 'dmx_control',
        description: 'Control DMX channels directly. Use this to set light levels, colors, or any DMX values.',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['set_channels', 'blackout', 'get_state'],
              description: 'The DMX action to perform'
            },
            universe: {
              type: 'integer',
              description: 'DMX universe (1-4)',
              default: 1
            },
            channels: {
              type: 'object',
              description: 'Channel values as {channel_number: value}. Values 0-255.',
              additionalProperties: { type: 'integer', minimum: 0, maximum: 255 }
            },
            fade_ms: {
              type: 'integer',
              description: 'Fade time in milliseconds',
              default: 0
            }
          },
          required: ['action']
        }
      },

      // ===== SCENE MANAGEMENT =====
      {
        name: 'scene',
        description: 'Create, play, list, or delete lighting scenes. Scenes are saved snapshots of DMX channel values.',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'play', 'stop', 'list', 'delete', 'get'],
              description: 'Scene action to perform'
            },
            scene_id: {
              type: 'string',
              description: 'Scene ID (required for play, delete, get)'
            },
            name: {
              type: 'string',
              description: 'Scene name (required for create)'
            },
            description: {
              type: 'string',
              description: 'Scene description'
            },
            universe: {
              type: 'integer',
              description: 'DMX universe (1-4)',
              default: 1
            },
            channels: {
              type: 'object',
              description: 'Channel values as {channel_number: value}',
              additionalProperties: { type: 'integer', minimum: 0, maximum: 255 }
            },
            fade_ms: {
              type: 'integer',
              description: 'Default fade time for scene playback',
              default: 500
            },
            color: {
              type: 'string',
              description: 'UI color for the scene (hex, e.g. #3b82f6)'
            }
          },
          required: ['action']
        }
      },

      // ===== CHASE MANAGEMENT =====
      {
        name: 'chase',
        description: 'Create, play, stop, list, or delete chases. Chases are sequences of lighting steps that play in order.',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'play', 'stop', 'list', 'delete', 'get'],
              description: 'Chase action to perform'
            },
            chase_id: {
              type: 'string',
              description: 'Chase ID (required for play, stop, delete, get)'
            },
            name: {
              type: 'string',
              description: 'Chase name (required for create)'
            },
            description: {
              type: 'string',
              description: 'Chase description'
            },
            universe: {
              type: 'integer',
              description: 'DMX universe (1-4)',
              default: 1
            },
            bpm: {
              type: 'integer',
              description: 'Beats per minute (speed of the chase)',
              default: 120
            },
            loop: {
              type: 'boolean',
              description: 'Whether to loop the chase',
              default: true
            },
            steps: {
              type: 'array',
              description: 'Array of chase steps',
              items: {
                type: 'object',
                properties: {
                  channels: {
                    type: 'object',
                    additionalProperties: { type: 'integer', minimum: 0, maximum: 255 }
                  },
                  fade_ms: { type: 'integer', default: 500 },
                  duration_ms: { type: 'integer', default: 1000 }
                }
              }
            },
            color: {
              type: 'string',
              description: 'UI color for the chase (hex)'
            }
          },
          required: ['action']
        }
      },

      // ===== FIXTURE QUERY =====
      {
        name: 'fixtures',
        description: 'Query fixture information. Use this to understand what lights are patched and their channel addresses.',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'get'],
              description: 'Fixture action'
            },
            fixture_id: {
              type: 'string',
              description: 'Fixture ID (for get action)'
            }
          },
          required: ['action']
        }
      },

      // ===== NODE STATUS =====
      {
        name: 'nodes',
        description: 'Query Aether Pulse node status. Shows WiFi and wired DMX output nodes.',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'get'],
              description: 'Node action'
            },
            node_id: {
              type: 'string',
              description: 'Node ID (for get action)'
            }
          },
          required: ['action']
        }
      },

      // ===== PLAYBACK STATUS =====
      {
        name: 'playback',
        description: 'Query or control current playback status. See what scene or chase is currently playing.',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['status', 'stop'],
              description: 'Playback action'
            },
            universe: {
              type: 'integer',
              description: 'Universe to query/control',
              default: 1
            }
          },
          required: ['action']
        }
      },

      // ===== SYSTEM INFO =====
      {
        name: 'system',
        description: 'Get system information like health status, stats, or current DMX state.',
        input_schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['health', 'stats', 'dmx_state'],
              description: 'System info to retrieve'
            },
            universe: {
              type: 'integer',
              description: 'Universe for dmx_state',
              default: 1
            }
          },
          required: ['action']
        }
      }
    ];
  }

  /**
   * Execute a tool call from Claude
   */
  async execute(toolName, args) {
    console.log(`ToolBridge execute: ${toolName}`, args);

    try {
      switch (toolName) {
        case 'dmx_control':
          return await this.executeDMX(args);
        case 'scene':
          return await this.executeScene(args);
        case 'chase':
          return await this.executeChase(args);
        case 'fixtures':
          return await this.executeFixtures(args);
        case 'nodes':
          return await this.executeNodes(args);
        case 'playback':
          return await this.executePlayback(args);
        case 'system':
          return await this.executeSystem(args);
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      console.error(`Tool execution error (${toolName}):`, error);
      return { success: false, error: error.message };
    }
  }

  // ===== DMX CONTROL =====
  async executeDMX(args) {
    const { action, universe, channels, fade_ms = 0 } = args;

    // Smart universe selection: if not specified, use ALL online universes
    // This makes the AI smart - it automatically targets working hardware
    let targetUniverses;
    if (universe !== undefined && universe !== null) {
      targetUniverses = [universe];
    } else {
      targetUniverses = await this.getOnlineUniverses();
      console.log(`ToolBridge: No universe specified, auto-targeting online universes: ${targetUniverses}`);
    }

    switch (action) {
      case 'set_channels':
        if (!channels || Object.keys(channels).length === 0) {
          return { success: false, error: 'No channels specified' };
        }
        // Send to all target universes
        const setResults = await Promise.all(
          targetUniverses.map(u =>
            this.apiCall('POST', '/api/dmx/set', { universe: u, channels, fade_ms })
              .catch(err => ({ error: err.message, universe: u }))
          )
        );
        const setSuccessCount = setResults.filter(r => !r.error).length;
        return {
          success: setSuccessCount > 0,
          message: `Set ${Object.keys(channels).length} channels on ${setSuccessCount}/${targetUniverses.length} universe(s): ${targetUniverses.join(', ')}`,
          channels_set: channels,
          universes: targetUniverses
        };

      case 'blackout':
        // Send blackout to all target universes
        const blackoutResults = await Promise.all(
          targetUniverses.map(u =>
            this.apiCall('POST', '/api/dmx/blackout', { universe: u, fade_ms })
              .catch(err => ({ error: err.message, universe: u }))
          )
        );
        const blackoutSuccessCount = blackoutResults.filter(r => !r.error).length;
        return {
          success: blackoutSuccessCount > 0,
          message: `Blackout on ${blackoutSuccessCount} universe(s): ${targetUniverses.join(', ')}${fade_ms ? ` with ${fade_ms}ms fade` : ''}`,
          universes: targetUniverses
        };

      case 'get_state':
        // For get_state, use first target universe
        const stateUniverse = targetUniverses[0];
        const state = await this.apiCall('GET', `/api/dmx/state/${stateUniverse}`);
        // Summarize non-zero channels
        const nonZero = {};
        if (state.channels) {
          state.channels.forEach((val, idx) => {
            if (val > 0) nonZero[idx + 1] = val;
          });
        }
        return {
          success: true,
          universe: stateUniverse,
          active_channels: Object.keys(nonZero).length,
          channels: nonZero
        };

      default:
        return { success: false, error: `Unknown DMX action: ${action}` };
    }
  }

  // ===== SCENE MANAGEMENT =====
  async executeScene(args) {
    // Smart default: use first online universe if not specified
    const defaultUniverse = args.universe !== undefined ? args.universe : await this.getDefaultUniverse();
    const { action, scene_id, name, description, channels, fade_ms = 500, color } = args;
    const universe = defaultUniverse;

    switch (action) {
      case 'list':
        const scenes = await this.apiCall('GET', '/api/scenes');
        return {
          success: true,
          count: scenes.length,
          scenes: scenes.map(s => ({
            id: s.scene_id,
            name: s.name,
            universe: s.universe,
            channel_count: s.channels ? Object.keys(JSON.parse(s.channels || '{}')).length : 0
          }))
        };

      case 'get':
        if (!scene_id) return { success: false, error: 'scene_id required' };
        const scene = await this.apiCall('GET', `/api/scenes/${scene_id}`);
        return { success: true, scene };

      case 'create':
        if (!name) return { success: false, error: 'name required' };
        if (!channels) return { success: false, error: 'channels required' };
        const newScene = await this.apiCall('POST', '/api/scenes', {
          name,
          description: description || '',
          universe,
          channels,
          fade_ms,
          color: color || '#3b82f6'
        });
        return {
          success: true,
          message: `Created scene "${name}"`,
          scene_id: newScene.scene_id || newScene.id
        };

      case 'play':
        if (!scene_id) return { success: false, error: 'scene_id required' };
        await this.apiCall('POST', `/api/scenes/${scene_id}/play`, { fade_ms });
        return {
          success: true,
          message: `Playing scene ${scene_id}${fade_ms ? ` with ${fade_ms}ms fade` : ''}`
        };

      case 'stop':
        await this.apiCall('POST', '/api/playback/stop', { universe });
        return { success: true, message: `Stopped scene playback on universe ${universe}` };

      case 'delete':
        if (!scene_id) return { success: false, error: 'scene_id required' };
        await this.apiCall('DELETE', `/api/scenes/${scene_id}`);
        return { success: true, message: `Deleted scene ${scene_id}` };

      default:
        return { success: false, error: `Unknown scene action: ${action}` };
    }
  }

  // ===== CHASE MANAGEMENT =====
  async executeChase(args) {
    // Smart default: use first online universe if not specified
    const defaultUniverse = args.universe !== undefined ? args.universe : await this.getDefaultUniverse();
    const { action, chase_id, name, description, bpm = 120, loop = true, steps, color } = args;
    const universe = defaultUniverse;

    switch (action) {
      case 'list':
        const chases = await this.apiCall('GET', '/api/chases');
        return {
          success: true,
          count: chases.length,
          chases: chases.map(c => ({
            id: c.chase_id,
            name: c.name,
            bpm: c.bpm,
            step_count: c.steps ? JSON.parse(c.steps || '[]').length : 0
          }))
        };

      case 'get':
        if (!chase_id) return { success: false, error: 'chase_id required' };
        const chase = await this.apiCall('GET', `/api/chases/${chase_id}`);
        return { success: true, chase };

      case 'create':
        if (!name) return { success: false, error: 'name required' };
        if (!steps || steps.length === 0) return { success: false, error: 'steps required' };
        const newChase = await this.apiCall('POST', '/api/chases', {
          name,
          description: description || '',
          universe,
          bpm,
          loop,
          steps,
          color: color || '#10b981'
        });
        return {
          success: true,
          message: `Created chase "${name}" with ${steps.length} steps at ${bpm} BPM`,
          chase_id: newChase.chase_id || newChase.id
        };

      case 'play':
        if (!chase_id) return { success: false, error: 'chase_id required' };
        await this.apiCall('POST', `/api/chases/${chase_id}/play`);
        return { success: true, message: `Started chase ${chase_id}` };

      case 'stop':
        if (!chase_id) return { success: false, error: 'chase_id required' };
        await this.apiCall('POST', `/api/chases/${chase_id}/stop`);
        return { success: true, message: `Stopped chase ${chase_id}` };

      case 'delete':
        if (!chase_id) return { success: false, error: 'chase_id required' };
        await this.apiCall('DELETE', `/api/chases/${chase_id}`);
        return { success: true, message: `Deleted chase ${chase_id}` };

      default:
        return { success: false, error: `Unknown chase action: ${action}` };
    }
  }

  // ===== FIXTURES =====
  async executeFixtures(args) {
    const { action, fixture_id } = args;

    switch (action) {
      case 'list':
        const fixtures = await this.apiCall('GET', '/api/fixtures');
        return {
          success: true,
          count: fixtures.length,
          fixtures: fixtures.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type,
            start_address: f.startAddress,
            end_address: f.endAddress,
            universe: f.universe
          }))
        };

      case 'get':
        if (!fixture_id) return { success: false, error: 'fixture_id required' };
        const fixture = await this.apiCall('GET', `/api/fixtures/${fixture_id}`);
        return { success: true, fixture };

      default:
        return { success: false, error: `Unknown fixtures action: ${action}` };
    }
  }

  // ===== NODES =====
  async executeNodes(args) {
    const { action, node_id } = args;

    switch (action) {
      case 'list':
        const nodes = await this.apiCall('GET', '/api/nodes');
        return {
          success: true,
          count: nodes.length,
          online: nodes.filter(n => n.status === 'online').length,
          nodes: nodes.map(n => ({
            id: n.node_id,
            name: n.name,
            status: n.status,
            type: n.type,
            universe: n.universe,
            channels: `${n.channel_start}-${n.channel_end}`
          }))
        };

      case 'get':
        if (!node_id) return { success: false, error: 'node_id required' };
        const node = await this.apiCall('GET', `/api/nodes/${node_id}`);
        return { success: true, node };

      default:
        return { success: false, error: `Unknown nodes action: ${action}` };
    }
  }

  // ===== PLAYBACK =====
  async executePlayback(args) {
    // Smart default: use first online universe if not specified
    const universe = args.universe !== undefined ? args.universe : await this.getDefaultUniverse();
    const { action } = args;

    switch (action) {
      case 'status':
        const status = await this.apiCall('GET', '/api/playback/status');
        return {
          success: true,
          universe,
          playback: status.playback || 'idle',
          current: status.current || null
        };

      case 'stop':
        await this.apiCall('POST', '/api/playback/stop', { universe });
        return { success: true, message: `Stopped playback on universe ${universe}` };

      default:
        return { success: false, error: `Unknown playback action: ${action}` };
    }
  }

  // ===== SYSTEM =====
  async executeSystem(args) {
    // Smart default: use first online universe if not specified
    const universe = args.universe !== undefined ? args.universe : await this.getDefaultUniverse();
    const { action } = args;

    switch (action) {
      case 'health':
        const health = await this.apiCall('GET', '/api/health');
        return { success: true, ...health };

      case 'stats':
        const stats = await this.apiCall('GET', '/api/system/stats');
        return { success: true, ...stats };

      case 'dmx_state':
        const dmx = await this.apiCall('GET', `/api/dmx/state/${universe}`);
        const active = dmx.channels ? dmx.channels.filter(v => v > 0).length : 0;
        return {
          success: true,
          universe,
          total_channels: 512,
          active_channels: active
        };

      default:
        return { success: false, error: `Unknown system action: ${action}` };
    }
  }

  // ===== API HELPER =====
  async apiCall(method, path, body = null) {
    const url = `${AETHER_CORE_URL}${path}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error ${response.status}: ${error}`);
    }

    return response.json();
  }
}
