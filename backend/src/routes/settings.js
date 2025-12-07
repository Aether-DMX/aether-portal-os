import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const SETTINGS_FILE = '/home/ramzt/Aether-DMX/settings.json';

// Load all settings
router.get('/all', async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    // Return defaults if file doesn't exist
    res.json({
      theme: '#64c8ff',
      background: {
        enabled: true,
        preset: 'default',
        speed: 'normal',
        bubbleCount: 40,
        intensity: 0.5,
        size: 1.0
      }
    });
  }
});

// Save theme
router.post('/theme', async (req, res) => {
  try {
    const { theme } = req.body;
    
    // Load existing settings
    let settings = {};
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf8');
      settings = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start fresh
    }
    
    settings.theme = theme;
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    res.json({ success: true, theme });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save background settings
router.post('/background', async (req, res) => {
  try {
    const backgroundSettings = req.body;
    
    // Load existing settings
    let settings = {};
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf8');
      settings = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start fresh
    }
    
    settings.background = backgroundSettings;
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
