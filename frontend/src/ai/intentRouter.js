// AETHER AI Intent Router - Parse user input to structured intent
const LOCAL_PATTERNS = {
  play_scene: [/play\s+(scene\s+)?(.+)/i, /run\s+(scene\s+)?(.+)/i, /start\s+(scene\s+)?(.+)/i],
  play_chase: [/play\s+chase\s+(.+)/i, /run\s+chase\s+(.+)/i, /start\s+chase\s+(.+)/i],
  stop_playback: [/stop/i, /halt/i, /end\s+playback/i],
  blackout: [/blackout/i, /black\s*out/i, /lights\s+off/i, /all\s+off/i],
  list_scenes: [/list\s+scenes/i, /show\s+scenes/i, /what\s+scenes/i],
  list_chases: [/list\s+chases/i, /show\s+chases/i],
  list_nodes: [/list\s+nodes/i, /show\s+nodes/i, /node\s+status/i],
  get_status: [/status/i, /what.*playing/i, /current\s+state/i],
};

export function parseIntent(input) {
  const text = input.trim().toLowerCase();
  for (const [action, patterns] of Object.entries(LOCAL_PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return { action, params: extractParams(action, match), confidence: 0.9, local: true };
      }
    }
  }
  return { action: 'unknown', params: { raw: input }, confidence: 0, local: false };
}

function extractParams(action, match) {
  if (action === 'play_scene' && match[2]) return { scene_name: match[2].trim() };
  if (action === 'play_chase' && match[1]) return { chase_name: match[1].trim() };
  return {};
}

export default { parseIntent, LOCAL_PATTERNS };
