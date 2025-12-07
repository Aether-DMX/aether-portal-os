import dmxService from '../services/DMXService.js';

export const getUniverse = (req, res) => {
  const universe = parseInt(req.params.universe);
  const state = dmxService.getUniverseState(universe);
  res.json({ universe, channels: state });
};

export const setChannel = (req, res) => {
  const universe = parseInt(req.params.universe);
  const channel = parseInt(req.params.channel);
  const { value } = req.body;
  dmxService.setChannel(universe, channel, value);
  res.json({ success: true });
};
