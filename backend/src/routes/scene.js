import express from 'express';
import axios from 'axios';

const router = express.Router();
const AETHER_CORE = 'http://localhost:8891';

// GET /api/scenes
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(AETHER_CORE + '/api/scenes');
    res.json(response.data);
  } catch (error) {
    console.error('Scene GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/scenes
router.post('/', async (req, res) => {
  try {
    const response = await axios.post(AETHER_CORE + '/api/scenes', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Scene POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/scenes/:id
router.delete('/:id', async (req, res) => {
  try {
    const response = await axios.delete(AETHER_CORE + '/api/scenes/' + req.params.id);
    res.json(response.data);
  } catch (error) {
    console.error('Scene DELETE error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/scenes/:id/play
router.post('/:id/play', async (req, res) => {
  try {
    const response = await axios.post(AETHER_CORE + '/api/scenes/' + req.params.id + '/play', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Scene PLAY error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
