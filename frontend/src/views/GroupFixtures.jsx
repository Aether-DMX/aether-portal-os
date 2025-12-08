import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Minus } from 'lucide-react';
import useGroupStore from '../store/groupStore';
import useToastStore from '../store/toastStore';

const COLORS = [
  { name: 'Red', value: '#FF0000' },
  { name: 'Orange', value: '#FF8000' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Cyan', value: '#00FFFF' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Purple', value: '#8000FF' },
  { name: 'Magenta', value: '#FF00FF' },
];

const FIXTURE_TYPES = [
  { name: 'Dimmer', channels: 1 },
  { name: 'RGB', channels: 3 },
  { name: 'RGBA', channels: 4 },
  { name: 'RGBW', channels: 4 },
  { name: 'Moving Head', channels: 16 },
];

export default function GroupFixtures() {
  const navigate = useNavigate();
  const { createGroup } = useGroupStore();
  const toast = useToastStore();

  const [groupName, setGroupName] = useState('');
  const [fixtureType, setFixtureType] = useState('RGB');
  const [color, setColor] = useState('#0000FF');
  const [startChannel, setStartChannel] = useState(1);
  const [numFixtures, setNumFixtures] = useState(1);

  const getChannels = () => {
    const type = FIXTURE_TYPES.find(t => t.name === fixtureType);
    const channelsPerFixture = type?.channels || 3;
    const channels = [];
    
    for (let i = 0; i < numFixtures; i++) {
      const baseChannel = startChannel + (i * channelsPerFixture);
      for (let j = 0; j < channelsPerFixture; j++) {
        channels.push(baseChannel + j);
      }
    }
    
    return channels;
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      toast.warning('Please enter a group name');
      return;
    }

    const channels = getChannels();

    createGroup({
      name: groupName,
      channels,
      color,
      fixtureType
    });

    toast.success(`Group "${groupName}" created!`);
    navigate('/fixtures-menu');
  };

  const channels = getChannels();
  const lastChannel = channels.length > 0 ? channels[channels.length - 1] : startChannel;

  return (
    <div className="fixed inset-0 bg-gradient-primary pt-[60px] pb-2 px-3">
      <div className="h-[calc(100vh-66px)] flex flex-col py-3">
        <h1 className="text-xl font-bold text-white text-center mb-4">Create Fixture Group</h1>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Group Name */}
            <div>
              <label className="text-xs font-bold text-white/80 mb-1 block">Group Name *</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Front Wash, Back RGB"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-white/40 outline-none"
                autoFocus
              />
            </div>

            {/* Fixture Type */}
            <div>
              <label className="text-xs font-bold text-white/80 mb-1 block">Fixture Type</label>
              <div className="grid grid-cols-3 gap-2">
                {FIXTURE_TYPES.map(type => (
                  <button
                    key={type.name}
                    onClick={() => setFixtureType(type.name)}
                    className="py-2 rounded-lg border font-bold text-white text-sm transition-all"
                    style={{
                      borderColor: fixtureType === type.name ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)',
                      backgroundColor: fixtureType === type.name ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'transparent'
                    }}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Tag */}
            <div>
              <label className="text-xs font-bold text-white/80 mb-1 block">Color Tag</label>
              <div className="grid grid-cols-8 gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className="aspect-square rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: c.value,
                      borderColor: color === c.value ? 'white' : 'rgba(255,255,255,0.3)'
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Channel Configuration */}
            <div className="glass-panel rounded-lg border p-3 space-y-3"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              <h3 className="text-sm font-bold text-white">Channel Assignment</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-white/80 mb-1 block">Start Channel</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setStartChannel(Math.max(1, startChannel - 1))}
                      className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="512"
                      value={startChannel}
                      onChange={(e) => setStartChannel(Math.max(1, Math.min(512, Number(e.target.value))))}
                      className="flex-1 px-2 py-1.5 rounded bg-white/10 border border-white/20 text-white text-center text-sm font-bold outline-none"
                    />
                    <button
                      onClick={() => setStartChannel(Math.min(512, startChannel + 1))}
                      className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-white/80 mb-1 block">Number of Fixtures</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setNumFixtures(Math.max(1, numFixtures - 1))}
                      className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={numFixtures}
                      onChange={(e) => setNumFixtures(Math.max(1, Math.min(50, Number(e.target.value))))}
                      className="flex-1 px-2 py-1.5 rounded bg-white/10 border border-white/20 text-white text-center text-sm font-bold outline-none"
                    />
                    <button
                      onClick={() => setNumFixtures(Math.min(50, numFixtures + 1))}
                      className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-2 rounded-lg bg-white/5 border border-white/20">
                <p className="text-xs text-white/80 mb-1">
                  <strong>Range:</strong> {startChannel} → {lastChannel}
                </p>
                <p className="text-xs text-white/80">
                  <strong>Total:</strong> {channels.length} channels
                </p>
                {lastChannel > 512 && (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ Exceeds DMX limit (512)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3 px-2">
          <button
            onClick={() => navigate('/fixtures-menu')}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={lastChannel > 512}
            className="flex-1 px-4 py-2.5 rounded-lg border text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            style={{
              background: lastChannel <= 512 ? 'linear-gradient(135deg, var(--theme-primary), rgba(var(--theme-primary-rgb), 0.7))' : 'rgba(255,255,255,0.1)',
              borderColor: lastChannel <= 512 ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)'
            }}
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export const GroupFixturesHeaderExtension = () => null;
