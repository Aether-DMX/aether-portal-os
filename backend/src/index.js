import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';

import dmxRoutes from './routes/dmx.js';
import chaseRoutes from './routes/chase.js';
import sceneRoutes from './routes/scene.js';
import nodesRoutes from './routes/nodes.js';
import settingsRoutes from './routes/settings.js';
import groupsRoutes from './routes/groups.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = 3000;
const AETHER_CORE = 'http://localhost:8891';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/dmx', dmxRoutes);
app.use('/api/chase', chaseRoutes);
app.use('/api/chases', chaseRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/nodes', nodesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/groups', groupsRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    const coreHealth = await axios.get(`${AETHER_CORE}/api/health`);
    res.json({ 
      status: 'ok', 
      service: 'aether-backend',
      core: coreHealth.data
    });
  } catch (error) {
    res.json({ status: 'ok', service: 'aether-backend', core: 'unreachable' });
  }
});

// Socket.IO - Forward node updates from AETHER Core
io.on('connection', (socket) => {
  console.log('Client connected to Socket.IO');
  
  // Initial data fetch
  axios.get(`${AETHER_CORE}/api/nodes`)
    .then(res => socket.emit('nodes', res.data))
    .catch(err => console.error('Failed to fetch nodes:', err.message));
  
  axios.get(`${AETHER_CORE}/api/scenes`)
    .then(res => socket.emit('scenes', res.data))
    .catch(err => console.error('Failed to fetch scenes:', err.message));
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Poll AETHER Core for updates and broadcast to clients
setInterval(async () => {
  try {
    const nodesRes = await axios.get(`${AETHER_CORE}/api/nodes`);
    io.emit('nodes', nodesRes.data);
  } catch (error) {
    // Silent fail
  }
}, 5000);

server.listen(PORT, () => {
  console.log(`✓ AETHER Backend running on port ${PORT}`);
  console.log(`✓ Proxying to AETHER Core (${AETHER_CORE})`);
});
