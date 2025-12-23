// AETHER AI Learner - Record outcomes to SSOT
const API = `http://${window.location.hostname}:8891`;

let correlationCounter = 0;

export function generateCorrelationId() {
  correlationCounter++;
  return `ai-${Date.now()}-${correlationCounter}`;
}

export async function recordOutcome(correlationId, intent, userScope, action, success) {
  try {
    await fetch(`${API}/api/ai/outcomes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correlation_id: correlationId,
        intent_type: intent.action,
        suggested_scope: intent.params,
        user_scope: userScope,
        action,
        success
      })
    });
  } catch (e) {
    console.error('Failed to record outcome:', e);
  }
}

export async function recordAccept(correlationId, intent, userScope = null) {
  await recordOutcome(correlationId, intent, userScope || intent.params, 'accepted', true);
}

export async function recordDismiss(correlationId, intent) {
  await recordOutcome(correlationId, intent, null, 'dismissed', false);
}

export async function recordSave(correlationId, intent, savedAs) {
  await recordOutcome(correlationId, intent, { savedAs }, 'saved', true);
}

export async function getOutcomes(intentType = null, limit = 50) {
  const url = intentType 
    ? `${API}/api/ai/outcomes?intent_type=${intentType}&limit=${limit}`
    : `${API}/api/ai/outcomes?limit=${limit}`;
  const res = await fetch(url);
  return res.json();
}

export default { generateCorrelationId, recordOutcome, recordAccept, recordDismiss, recordSave, getOutcomes };
