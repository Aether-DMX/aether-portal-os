import aiService from '../services/AIService.js';
import logger from '../utils/logger.js';

// Validation constants
const MAX_MESSAGE_LENGTH = 2000;
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const validateMessage = (message) => {
  if (!message) {
    return { valid: false, error: 'Message is required' };
  }
  if (typeof message !== 'string') {
    return { valid: false, error: 'Message must be a string' };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` };
  }
  return { valid: true };
};

const validateSessionId = (sessionId) => {
  if (!sessionId) {
    return { valid: true }; // Optional, will default to 'default'
  }
  if (typeof sessionId !== 'string') {
    return { valid: false, error: 'sessionId must be a string' };
  }
  if (sessionId.length > 100) {
    return { valid: false, error: 'sessionId exceeds maximum length of 100 characters' };
  }
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    return { valid: false, error: 'sessionId contains invalid characters (only alphanumeric, dash, underscore allowed)' };
  }
  return { valid: true };
};

export const sendMessage = async (req, res) => {
  const { message, sessionId } = req.body;

  const messageValidation = validateMessage(message);
  if (!messageValidation.valid) {
    return res.status(400).json({ error: messageValidation.error });
  }

  const sessionValidation = validateSessionId(sessionId);
  if (!sessionValidation.valid) {
    return res.status(400).json({ error: sessionValidation.error });
  }

  try {
    const response = await aiService.chat(message, sessionId);
    res.json(response);
  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const streamMessage = async (req, res) => {
  const { message, sessionId } = req.body;

  const messageValidation = validateMessage(message);
  if (!messageValidation.valid) {
    return res.status(400).json({ error: messageValidation.error });
  }

  const sessionValidation = validateSessionId(sessionId);
  if (!sessionValidation.valid) {
    return res.status(400).json({ error: sessionValidation.error });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await aiService.chatStream(message, sessionId, (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    logger.error('AI stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

export const getSession = async (req, res) => {
  const { sessionId } = req.query;
  const session = aiService.getSession(sessionId);
  res.json(session);
};

export const clearSession = async (req, res) => {
  const { sessionId } = req.body;
  aiService.clearSession(sessionId);
  res.json({ success: true });
};

export const executeTool = async (req, res) => {
  const { toolName, input } = req.body;

  if (!toolName) {
    return res.status(400).json({ error: 'toolName is required' });
  }

  try {
    const result = await aiService.executeTool(toolName, input || {});
    res.json(result);
  } catch (error) {
    logger.error('Tool execution error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getConfig = async (req, res) => {
  res.json(aiService.getConfig());
};

export const updateConfig = async (req, res) => {
  const config = req.body;
  aiService.updateConfig(config);
  res.json({ success: true });
};
