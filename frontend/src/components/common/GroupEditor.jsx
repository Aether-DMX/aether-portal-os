import React, { useState } from 'react';
import { X, Save, Plus, Minus } from 'lucide-react';

const fixtureTypes = [
  { value: 'dimmer', label: 'Dimmer', icon: '💡' },
  { value: 'rgb', label: 'RGB', icon: '🌈' },
  { value: 'rgbw', label: 'RGBW', icon: '✨' },
  { value: 'moving', label: 'Moving Head', icon: '🎯' },
  { value: 'strobe', label: 'Strobe', icon: '⚡' },
  { value: 'par', label: 'PAR Can', icon: '🔦' },
];

export default function GroupEditor({ group, onSave, onClose }) {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [fixtureType, setFixtureType] = useState(group?.fixtureType || 'dimmer');
  const [channels, setChannels] = useState(group?.channels || []);
  const [newChannel, setNewChannel] = useState('');

  const handleAddChannel = () => {
    const ch = parseInt(newChannel);
    if (ch >= 1 && ch <= 512 && !channels.includes(ch)) {
      setChannels([...channels, ch].sort((a, b) => a - b));
      setNewChannel('');
    }
  };

  const handleRemoveChannel = (ch) => {
    setChannels(channels.filter((c) => c !== ch));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Group name is required');
      return;
    }

    if (channels.length === 0) {
      alert('Add at least one channel');
      return;
    }

    onSave({
      ...group,
      name: name.trim(),
      description: description.trim(),
      fixtureType,
      channels,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {group ? 'Edit Group' : 'New Group'}
          </h2>
          <button onClick={onClose} className="glass-button p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full"
              placeholder="e.g., Front Wash"
              maxLength={50}
              required
            />
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
              placeholder="Optional..."
              maxLength={200}
            />
          </div>

          {/* Fixture Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Fixture Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {fixtureTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFixtureType(type.value)}
                  className={`glass-button p-4 ${
                    fixtureType === type.value
                      ? 'ring-2 ring-accent-500 bg-accent-500/20'
                      : ''
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Channels ({channels.length})
            </label>
            
            {/* Add Channel */}
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
                className="glass-input flex-1"
                placeholder="Channel (1-512)"
                min="1"
                max="512"
              />
              <button
                type="button"
                onClick={handleAddChannel}
                className="glass-button px-6"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Channel List */}
            <div className="glass-panel p-3 max-h-48 overflow-y-auto">
              {channels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {channels.map((ch) => (
                    <div
                      key={ch}
                      className="flex items-center gap-2 glass-button px-3 py-2"
                    >
                      <span className="font-mono">{ch}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChannel(ch)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-4">
                  No channels added yet
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-button py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 glass-button py-3 bg-accent-500/20 hover:bg-accent-500/30 font-semibold"
            >
              <Save className="w-4 h-4 mr-2 inline" />
              Save Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
