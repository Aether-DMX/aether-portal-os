// AETHER AI Executor - Execute validated operations
const API = `http://${window.location.hostname}:8891`;

let opsRegistry = null;

export async function loadOpsRegistry() {
  const res = await fetch(`${API}/api/ai/ops`);
  const data = await res.json();
  opsRegistry = data.ops;
  return opsRegistry;
}

export function isAllowed(action) {
  return opsRegistry && action in opsRegistry;
}

export function needsConfirm(action) {
  return opsRegistry?.[action]?.confirm ?? true;
}

export function needsModal(action) {
  return opsRegistry?.[action]?.modal ?? false;
}

export async function execute(action, params = {}) {
  if (!isAllowed(action)) return { success: false, error: 'Unknown action' };
  
  const simple = {
    get_status: `${API}/api/playback/status`,
    list_nodes: `${API}/api/nodes`,
    list_scenes: `${API}/api/scenes`,
    list_chases: `${API}/api/chases`,
  };
  
  if (simple[action]) {
    const res = await fetch(simple[action]);
    return { success: res.ok, data: await res.json(), action };
  }
  
  // POST actions
  if (action === 'stop_playback') {
    const res = await fetch(`${API}/api/playback/stop`, { method: 'POST' });
    return { success: res.ok, action };
  }
  
  if (action === 'rescan_nodes') {
    const res = await fetch(`${API}/api/nodes/scan`, { method: 'POST' });
    return { success: res.ok, action };
  }
  
  // Play scene by name
  if (action === 'play_scene' && params.scene_name) {
    const scenes = await (await fetch(`${API}/api/scenes`)).json();
    const name = params.scene_name.toLowerCase();
    const scene = scenes.find(s => s.name.toLowerCase().includes(name));
    if (scene) {
      const res = await fetch(`${API}/api/scenes/${scene.scene_id}/play`, { method: 'POST' });
      return { success: res.ok, data: { scene }, action };
    }
    return { success: false, error: `Scene "${params.scene_name}" not found` };
  }
  
  // Play chase by name
  if (action === 'play_chase' && params.chase_name) {
    const chases = await (await fetch(`${API}/api/chases`)).json();
    const name = params.chase_name.toLowerCase();
    const chase = chases.find(c => c.name.toLowerCase().includes(name));
    if (chase) {
      const res = await fetch(`${API}/api/chases/${chase.chase_id}/play`, { method: 'POST' });
      return { success: res.ok, data: { chase }, action };
    }
    return { success: false, error: `Chase "${params.chase_name}" not found` };
  }
  
  // Blackout
  if (action === 'blackout') {
    const res = await fetch(`${API}/api/dmx/blackout`, { method: 'POST' });
    return { success: res.ok, action };
  }
  
  return { success: false, error: 'No executor for action' };
}

export default { loadOpsRegistry, isAllowed, needsConfirm, needsModal, execute };
