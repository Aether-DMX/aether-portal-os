import express from 'express';
import axios from 'axios';
const router = express.Router();
const AETHER_CORE = 'http://localhost:8891';

// GET /api/dmx/state/:universe - Get current DMX state
router.get('/state/:universe', async (req, res) => {
  try {
    const response = await axios.get(AETHER_CORE + '/api/dmx/universe/' + req.params.universe + '/state');
    res.json(response.data);
  } catch (error) {
    console.error('DMX state GET error:', error.message);
    // Return zeros if can't get state
    res.json({ channels: new Array(512).fill(0) });
  }
});

// POST /api/dmx/set - Set DMX channels
router.post('/set', async (req, res) => {
  try {
    console.log('DMX SET:', req.body);
    const response = await axios.post(AETHER_CORE + '/api/dmx/set', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('DMX SET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dmx/blackout - Blackout
router.post('/blackout', async (req, res) => {
  try {
    console.log('DMX BLACKOUT:', req.body);
    const response = await axios.post(AETHER_CORE + '/api/dmx/blackout', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('DMX BLACKOUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;

// Rebalance universe - split channels evenly between all nodes
router.post('/universe/:universe/rebalance', async (req, res) => {
  try {
    const universe = parseInt(req.params.universe);
    const CORE_URL = 'http://localhost:8891';
    
    // Get all nodes in this universe
    const nodesRes = await axios.get(CORE_URL + '/api/nodes');
    const allNodes = nodesRes.data;
    const universeNodes = allNodes.filter(n => n.universe === universe && (n.is_paired || n.is_builtin));
    
    if (universeNodes.length === 0) {
      return res.status(404).json({ error: 'No nodes in this universe' });
    }
    
    // Calculate split
    const channelsPerNode = Math.floor(512 / universeNodes.length);
    
    // Update each node
    for (let i = 0; i < universeNodes.length; i++) {
      const node = universeNodes[i];
      const startCh = i * channelsPerNode + 1;
      const endCh = (i === universeNodes.length - 1) ? 512 : (i + 1) * channelsPerNode;
      
      // Update node in database
      await axios.post(CORE_URL + '/api/nodes/' + node.node_id + '/configure', {
        universe: universe,
        channelStart: startCh,
        channelEnd: endCh
      });
    }
    
    // Return updated nodes
    const updatedRes = await axios.get(CORE_URL + '/api/nodes');
    res.json(updatedRes.data.filter(n => n.universe === universe));
    
  } catch (err) {
    console.error('Rebalance error:', err);
    res.status(500).json({ error: err.message });
  }
});
