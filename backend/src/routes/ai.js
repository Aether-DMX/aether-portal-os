import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Chat endpoints
router.post('/chat', asyncHandler(aiController.sendMessage));
router.post('/chat/stream', asyncHandler(aiController.streamMessage));
router.get('/session', asyncHandler(aiController.getSession));
router.post('/session/clear', asyncHandler(aiController.clearSession));

// Tool execution
router.post('/tools/execute', asyncHandler(aiController.executeTool));

// Configuration
router.get('/config', asyncHandler(aiController.getConfig));
router.post('/config', asyncHandler(aiController.updateConfig));

export default router;
