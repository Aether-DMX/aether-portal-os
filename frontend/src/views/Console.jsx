import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Square, AlertTriangle, Activity, Layers,
  Sparkles, Moon, Zap, RefreshCw, ChevronLeft, ChevronRight, 
  Eye, Check, X, Settings2
} from 'lucide-react';
import useDMXStore from '../store/dmxStore';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';
import useNodeStore from '../store/nodeStore';

// Apply Scene Modal - Select output destination
function ApplyModal({ scene, onApply, onClose }) {
  const [fadeTime, setFadeTime] = useState(1.5);
  const [outputMode, setOutputMode] = useState('all'); // 'all', 'universe', 'node'
  const [selectedUniverse, setSelectedUniverse] = useState(1);

  if (!scene) return null;

  const handleApplyClick = () => {
    console.log('🔴 Apply button clicked!', { scene: scene?.name, fadeTime: fadeTime * 1000, outputMode, selectedUniverse });
    onApply({ scene, fadeTime: fadeTime * 1000, outputMode, selectedUniverse });
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-3"
      onPointerUp={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-panel rounded-2xl border w-full max-w-md"
        style={{ borderColor: 'rgba(var(--theme-primary-rgb), 0.3)', background: 'rgba(0,0,0,0.9)' }}
        onPointerUp={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--theme-primary)' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{scene.name}</h2>
                <p className="text-xs text-white/50">Configure & Apply</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Output Selection */}
          <div>
            <label className="text-xs text-white/60 font-semibold mb-2 block">OUTPUT TO</label>
            <div className="grid grid-cols-3 gap-2">
              {['all', 'universe'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setOutputMode(mode)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    outputMode === mode 
                      ? 'text-white' 
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                  style={outputMode === mode ? { background: 'var(--theme-primary)' } : {}}
                >
                  {mode === 'all' ? 'All Outputs' : 'Universe'}
                </button>
              ))}
            </div>

            {outputMode === 'universe' && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(u => (
                  <button
                    key={u}
                    onClick={() => setSelectedUniverse(u)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedUniverse === u 
                        ? 'text-white' 
                        : 'bg-white/10 text-white/60'
                    }`}
                    style={selectedUniverse === u ? { background: 'var(--theme-primary)' } : {}}
                  >
                    U{u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fade Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/60 font-semibold">FADE TIME</label>
              <span className="text-sm font-bold text-white">{fadeTime}s</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="0.5"
              value={fadeTime}
              onChange={(e) => setFadeTime(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ 
                background: `linear-gradient(to right, var(--theme-primary) ${(fadeTime/5)*100}%, rgba(255,255,255,0.1) ${(fadeTime/5)*100}%)`
              }}
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>Instant</span>
              <span>5s</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onPointerUp={(e) => { e.preventDefault(); onClose(); }}
            className="flex-1 py-3 rounded-xl font-semibold text-white/70 bg-white/10 hover:bg-white/20 transition-all active:scale-95">
            Cancel
          </button>
          <button
            onPointerUp={(e) => { e.preventDefault(); handleApplyClick(); }}
            className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--theme-primary)' }}>
            <Play className="w-4 h-4" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Console() {
  const navigate = useNavigate();
  
  const { universeState, blackoutAll, fetchUniverseState, setChannels } = useDMXStore();
  const { scenes, currentScene, fetchScenes, playScene, stopScene } = useSceneStore();
  const { chases, activeChase, fetchChases, startChase, stopChase } = useChaseStore();
  const { nodes } = useNodeStore();

  const [masterLevel, setMasterLevel] = useState(100);
  const [isBlackout, setIsBlackout] = useState(false);
  const [activeChannelCount, setActiveChannelCount] = useState(0);
  const [showChases, setShowChases] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pendingScene, setPendingScene] = useState(null);

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    fetchScenes();
    fetchChases();
  }, [fetchScenes, fetchChases]);

  useEffect(() => {
    const count = universeState.filter(v => v > 0).length;
    setActiveChannelCount(count);
  }, [universeState]);

  useEffect(() => {
    fetchUniverseState(1);
    const interval = setInterval(() => fetchUniverseState(1), 1000);
    return () => clearInterval(interval);
  }, [fetchUniverseState]);

  useEffect(() => {
    setCurrentPage(0);
  }, [showChases]);

  const handleBlackout = useCallback(() => {
    if (!isBlackout) {
      blackoutAll(1000);
      stopScene();
      if (activeChase) {
        stopChase(activeChase.chase_id || activeChase.id);
      }
    }
    setIsBlackout(!isBlackout);
  }, [isBlackout, blackoutAll, stopScene, activeChase, stopChase]);

  const handleStop = useCallback(() => {
    blackoutAll(1000);
    stopScene();
    if (activeChase) {
      stopChase(activeChase.chase_id || activeChase.id);
    }
    setIsBlackout(false);
  }, [blackoutAll, stopScene, activeChase, stopChase]);

  // Scene click -> open modal
  const handleSceneClick = (scene) => {
    setPendingScene(scene);
  };

  // Apply scene from modal
  const handleApplyScene = useCallback(async ({ scene, fadeTime, outputMode, selectedUniverse }) => {
    console.log('🟡 handleApplyScene START', { scene: scene?.name, fadeTime, outputMode, selectedUniverse });
    // Close modal immediately so user gets feedback
    setPendingScene(null);

    try {
      const sceneId = scene.scene_id || scene.id;
      // Pass universe option based on outputMode selection
      const options = outputMode === 'universe' ? { universe: selectedUniverse } : {};
      console.log('🎬 Apply scene:', scene.name, 'fade:', fadeTime, 'output:', outputMode, 'universe:', selectedUniverse);
      console.log('🔵 Calling playScene with:', sceneId, fadeTime, options);
      await playScene(sceneId, fadeTime, options);
      console.log('✅ playScene completed');
      setIsBlackout(false);
    } catch (e) {
      console.error('❌ Failed to play scene:', e);
    }
  }, [playScene]);

  const handlePlayChase = useCallback(async (chase) => {
    try {
      const chaseId = chase.chase_id || chase.id;
      await startChase(chaseId);
      setIsBlackout(false);
    } catch (e) {
      console.error('Failed to start chase:', e);
    }
  }, [startChase]);

  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const isPlaying = currentScene !== null || activeChase !== null;

  // Pagination
  const items = showChases ? chases : scenes;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const pagedItems = items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setCurrentPage(p => Math.max(p - 1, 0));

  return (
    <div className="page-container">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">

        {/* Main Content - Clean 2 Column Layout */}
        <div className="flex-1 flex gap-3 min-h-0">

          {/* Left Column: Master Control */}
          <div className="w-32 flex flex-col gap-3">
            {/* Master Fader */}
            <div className="flex-1 rounded-2xl p-3 flex flex-col items-center"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              
              <span className="text-[10px] text-white/40 font-semibold tracking-widest mb-2">MASTER</span>

              {/* Circular Dial */}
              <div className="relative w-24 h-24 mb-3">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                  <circle cx="48" cy="48" r="42"
                    stroke={isBlackout ? '#ef4444' : 'var(--theme-primary)'}
                    strokeWidth="6" fill="none"
                    strokeDasharray={`${(masterLevel / 100) * 264} 264`}
                    strokeLinecap="round"
                    style={{ 
                      transition: 'stroke-dasharray 0.15s ease',
                      filter: isBlackout ? 'none' : 'drop-shadow(0 0 8px var(--theme-primary))'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {isBlackout ? '0' : masterLevel}
                  </span>
                  <span className="text-[9px] text-white/40">%</span>
                </div>
              </div>

              {/* Slider */}
              <input type="range" min="0" max="100" value={masterLevel}
                onChange={(e) => setMasterLevel(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ 
                  background: `linear-gradient(to right, var(--theme-primary) ${masterLevel}%, rgba(255,255,255,0.1) ${masterLevel}%)`
                }}
                disabled={isBlackout}
              />

              {/* Status Indicators */}
              <div className="mt-3 flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/40">Active</span>
                  <span className="text-white font-medium">{activeChannelCount}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/40">Nodes</span>
                  <span className="text-white font-medium">{onlineNodes}</span>
                </div>
              </div>
            </div>

            {/* Blackout Button */}
            <button onClick={handleBlackout}
              className={`py-4 rounded-2xl font-bold text-sm transition-all ${
                isBlackout 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                  : 'text-red-400 hover:bg-red-500/20'
              }`}
              style={{ 
                background: isBlackout ? undefined : 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)'
              }}>
              <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
              {isBlackout ? 'RESTORE' : 'BLACKOUT'}
            </button>
          </div>

          {/* Right Column: Now Playing + Content */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            
            {/* Now Playing Bar */}
            <div className="rounded-2xl p-3 flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isPlaying ? '' : 'bg-white/5'
                }`}
                style={isPlaying ? { background: 'var(--theme-primary)', boxShadow: '0 0 20px var(--theme-primary)' } : {}}>
                  {isPlaying ? (
                    activeChase ? (
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-white" />
                    )
                  ) : (
                    <Moon className="w-6 h-6 text-white/30" />
                  )}
                </div>
                <div>
                  <div className="text-base font-bold text-white">
                    {activeChase?.name || currentScene?.name || 'Ready'}
                  </div>
                  <div className="text-xs text-white/40">
                    {activeChase ? 'Chase Running' : currentScene ? 'Scene Active' : 'Select a scene or chase'}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/view-live')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Eye className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-white/60">Live View</span>
                </button>

                {isPlaying && (
                  <button onClick={handleStop} 
                    className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all">
                    <Square className="w-5 h-5 text-red-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Area - Scenes/Chases */}
            <div className="flex-1 rounded-2xl p-3 flex flex-col min-h-0"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              
              {/* Header: Toggle + Pagination */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={() => setShowChases(false)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !showChases ? 'text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                    style={!showChases ? { background: 'var(--theme-primary)' } : {}}
                  >
                    Scenes ({scenes.length})
                  </button>
                  <button
                    onClick={() => setShowChases(true)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      showChases ? 'bg-green-500 text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    Chases ({chases.length})
                  </button>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={prevPage} disabled={currentPage === 0}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        currentPage === 0 ? 'opacity-20' : 'bg-white/5 hover:bg-white/10'
                      }`}>
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-xs text-white/40 min-w-[32px] text-center">{currentPage + 1}/{totalPages}</span>
                    <button onClick={nextPage} disabled={currentPage >= totalPages - 1}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        currentPage >= totalPages - 1 ? 'opacity-20' : 'bg-white/5 hover:bg-white/10'
                      }`}>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Grid - 3x2 */}
              <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-2 min-h-0">
                {pagedItems.length === 0 ? (
                  <div className="col-span-3 row-span-2 flex flex-col items-center justify-center">
                    {showChases ? (
                      <RefreshCw className="w-12 h-12 text-white/10 mb-3" />
                    ) : (
                      <Sparkles className="w-12 h-12 text-white/10 mb-3" />
                    )}
                    <p className="text-sm text-white/30 mb-4">
                      No {showChases ? 'chases' : 'scenes'} created yet
                    </p>
                    <button 
                      onClick={() => navigate(showChases ? '/chase-creator' : '/scene-creator')}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: showChases ? '#22c55e' : 'var(--theme-primary)' }}
                    >
                      Create {showChases ? 'Chase' : 'Scene'}
                    </button>
                  </div>
                ) : (
                  pagedItems.map((item) => {
                    const isScene = !showChases;
                    const isActive = isScene 
                      ? (currentScene?.scene_id === item.scene_id || currentScene?.id === item.id)
                      : (activeChase?.chase_id === item.chase_id || activeChase?.id === item.id);
                    
                    return (
                      <button
                        key={item.scene_id || item.chase_id || item.id}
                        onClick={() => isScene ? handleSceneClick(item) : handlePlayChase(item)}
                        className={`rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-1 relative overflow-hidden ${
                          isActive ? 'ring-2 ring-white' : ''
                        }`}
                        style={{
                          background: isActive 
                            ? (isScene ? 'var(--theme-primary)' : '#22c55e')
                            : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isActive ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {/* Active glow */}
                        {isActive && (
                          <div className="absolute inset-0 opacity-30"
                            style={{ background: `radial-gradient(circle at center, ${isScene ? 'var(--theme-primary)' : '#22c55e'}, transparent)` }} 
                          />
                        )}
                        
                        {showChases && isActive && (
                          <RefreshCw className="w-5 h-5 text-white animate-spin mb-1" />
                        )}
                        <span className={`text-sm truncate px-2 ${isActive ? 'text-white' : 'text-white/70'}`}>
                          {item.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] text-white/60">
                            {isScene ? 'Active' : 'Running'}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Scene Modal */}
      {pendingScene && (
        <ApplyModal 
          scene={pendingScene}
          onApply={handleApplyScene}
          onClose={() => setPendingScene(null)}
        />
      )}
    </div>
  );
}

export const ConsoleHeaderExtension = () => null;
