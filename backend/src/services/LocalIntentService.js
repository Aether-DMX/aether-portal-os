/**
 * LocalIntentService - Offline Natural Language Intent Parser
 *
 * Parses user messages into structured intents when Claude API is unavailable.
 * Maps common DMX/lighting commands to tool bridge calls.
 *
 * Supported intents:
 * - blackout: "blackout", "lights off", "kill it", "all off"
 * - play_scene: "play [scene]", "turn on [scene]", "activate [scene]"
 * - stop: "stop", "stop all", "halt"
 * - create_scene: "create scene [name]", "save as [name]"
 * - set_color: "set [color]", "make it [color]", "[color] please"
 * - set_level: "dim to [%]", "set to [%]", "[number]%"
 * - query_status: "what's playing", "status", "show nodes"
 * - help: "help", "what can you do"
 */

const COLORS = {
  red: { 1: 255, 2: 0, 3: 0 },
  green: { 1: 0, 2: 255, 3: 0 },
  blue: { 1: 0, 2: 0, 3: 255 },
  white: { 1: 255, 2: 255, 3: 255, 4: 255 },
  warm: { 1: 255, 2: 180, 3: 100, 4: 200 },
  cool: { 1: 200, 2: 220, 3: 255, 4: 255 },
  purple: { 1: 128, 2: 0, 3: 255 },
  pink: { 1: 255, 2: 100, 3: 180 },
  orange: { 1: 255, 2: 128, 3: 0 },
  amber: { 1: 255, 2: 160, 3: 0 },
  yellow: { 1: 255, 2: 255, 3: 0 },
  cyan: { 1: 0, 2: 255, 3: 255 },
  magenta: { 1: 255, 2: 0, 3: 255 },
  lime: { 1: 128, 2: 255, 3: 0 },
};

const SYNONYMS = {
  blackout: ['blackout', 'lights off', 'kill', 'kill it', 'all off', 'turn off', 'off', 'dark', 'darkness'],
  stop: ['stop', 'stop all', 'halt', 'pause', 'freeze', 'hold'],
  full: ['full', 'full on', 'max', 'maximum', '100%', 'all on', 'bright', 'brightest'],
  dim: ['dim', 'low', 'subtle', 'soft', '25%', '30%'],
  half: ['half', 'medium', 'mid', '50%'],
};

class LocalIntentService {
  constructor(toolBridge) {
    this.toolBridge = toolBridge;
    console.log('LocalIntentService initialized');
  }

  /**
   * Process a user message and return a response
   */
  async process(message, context) {
    const text = message.toLowerCase().trim();

    // Try each intent parser in order of specificity
    const parsers = [
      this.parseHelp,
      this.parseBlackout,
      this.parseStop,
      this.parsePlayScene,
      this.parseCreateScene,
      this.parseSetColor,
      this.parseSetLevel,
      this.parseQueryStatus,
      this.parseQueryNodes,
      this.parseBump,
    ];

    for (const parser of parsers) {
      const result = await parser.call(this, text, context);
      if (result) {
        return result;
      }
    }

    // No match - return helpful fallback
    return this.getOfflineFallback(text, context);
  }

  // ===== INTENT PARSERS =====

  async parseHelp(text) {
    if (text.match(/^(help|what can you do|commands|options|\?)$/i)) {
      return {
        message: `**Offline Mode Commands:**

- "blackout" / "lights off" - Turn all lights off
- "stop" - Stop current playback
- "play [scene name]" - Play a saved scene
- "red" / "blue" / "warm" - Set a color
- "50%" / "dim" / "full" - Set brightness level
- "status" - Check what's playing
- "nodes" - Check node status

I'm running in offline mode. For advanced features like creating scenes or chases, please reconnect to the internet.`,
        action: 'help',
        executed: false,
      };
    }
    return null;
  }

  async parseBlackout(text) {
    if (SYNONYMS.blackout.some(syn => text.includes(syn))) {
      const result = await this.toolBridge.execute('dmx_control', {
        action: 'blackout',
        fade_ms: 500,
      });

      return {
        message: result.success
          ? 'Blackout executed. All lights fading out.'
          : `Blackout failed: ${result.error}`,
        action: 'blackout',
        params: { fade_ms: 500 },
        executed: true,
        result,
      };
    }
    return null;
  }

