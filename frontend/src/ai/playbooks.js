// AETHER AI Playbooks - System maintenance automation
const API = `http://${window.location.hostname}:8891`;

export const PLAYBOOKS = {
  node_recovery: {
    id: 'node_recovery',
    trigger: 'node_offline',
    risk: 'low',
    steps: [
      { action: 'wait', params: { seconds: 10 }, confirm: false, desc: 'Wait for auto-reconnect' },
      { action: 'rescan_nodes', confirm: false, desc: 'Trigger discovery' },
      { action: 'check_node', verify: 'online', desc: 'Verify node status' },
      { action: 'suggest', message: 'Node still offline. Check power/wiring?', confirm: true },
    ]
  },
  playback_stuck: {
    id: 'playback_stuck',
    trigger: 'playback_mismatch',
    risk: 'low',
    steps: [
      { action: 'get_status', confirm: false, desc: 'Check backend state' },
      { action: 'stop_playback', confirm: false, desc: 'Force stop' },
      { action: 'suggest', message: 'Playback was stuck. Cleared.', confirm: false },
    ]
  },
  service_restart: {
    id: 'service_restart',
    trigger: 'service_down',
    risk: 'high',
    steps: [
      { action: 'suggest', message: 'Service appears down. Restart?', confirm: true },
      { action: 'restart_service', params: { service: 'aether-core' }, confirm: true },
    ]
  },
};

export async function runPlaybook(playbookId, context = {}) {
  const playbook = PLAYBOOKS[playbookId];
  if (!playbook) return { success: false, error: 'Unknown playbook' };
  
  const results = [];
  for (const step of playbook.steps) {
    if (step.confirm && !context.confirmed) {
      return { needsConfirm: true, step, results };
    }
    if (step.action === 'wait') {
      await new Promise(r => setTimeout(r, (step.params?.seconds || 5) * 1000));
    }
    if (step.action === 'suggest') {
      return { success: true, suggestion: step.message, results };
    }
    results.push({ step: step.action, done: true });
  }
  return { success: true, results };
}

export default { PLAYBOOKS, runPlaybook };
