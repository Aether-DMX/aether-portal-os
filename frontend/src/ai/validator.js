// AETHER AI Validator - Safety checks before execution
import { isAllowed, needsConfirm, needsModal } from './executor';

// Risk levels for logging/UI
const RISK_LEVELS = { none: 0, low: 1, medium: 2, high: 3 };

// Clamp values to safe ranges
const CLAMPS = {
  fade_ms: { min: 0, max: 10000 },
  intensity: { min: 0, max: 100 },
  channel: { min: 1, max: 512 },
  universe: { min: 1, max: 4 },
};

export function clampValue(key, value) {
  const clamp = CLAMPS[key];
  if (!clamp) return value;
  return Math.max(clamp.min, Math.min(clamp.max, value));
}

export function validate(intent) {
  const result = { valid: true, errors: [], warnings: [], clamped: {} };
  
  if (!isAllowed(intent.action)) {
    result.valid = false;
    result.errors.push(`Action "${intent.action}" not allowed`);
    return result;
  }
  
  if (needsConfirm(intent.action)) {
    result.requiresConfirm = true;
  }
  
  if (needsModal(intent.action)) {
    result.requiresModal = true;
  }
  
  return result;
}

export default { validate, clampValue, RISK_LEVELS };
