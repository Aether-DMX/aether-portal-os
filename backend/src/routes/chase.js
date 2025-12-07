import express from 'express';
import axios from 'axios';

const router = express.Router();
const AETHER_CORE = 'http://localhost:8891';

// GET /api/chases
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(AETHER_CORE + '/api/chases');
    res.json(response.data);
  } catch (error) {
    console.error('Chase GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chases
router.post('/', async (req, res) => {
  try {
    const response = await axios.post(AETHER_CORE + '/api/chases', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Chase POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/chases/:id
router.delete('/:id', async (req, res) => {
  try {
    const response = await axios.delete(AETHER_CORE + '/api/chases/' + req.params.id);
    res.json(response.data);
  } catch (error) {
    console.error('Chase DELETE error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chases/:id/play
router.post('/:id/play', async (req, res) => {
  try {
    const response = await axios.post(AETHER_CORE + '/api/chases/' + req.params.id + '/play', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Chase PLAY error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chases/:id/stop
router.post('/:id/stop', async (req, res) => {
  try {
    const response = await axios.post(AETHER_CORE + '/api/chases/' + req.params.id + '/stop', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Chase STOP error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
