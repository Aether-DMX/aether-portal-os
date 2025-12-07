import express from 'express';
import axios from 'axios';

const router = express.Router();
const AETHER_CORE = 'http://localhost:8891';

// GET /api/nodes - All nodes
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/nodes`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nodes/paired
router.get('/paired', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/nodes/paired`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nodes/pending
router.get('/pending', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/nodes/pending`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nodes/online
router.get('/online', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/nodes/online`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/nodes/:id
router.get('/:id', async (req, res) => {
  try {
    const response = await axios.get(`${AETHER_CORE}/api/nodes/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nodes/:id/pair
router.post('/:id/pair', async (req, res) => {
  try {
    const response = await axios.post(`${AETHER_CORE}/api/nodes/${req.params.id}/pair`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/nodes/:id/unpair
router.post('/:id/unpair', async (req, res) => {
  try {
    const response = await axios.post(`${AETHER_CORE}/api/nodes/${req.params.id}/unpair`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/nodes/:id
router.delete('/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${AETHER_CORE}/api/nodes/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