  async parseStop(text) {
    if (SYNONYMS.stop.some(syn => text === syn || text.startsWith(syn + ' '))) {
      const result = await this.toolBridge.execute('playback', {
        action: 'stop',
      });

      return {
        message: result.success
          ? 'Stopped all playback.'
          : `Stop failed: ${result.error}`,
        action: 'stop',
        executed: true,
        result,
      };
    }
    return null;
  }

  async parsePlayScene(text, context) {
    // Match: "play X", "activate X", "turn on X", "run X"
    const match = text.match(/^(?:play|activate|turn on|run|start)\s+(.+)$/i);
    if (match) {
      const sceneName = match[1].trim();

      // Get list of scenes
      const scenes = await this.toolBridge.execute('scene', { action: 'list' });
      if (!scenes.success || !scenes.scenes) {
        return {
          message: `Couldn't find any scenes. Try creating one first.`,
          action: 'play_scene',
          executed: false,
        };
      }

      // Find matching scene (fuzzy)
      const sceneMatch = scenes.scenes.find(s =>
        s.name.toLowerCase().includes(sceneName.toLowerCase()) ||
        sceneName.toLowerCase().includes(s.name.toLowerCase())
      );

      if (sceneMatch) {
        const result = await this.toolBridge.execute('scene', {
          action: 'play',
          scene_id: sceneMatch.id,
          fade_ms: 1000,
        });

        return {
          message: result.success
            ? `Playing "${sceneMatch.name}".`
            : `Failed to play scene: ${result.error}`,
          action: 'play_scene',
          params: { scene_id: sceneMatch.id },
          executed: true,
          result,
        };
      }

      return {
        message: `Couldn't find scene "${sceneName}". Available: ${scenes.scenes.map(s => s.name).join(', ')}`,
        action: 'play_scene',
        executed: false,
      };
    }
    return null;
  }

  async parseCreateScene(text) {
    // Match: "create scene X", "save as X", "save scene X"
    const match = text.match(/^(?:create|save)\s+(?:scene\s+)?(?:as\s+)?(.+)$/i);
    if (match) {
      // In offline mode, we can't create scenes intelligently
      return {
        message: `Scene creation requires AI assistance. I can't create "${match[1]}" in offline mode. Please reconnect to use this feature, or use the touchscreen interface to save the current state.`,
        action: 'create_scene',
        executed: false,
      };
    }
    return null;
  }

  async parseSetColor(text) {
    // Check for color names
    for (const [colorName, channels] of Object.entries(COLORS)) {
      if (text.includes(colorName)) {
        const result = await this.toolBridge.execute('dmx_control', {
          action: 'set_channels',
          channels,
          fade_ms: 500,
        });

        return {
          message: result.success
            ? `Set lights to ${colorName}.`
            : `Failed: ${result.error}`,
          action: 'set_color',
          params: { color: colorName, channels },
          executed: true,
          result,
        };
      }
    }
    return null;
  }

