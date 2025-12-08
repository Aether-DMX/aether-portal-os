import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, Zap, Layers, Calendar, Settings, Radio, Play, Square, Activity } from 'lucide-react';
import useNodeStore from '../store/nodeStore';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import useDMXStore from '../store/dmxStore';

const mainButtons = [
  { name: 'Live DMX', icon: Sliders, path: '/live-dmx', desc: 'Control & Monitor' },
  { name: 'Effects', icon: Zap, path: '/dmx-effects', desc: 'Scenes & Chases' },
  { name: 'Fixtures', icon: Layers, path: '/fixtures-menu', desc: 'Patch & Groups' },
  { name: 'Schedules', icon: Calendar, path: '/schedules-menu', desc: 'Automation' },
  { name: 'Settings', icon: Settings, path: '/settings', desc: 'System Config' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { nodes } = useNodeStore();
  const { scenes, currentScene, playScene } = useSceneStore();
  const { chases, activeChase, runningChases, startChase, stopChase } = useChaseStore();
  const { blackout } = useDMXStore();

  const onlineNodes = nodes.filter(n => n.status === 'online');
  const recentScenes = scenes.slice(0, 3);
  const recentChases = chases.slice(0, 2);

  return (
    <div className="page-container">
      {/* Status Strip */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            {/* Node Status */}
            <div className="flex items-center gap-1.5">
              <Radio size={12} className={onlineNodes.length > 0 ? 'text-green-400' : 'text-red-400'} />
              <span className="text-white/70">
                {onlineNodes.length}/{nodes.length} nodes
              </span>
            </div>

            {/* Active Effect */}
            {(currentScene || activeChase) && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(var(--theme-primary-rgb), 0.15)' }}>
                <Activity size={10} style={{ color: 'var(--theme-primary)' }} />
                <span style={{ color: 'var(--theme-primary)' }}>
                  {currentScene?.name || activeChase?.name}
                </span>
              </div>
            )}
          </div>

          {/* Quick Blackout */}
          <button
            onClick={() => blackout(1)}
            className="px-2 py-1 rounded text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Square size={12} className="inline mr-1" fill="currentColor" />
            Blackout
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-row flex-nowrap gap-4 justify-center items-center">
          {mainButtons.map((item, index) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="menu-card"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="menu-card-icon">
                <item.icon size={28} color="white" strokeWidth={2.5} />
              </div>
              <span className="menu-card-title">{item.name}</span>
              <span className="menu-card-desc">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access Row */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Recent Scenes */}
          {recentScenes.map(scene => (
            <button
              key={scene.scene_id || scene.id}
              onClick={() => playScene(scene.scene_id || scene.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={{
                background: currentScene?.scene_id === scene.scene_id ? 'rgba(var(--theme-primary-rgb), 0.2)' : 'rgba(255,255,255,0.05)',
                border: currentScene?.scene_id === scene.scene_id ? '1px solid rgba(var(--theme-primary-rgb), 0.4)' : '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <Play size={10} style={{ color: 'var(--theme-primary)' }} />
              <span className="text-white/80">{scene.name}</span>
            </button>
          ))}

          {/* Divider */}
          {recentScenes.length > 0 && recentChases.length > 0 && (
            <div className="w-px h-6 bg-white/10 mx-1" />
          )}

          {/* Recent Chases */}
          {recentChases.map(chase => {
            const isRunning = runningChases[chase.chase_id || chase.id];
            return (
              <button
                key={chase.chase_id || chase.id}
                onClick={() => isRunning ? stopChase(chase.chase_id || chase.id) : startChase(chase.chase_id || chase.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: isRunning ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: isRunning ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {isRunning ? (
                  <Square size={10} className="text-green-400" fill="currentColor" />
                ) : (
                  <Zap size={10} className="text-green-400" />
                )}
                <span className="text-white/80">{chase.name}</span>
              </button>
            );
          })}

          {/* Empty state */}
          {recentScenes.length === 0 && recentChases.length === 0 && (
            <span className="text-white/30 text-xs">No recent scenes or chases</span>
          )}
        </div>
      </div>
    </div>
  );
}

export const DashboardHeaderExtension = () => null;
