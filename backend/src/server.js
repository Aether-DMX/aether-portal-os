import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import olaService from './services/OLAService.js';
import dmxService from './services/DMXService.js';
import dmxRoutes from './routes/dmx.js';
import aiRoutes from './routes/ai.js';
import nodesRoutes from './routes/nodes.js';
import settingsRoutes from './routes/settings.js';
import chaseRoutes from './routes/chase.js';
import sceneRoutes from './routes/scene.js';
import { errorHandler } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_PATH = path.join(__dirname, '../../frontend/dist');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// API Routes - These proxy to AETHER Core (port 8891) which is the SSOT
app.use('/api/dmx', dmxRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chase', chaseRoutes);
app.use('/api/chases', chaseRoutes);
app.use('/api/scenes', sceneRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ola: olaService.isConnected() });
});

// Serve static frontend files
app.use(express.static(FRONTEND_PATH));

// Catch-all: serve index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});
app.use(errorHandler);

// Socket.IO connection handling
// Note: Node status is managed by AETHER Core (port 8891) via WebSocket
// This Socket.IO is for frontend real-time updates only
io.on('connection', (socket) => {
  logger.info('Client connected to Socket.IO');

  socket.on('disconnect', () => {
    logger.info('Client disconnected from Socket.IO');
  });
});

// Start server
server.listen(3000, '0.0.0.0', () => {
  logger.info('AETHER DMX running on port 3000');
  logger.info('AI Assistant enabled');
});
