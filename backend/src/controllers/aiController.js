import aiService from '../services/AIService.js';
import logger from '../utils/logger.js';

export const sendMessage = async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
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
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
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
  const { tool, action, args } = req.body;
  
  try {
    const result = await aiService.executeTool(tool, action, args);
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