  async parseSetLevel(text) {
    // Match percentage: "50%", "dim to 30", "set 75 percent"
    const percentMatch = text.match(/(\d+)\s*%|(?:dim|set|level)\s*(?:to\s*)?(\d+)/i);
    if (percentMatch) {
      const level = parseInt(percentMatch[1] || percentMatch[2]);
      const dmxValue = Math.round((level / 100) * 255);

      // Set all channels to this level (simple dimmer mode)
      const channels = {};
      for (let i = 1; i <= 4; i++) channels[i] = dmxValue;

      const result = await this.toolBridge.execute('dmx_control', {
        action: 'set_channels',
        channels,
        fade_ms: 500,
      });

      return {
        message: result.success
          ? `Set to ${level}% (DMX ${dmxValue}).`
          : `Failed: ${result.error}`,
        action: 'set_level',
        params: { level, dmxValue },
        executed: true,
        result,
      };
    }

    // Named levels
    if (SYNONYMS.full.some(syn => text.includes(syn))) {
      const result = await this.toolBridge.execute('dmx_control', {
        action: 'set_channels',
        channels: { 1: 255, 2: 255, 3: 255, 4: 255 },
        fade_ms: 500,
      });
      return {
        message: result.success ? 'Full brightness.' : `Failed: ${result.error}`,
        action: 'set_level',
        params: { level: 100 },
        executed: true,
        result,
      };
    }

    if (SYNONYMS.dim.some(syn => text.includes(syn))) {
      const result = await this.toolBridge.execute('dmx_control', {
        action: 'set_channels',
        channels: { 1: 64, 2: 64, 3: 64, 4: 64 },
        fade_ms: 500,
      });
      return {
        message: result.success ? 'Dimmed to 25%.' : `Failed: ${result.error}`,
        action: 'set_level',
        params: { level: 25 },
        executed: true,
        result,
      };
    }

    if (SYNONYMS.half.some(syn => text.includes(syn))) {
      const result = await this.toolBridge.execute('dmx_control', {
        action: 'set_channels',
        channels: { 1: 128, 2: 128, 3: 128, 4: 128 },
        fade_ms: 500,
      });
      return {
        message: result.success ? 'Set to 50%.' : `Failed: ${result.error}`,
        action: 'set_level',
        params: { level: 50 },
        executed: true,
        result,
      };
    }

    return null;
  }

  async parseQueryStatus(text, context) {
    if (text.match(/^(?:status|what'?s? playing|playing\?|current|now playing)$/i)) {
      const playback = await this.toolBridge.execute('playback', { action: 'status' });

      let message = '';
      if (playback.current) {
        message = `Now playing: ${playback.current}`;
      } else {
        message = 'Nothing currently playing.';
      }

      if (context && context.nodes) {
        message += ` Nodes: ${context.nodes.online}/${context.nodes.total} online.`;
      }

      return {
        message,
        action: 'query_status',
        executed: true,
        result: playback,
      };
    }
    return null;
  }

  async parseQueryNodes(text) {
    if (text.match(/^(?:nodes|node status|show nodes|check nodes)$/i)) {
      const nodes = await this.toolBridge.execute('nodes', { action: 'list' });

      if (nodes.success) {
        const lines = [`**Nodes: ${nodes.online}/${nodes.count} online**`];
        for (const node of nodes.nodes) {
          const status = node.status === 'online' ? '🟢' : '🟡';
          lines.push(`${status} ${node.name || node.id} (U${node.universe})`);
        }
        return {
          message: lines.join('\n'),
          action: 'query_nodes',
          executed: true,
          result: nodes,
        };
      }

      return {
        message: `Couldn't fetch node status: ${nodes.error}`,
        action: 'query_nodes',
        executed: false,
      };
    }
    return null;
  }

  async parseBump(text) {
    // Quick flash/bump
    if (text.match(/^(?:bump|flash|strobe)$/i)) {
      // Quick on then off
      await this.toolBridge.execute('dmx_control', {
        action: 'set_channels',
        channels: { 1: 255, 2: 255, 3: 255, 4: 255 },
        fade_ms: 0,
      });

      setTimeout(async () => {
        await this.toolBridge.execute('dmx_control', {
          action: 'blackout',
          fade_ms: 100,
        });
      }, 150);

      return {
        message: 'Bump!',
        action: 'bump',
        executed: true,
      };
    }
    return null;
  }

  // ===== FALLBACK =====

  getOfflineFallback(text, context) {
    const suggestions = [
      'Try "blackout", "red", "50%", or "play [scene name]"',
      'Say "help" for a list of offline commands.',
    ];

    let message = `I'm running offline and couldn't understand "${text}".`;

    // Be helpful based on context
    if (context && context.nodes && context.nodes.offline > 0) {
      message += ` Note: ${context.nodes.offline} node(s) are offline.`;
    }

    message += '\n\n' + suggestions.join('\n');

    return {
      message,
      action: null,
      executed: false,
    };
  }
}

export default LocalIntentService;
