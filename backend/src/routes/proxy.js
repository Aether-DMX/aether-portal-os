/**
 * AETHER Core Proxy Routes
 *
 * This module proxies all remaining endpoints to AETHER Core (Flask on port 8891).
 * These are endpoints that don't need special handling in the Express backend.
 */

import express from 'express';
import axios from 'axios';

const router = express.Router();
const AETHER_CORE = 'http://localhost:8891';

// Helper to proxy requests
const proxyTo = (endpoint, method = 'GET') => async (req, res) => {
  try {
    const url = `${AETHER_CORE}${endpoint}${req.params.id ? `/${req.params.id}` : ''}${req.params.action ? `/${req.params.action}` : ''}`;
    const config = { method, url };

    if (method !== 'GET' && method !== 'DELETE') {
      config.data = req.body;
    }

    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message };
    res.status(status).json(data);
  }
};

// ═══════════════════════════════════════════════════════════════════
// PLAYBACK ROUTES
// ═══════════════════════════════════════════════════════════════════
router.get('/playback/status', proxyTo('/api/playback/status'));
router.post('/playback/stop', proxyTo('/api/playback/stop', 'POST'));

// ═══════════════════════════════════════════════════════════════════
// EFFECTS ROUTES
// ═══════════════════════════════════════════════════════════════════
router.get('/effects', proxyTo('/api/effects'));
router.post('/effects/christmas', proxyTo('/api/effects/christmas', 'POST'));
router.post('/effects/twinkle', proxyTo('/api/effects/twinkle', 'POST'));
router.post('/effects/smooth', proxyTo('/api/effects/smooth', 'POST'));
router.post('/effects/wave', proxyTo('/api/effects/wave', 'POST'));
router.post('/effects/strobe', proxyTo('/api/effects/strobe', 'POST'));
router.post('/effects/pulse', proxyTo('/api/effects/pulse', 'POST'));
router.post('/effects/fade', proxyTo('/api/effects/fade', 'POST'));
router.post('/effects/fire', proxyTo('/api/effects/fire', 'POST'));
router.post('/effects/stop', proxyTo('/api/effects/stop', 'POST'));

