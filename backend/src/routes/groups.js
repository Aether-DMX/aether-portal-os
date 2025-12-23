import express from 'express';
import fs from 'fs/promises';

const router = express.Router();
const SETTINGS_FILE = '/home/ramzt/Aether-DMX/settings.json';

// Helper to load settings
async function loadSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Helper to save settings
async function saveSettings(settings) {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// GET /api/groups - Get all fixture groups
router.get('/', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings.fixtureGroups || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups - Create a new group
router.post('/', async (req, res) => {
  try {
    const { name, fixture_ids, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const settings = await loadSettings();
    const groups = settings.fixtureGroups || [];

    const newGroup = {
      id: Date.now().toString(),
      name: name.trim(),
      fixture_ids: fixture_ids || [],
      color: color || '#8b5cf6',
      created_at: new Date().toISOString()
    };

    groups.push(newGroup);
    settings.fixtureGroups = groups;
    await saveSettings(settings);

    res.json(newGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/groups/:id - Update a group
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fixture_ids, color } = req.body;

    const settings = await loadSettings();
    const groups = settings.fixtureGroups || [];
    const index = groups.findIndex(g => g.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Group not found' });
    }

    groups[index] = {
      ...groups[index],
      name: name?.trim() || groups[index].name,
      fixture_ids: fixture_ids ?? groups[index].fixture_ids,
      color: color || groups[index].color,
      updated_at: new Date().toISOString()
    };

    settings.fixtureGroups = groups;
    await saveSettings(settings);

    res.json(groups[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/groups/:id - Delete a group
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const settings = await loadSettings();
    const groups = settings.fixtureGroups || [];
    const filtered = groups.filter(g => g.id !== id);

    if (filtered.length === groups.length) {
      return res.status(404).json({ error: 'Group not found' });
    }

    settings.fixtureGroups = filtered;
    await saveSettings(settings);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/sync - Sync groups from frontend (migration helper)
router.post('/sync', async (req, res) => {
  try {
    const { groups } = req.body;

    if (!Array.isArray(groups)) {
      return res.status(400).json({ error: 'groups must be an array' });
    }

    const settings = await loadSettings();
    settings.fixtureGroups = groups;
    await saveSettings(settings);

    res.json({ success: true, count: groups.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
