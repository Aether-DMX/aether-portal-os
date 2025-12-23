// AETHER AI Module
export { parseIntent, LOCAL_PATTERNS } from './intentRouter';
export { loadOpsRegistry, isAllowed, needsConfirm, needsModal, execute } from './executor';
export { validate, clampValue } from './validator';
export { generateCorrelationId, recordAccept, recordDismiss, recordSave, getOutcomes } from './learner';