// ═══════════════════════════════════════════════════════════════════
// SHOWS ROUTES
// ═══════════════════════════════════════════════════════════════════
router.get('/shows', proxyTo('/api/shows'));
router.post('/shows', proxyTo('/api/shows', 'POST'));
router.get('/shows/:id', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/shows/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.put('/shows/:id', async (req, res) => {
  try {
    const response = await axios.put(`${AETHER_CORE}/api/shows/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.delete('/shows/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${AETHER_CORE}/api/shows/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.post('/shows/:id/play', async (req, res) => {
  try {
    const response = await axios.post(`${AETHER_CORE}/api/shows/${req.params.id}/play`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.post('/shows/stop', proxyTo('/api/shows/stop', 'POST'));
router.post('/shows/pause', proxyTo('/api/shows/pause', 'POST'));
router.post('/shows/resume', proxyTo('/api/shows/resume', 'POST'));
router.post('/shows/tempo', proxyTo('/api/shows/tempo', 'POST'));

// ═══════════════════════════════════════════════════════════════════
// SCHEDULES ROUTES
// ═══════════════════════════════════════════════════════════════════
router.get('/schedules', proxyTo('/api/schedules'));
router.post('/schedules', proxyTo('/api/schedules', 'POST'));
router.get('/schedules/:id', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/schedules/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.put('/schedules/:id', async (req, res) => {
  try {
    const response = await axios.put(`${AETHER_CORE}/api/schedules/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.delete('/schedules/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${AETHER_CORE}/api/schedules/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.post('/schedules/:id/trigger', async (req, res) => {
  try {
    const response = await axios.post(`${AETHER_CORE}/api/schedules/${req.params.id}/trigger`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// FIXTURES ROUTES (proxy to Flask SSOT)
// ═══════════════════════════════════════════════════════════════════
router.get('/fixtures', proxyTo('/api/fixtures'));
router.post('/fixtures', proxyTo('/api/fixtures', 'POST'));
router.get('/fixtures/:id', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/fixtures/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.put('/fixtures/:id', async (req, res) => {
  try {
    const response = await axios.put(`${AETHER_CORE}/api/fixtures/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.delete('/fixtures/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${AETHER_CORE}/api/fixtures/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.get('/fixtures/universe/:universe', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/fixtures/universe/${req.params.universe}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.post('/fixtures/channels', proxyTo('/api/fixtures/channels', 'POST'));

// ═══════════════════════════════════════════════════════════════════
// GROUPS ROUTES (proxy to Flask SSOT)
// ═══════════════════════════════════════════════════════════════════
router.get('/groups', proxyTo('/api/groups'));
router.post('/groups', proxyTo('/api/groups', 'POST'));
router.get('/groups/:id', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/groups/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.put('/groups/:id', async (req, res) => {
  try {
    const response = await axios.put(`${AETHER_CORE}/api/groups/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.delete('/groups/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${AETHER_CORE}/api/groups/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SESSION ROUTES
// ═══════════════════════════════════════════════════════════════════
router.get('/session/resume', proxyTo('/api/session/resume'));
router.post('/session/resume', proxyTo('/api/session/resume', 'POST'));
router.post('/session/dismiss', proxyTo('/api/session/dismiss', 'POST'));

// ═══════════════════════════════════════════════════════════════════
// SYSTEM ROUTES
// ═══════════════════════════════════════════════════════════════════
router.get('/system/stats', proxyTo('/api/system/stats'));
router.post('/system/update', proxyTo('/api/system/update', 'POST'));
router.get('/system/update/check', proxyTo('/api/system/update/check'));
router.get('/system/autosync', proxyTo('/api/system/autosync'));
router.post('/system/autosync', proxyTo('/api/system/autosync', 'POST'));

// ═══════════════════════════════════════════════════════════════════
// SCREEN CONTEXT
// ═══════════════════════════════════════════════════════════════════
router.post('/screen-context', proxyTo('/api/screen-context', 'POST'));

// ═══════════════════════════════════════════════════════════════════
// DMX ADDITIONAL ROUTES
// ═══════════════════════════════════════════════════════════════════
router.get('/dmx/universe/:universe', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/dmx/universe/${req.params.universe}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.get('/dmx/status', proxyTo('/api/dmx/status'));
router.get('/dmx/diagnostics', proxyTo('/api/dmx/diagnostics'));
router.post('/dmx/fade', proxyTo('/api/dmx/fade', 'POST'));
router.post('/dmx/master', proxyTo('/api/dmx/master', 'POST'));
router.post('/dmx/master/reset', proxyTo('/api/dmx/master/reset', 'POST'));
router.post('/dmx/stop', proxyTo('/api/dmx/stop', 'POST'));

// ═══════════════════════════════════════════════════════════════════
// NODES ADDITIONAL ROUTES
// ═══════════════════════════════════════════════════════════════════
router.post('/nodes/:id/configure', async (req, res) => {
  try {
    const response = await axios.post(`${AETHER_CORE}/api/nodes/${req.params.id}/configure`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.post('/nodes/:id/sync', async (req, res) => {
  try {
    const response = await axios.post(`${AETHER_CORE}/api/nodes/${req.params.id}/sync`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});
router.post('/nodes/sync', proxyTo('/api/nodes/sync', 'POST'));
router.post('/nodes/scan', proxyTo('/api/nodes/scan', 'POST'));

// ═══════════════════════════════════════════════════════════════════
// CHASES ADDITIONAL ROUTES
// ═══════════════════════════════════════════════════════════════════
router.get('/chases/health', proxyTo('/api/chases/health'));

// ═══════════════════════════════════════════════════════════════════
// VERSION & HEALTH
// ═══════════════════════════════════════════════════════════════════
router.get('/version', proxyTo('/api/version'));
router.get('/arbitration', proxyTo('/api/arbitration'));

export default router;
