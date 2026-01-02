import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import fs from 'fs';
import { execSync } from 'child_process';
import logger from './utils/logger.js';
import dmxService from './services/DMXService.js';
import dmxRoutes from './routes/dmx.js';
import aiRoutes from './routes/ai.js';
import nodesRoutes from './routes/nodes.js';
import settingsRoutes from './routes/settings.js';
import chaseRoutes from './routes/chase.js';
import sceneRoutes from './routes/scene.js';
import proxyRoutes from './routes/proxy.js';
import { errorHandler } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// === STARTUP GUARDRAILS ===
const PORT = process.env.PORT || 3000;

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_PATH = path.join(__dirname, '../../frontend/dist');

// Get version info at startup
function getVersionInfo() {
  const cwd = process.cwd();
  let gitCommit = 'unknown';
  let gitBranch = 'unknown';
  let buildTime = new Date().toISOString();

  try {
    gitCommit = execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf-8' }).trim();
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
  } catch (e) {
    logger.warn('Could not get git info:', e.message);
  }

  // Check for package.json build time or use current
  try {
    const pkgPath = path.join(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    buildTime = pkg.buildTime || buildTime;
  } catch (e) {
    // Ignore
  }

  return { cwd, gitCommit, gitBranch, buildTime, port: PORT };
}

// Check for duplicate Aether installations (outside /srv/aether)
function checkForDuplicates() {
  const cwd = process.cwd();
  const canonicalBase = '/srv/aether';

  if (!cwd.startsWith(canonicalBase)) {
    logger.warn(`⚠️  WARNING: Running from non-canonical path!`);
    logger.warn(`   Current: ${cwd}`);
    logger.warn(`   Expected: ${canonicalBase}/portal-os/backend`);
    logger.warn(`   This may indicate a misconfiguration.`);
  }

  // Check for other Aether directories that shouldn't exist
  const suspiciousPaths = [
    '/home/ramzt/aether-portal-os',
    '/home/ramzt/aether-portal-os-git',
    '/home/ramzt/Aether-DMX',
    '/home/pi/Aether-DMX'
  ];

  const existingDuplicates = suspiciousPaths.filter(p => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });

  if (existingDuplicates.length > 0) {
    logger.warn(`⚠️  Found potential duplicate Aether installations:`);
    existingDuplicates.forEach(p => logger.warn(`   - ${p}`));
    logger.warn(`   Consider removing these to prevent confusion.`);
  }
}

const VERSION_INFO = getVersionInfo();

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

// Additional proxy routes for all other endpoints
app.use('/api', proxyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', transport: 'udpjson', note: 'DMX output via AETHER Core UDPJSON' });
});

// Version endpoint for deployment verification
app.get('/api/version', (req, res) => {
  res.json(VERSION_INFO);
});

// Serve static frontend files with cache control
// JS/CSS files have hashed names so they can be cached long-term
// HTML files should not be cached to ensure latest JS is loaded
app.use(express.static(FRONTEND_PATH, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // Never cache HTML - ensures latest JS bundle is referenced
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.match(/\.(js|css)$/)) {
      // Hashed assets can be cached for 1 year
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Catch-all: serve index.html for React Router (with no-cache headers)
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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

// Start server with guardrail checks
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`=== AETHER DMX Backend ===`);
  logger.info(`Port: ${PORT}`);
  logger.info(`CWD: ${VERSION_INFO.cwd}`);
  logger.info(`Git: ${VERSION_INFO.gitBranch}@${VERSION_INFO.gitCommit}`);
  logger.info(`Started: ${VERSION_INFO.buildTime}`);
  logger.info('AI Assistant enabled');

  // Run duplicate check after startup
  checkForDuplicates();
});
