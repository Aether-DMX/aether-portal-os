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
  const endpoints = {
    get_status: () => fetch(`${API}/api/playback/status`),
    list_nodes: () => fetch(`${API}/api/nodes`),
    list_scenes: () => fetch(`${API}/api/scenes`),
    list_chases: () => fetch(`${API}/api/chases`),
    stop_playback: () => fetch(`${API}/api/playback/stop`, { method: 'POST' }),
    rescan_nodes: () => fetch(`${API}/api/nodes/scan`, { method: 'POST' }),
  };
  if (endpoints[action]) {
    const res = await endpoints[action]();
    return { success: res.ok, data: await res.json() };
  }
  return { success: false, error: 'No executor' };
}

export default { loadOpsRegistry, isAllowed, needsConfirm, needsModal, execute };
