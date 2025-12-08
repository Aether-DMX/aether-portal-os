import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Zap, Radio } from 'lucide-react';
import useDMXStore from '../store/dmxStore';
import useGroupStore from '../store/groupStore';

export default function ViewLive() {
  const navigate = useNavigate();
  const { universeState, currentUniverse, configuredUniverses, initSocket, setCurrentUniverse } = useDMXStore();
  const { groups } = useGroupStore();
  const [activeChannels, setActiveChannels] = useState([]);

  useEffect(() => {
    initSocket();
  }, []);

  useEffect(() => {
    const active = [];
    universeState.forEach((value, index) => {
      if (value > 0) {
        active.push({ channel: index + 1, value });
      }
    });
    setActiveChannels(active);
  }, [universeState]);

  // setCurrentUniverse already fetches state internally
  const handleUniverseChange = (universe) => {
    setCurrentUniverse(universe);
  };

  const getChannelGroup = (channel) => {
    return groups.find(g => g.channels.includes(channel));
  };

  const getIntensityColor = (value) => {
    const intensity = (value / 255) * 100;
    if (intensity < 25) return 'rgba(100, 200, 255, 0.3)';
    if (intensity < 50) return 'rgba(100, 200, 255, 0.5)';
    if (intensity < 75) return 'rgba(100, 200, 255, 0.7)';
    return 'rgba(100, 200, 255, 1)';
  };

  return (
    <div className="fixed inset-0 bg-gradient-primary pt-[60px] pb-2 px-3">
      <div className="h-[calc(100vh-66px)] flex flex-col py-3">
        {/* Universe Tabs */}
        {configuredUniverses.length > 1 && (
          <div className="flex gap-2 items-center justify-center mb-3">
            {configuredUniverses.map(universe => (
              <button
                key={universe}
                onClick={() => handleUniverseChange(universe)}
                className="px-4 py-2 rounded-lg border text-sm font-bold transition-all flex items-center gap-2"
                style={{
                  borderColor: currentUniverse === universe ? 'var(--theme-primary)' : 'rgba(255,255,255,0.2)',
                  backgroundColor: currentUniverse === universe ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)',
                  color: 'white'
                }}
              >
                <Radio size={14} style={{ color: currentUniverse === universe ? 'var(--theme-primary)' : 'rgba(255,255,255,0.5)' }} />
                Universe {universe}
              </button>
            ))}
          </div>
        )}

        {/* Compact Stats */}
        <div className="flex gap-3 items-center justify-center mb-3">
          <div className="glass-panel rounded-lg border px-4 py-2 flex items-center gap-2"
            style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
            <Activity size={18} className="text-green-400" />
            <div>
              <p className="text-xs text-white/60">Active</p>
              <p className="text-lg font-bold text-white">{activeChannels.length}</p>
            </div>
          </div>

          <div className="glass-panel rounded-lg border px-4 py-2 flex items-center gap-2"
            style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
            <Zap size={18} style={{ color: 'var(--theme-primary)' }} />
            <div>
              <p className="text-xs text-white/60">Universe</p>
              <p className="text-lg font-bold text-white">{currentUniverse}</p>
            </div>
          </div>

          <div className="glass-panel rounded-lg border px-4 py-2 flex items-center gap-2"
            style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}>
            <Radio size={14} className="text-white/60" />
            <div>
              <p className="text-xs text-white/60">Universes</p>
              <p className="text-lg font-bold text-white">{configuredUniverses.length}</p>
            </div>
          </div>
        </div>

        {/* Active Channels Grid */}
        <div className="flex-1 overflow-y-auto">
          {activeChannels.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Activity size={48} className="text-white/30 mx-auto mb-3" />
                <p className="text-white/60 text-base">No active channels</p>
                <p className="text-white/40 text-sm">Move faders to see output</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {activeChannels.map(({ channel, value }) => {
                const group = getChannelGroup(channel);
                const intensity = Math.round((value / 255) * 100);

                return (
                  <div
                    key={channel}
                    className="glass-panel rounded-lg border p-2 transition-all"
                    style={{
                      borderColor: group ? group.color : 'rgba(255, 255, 255, 0.15)',
                      backgroundColor: getIntensityColor(value),
                      boxShadow: `0 0 ${intensity / 3}px ${group?.color || 'rgba(100, 200, 255, 0.5)'}`
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">Ch {channel}</span>
                      <span className="text-xs font-bold text-white">{intensity}%</span>
                    </div>

                    {group && (
                      <p className="text-xs text-white/70 truncate mb-1">{group.name}</p>
                    )}

                    {/* Intensity Bar */}
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all"
                        style={{ width: `${intensity}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/live-dmx')}
          className="mx-auto mt-3 px-6 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold flex items-center gap-2 hover:bg-white/20 transition-all"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
    </div>
  );
}

export const ViewLiveHeaderExtension = () => null;
