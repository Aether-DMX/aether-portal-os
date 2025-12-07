import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Play } from 'lucide-react';

const colors = [
  { name: 'Blue', value: 'blue' },
  { name: 'Purple', value: 'purple' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'Green', value: 'green' },
  { name: 'Red', value: 'red' },
  { name: 'Orange', value: 'orange' },
  { name: 'White', value: 'white' },
];

export default function SceneEditor({ scene, onSave, onClose }) {
  const [name, setName] = useState(scene?.name || '');
  const [description, setDescription] = useState(scene?.description || '');
  const [fadeTime, setFadeTime] = useState(scene?.fade_ms || scene?.fadeTime || 0);
  const [color, setColor] = useState(scene?.color || 'blue');
  const [universe, setUniverse] = useState(scene?.universe || 1);
  const [channels, setChannels] = useState(scene?.channels || {});

  // Channel management
  const addChannel = () => {
    const nextChannel = Math.max(0, ...Object.keys(channels).map(Number)) + 1;
    setChannels({ ...channels, [nextChannel]: 0 });
  };

  const removeChannel = (ch) => {
    const newChannels = { ...channels };
    delete newChannels[ch];
    setChannels(newChannels);
  };

  const updateChannel = (ch, value) => {
    setChannels({ ...channels, [ch]: parseInt(value) || 0 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Scene name is required');
      return;
    }

    onSave({
      ...scene,
      name: name.trim(),
      description: description.trim(),
      fadeTime: parseInt(fadeTime) || 0,
      fade_ms: parseInt(fadeTime) || 0,
      color,
      universe: parseInt(universe),
      channels,
    });
  };

  const testScene = async () => {
    if (!name.trim()) {
      alert('Please name the scene first');
      return;
    }

    try {
      await onSave({
        ...scene,
        name: name.trim(),
        description: description.trim(),
        fadeTime: parseInt(fadeTime) || 0,
        fade_ms: parseInt(fadeTime) || 0,
        color,
        universe: parseInt(universe),
        channels,
      }, true); // true = test mode, don't close
      
      alert('Scene sent to DMX!');
    } catch (error) {
      alert('Failed to test scene: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {scene ? 'Edit Scene' : 'New Scene'}
          </h2>
          <button onClick={onClose} className="glass-button p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Scene Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full"
                placeholder="e.g., Warm Welcome"
                maxLength={50}
                required
              />
            </div>

            {/* Universe */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Universe
              </label>
              <input
                type="number"
                value={universe}
                onChange={(e) => setUniverse(e.target.value)}
                className="glass-input w-full"
                min="1"
                max="64"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full resize-none"
              rows={2}
              placeholder="Optional description..."
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fade Time */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Fade Time (ms)
              </label>
              <input
                type="number"
                value={fadeTime}
                onChange={(e) => setFadeTime(e.target.value)}
                className="glass-input w-full"
                min="0"
                max="10000"
                step="100"
              />
              <p className="text-xs text-slate-400 mt-1">
                0 = instant, 1000 = 1 second
              </p>
            </div>

            {/* Color Tag */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Color Tag
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="glass-input w-full"
              >
                {colors.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Channel Editor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">
                DMX Channels
              </label>
              <button
                type="button"
                onClick={addChannel}
                className="glass-button px-3 py-1 text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Channel
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.keys(channels).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No channels defined. Click "Add Channel" to start.
                </p>
              ) : (
                Object.entries(channels)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([ch, value]) => (
                    <div key={ch} className="flex items-center gap-3 glass-panel p-3">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-slate-400">Channel</label>
                          <input
                            type="number"
                            value={ch}
                            onChange={(e) => {
                              const newCh = e.target.value;
                              const newChannels = { ...channels };
                              delete newChannels[ch];
                              newChannels[newCh] = value;
                              setChannels(newChannels);
                            }}
                            className="glass-input w-full"
                            min="1"
                            max="512"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Value (0-255)</label>
                          <input
                            type="number"
                            value={value}
                            onChange={(e) => updateChannel(ch, e.target.value)}
                            className="glass-input w-full"
                            min="0"
                            max="255"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Slider</label>
                          <input
                            type="range"
                            value={value}
                            onChange={(e) => updateChannel(ch, e.target.value)}
                            className="w-full"
                            min="0"
                            max="255"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeChannel(ch)}
                        className="glass-button p-2 text-red-500 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={testScene}
              className="glass-button px-6 py-2 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Test Now
            </button>
            <button
              type="submit"
              disabled={!name.trim() || Object.keys(channels).length === 0}
              className="px-8 py-2 bg-[var(--theme-primary)] text-black rounded-xl font-bold hover:opacity-80 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Scene
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
