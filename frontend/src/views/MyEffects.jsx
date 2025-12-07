import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Play, Trash2, Plus } from 'lucide-react';
import useSceneStore from '../store/sceneStore';
import useChaseStore from '../store/chaseStore';

export default function MyEffects() {
  const navigate = useNavigate();
  const { scenes, fetchScenes, playScene, deleteScene } = useSceneStore();
  const { chases, fetchChases, startChase, deleteChase } = useChaseStore();
  const [activeTab, setActiveTab] = useState('scenes');

  useEffect(() => {
    fetchScenes();
    fetchChases();
  }, [fetchScenes, fetchChases]);

  const items = activeTab === 'scenes' ? scenes : chases;

  const handlePlay = (item) => {
    if (activeTab === 'scenes') {
      playScene(item.scene_id || item.id, 1000);
    } else {
      startChase(item.chase_id || item.id);
    }
  };

  const handleDelete = (item) => {
    if (activeTab === 'scenes') {
      deleteScene(item.scene_id || item.id);
    } else {
      deleteChase(item.chase_id || item.id);
    }
  };

  return (
    <div className="page-container">
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        
        {/* Header with tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5">
            <button
              onClick={() => setActiveTab('scenes')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'scenes' ? 'theme-bg text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Scenes ({scenes.length})
            </button>
            <button
              onClick={() => setActiveTab('chases')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'chases' ? 'bg-green-500 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Zap className="w-4 h-4" /> Chases ({chases.length})
            </button>
          </div>

          <button
            onClick={() => navigate(activeTab === 'scenes' ? '/scene-creator' : '/chase-creator')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              {activeTab === 'scenes' ? (
                <Sparkles className="w-16 h-16 text-white/10 mb-4" />
              ) : (
                <Zap className="w-16 h-16 text-white/10 mb-4" />
              )}
              <p className="text-white/40 mb-4">No {activeTab} saved yet</p>
              <button
                onClick={() => navigate(activeTab === 'scenes' ? '/scene-creator' : '/chase-creator')}
                className={`btn ${activeTab === 'scenes' ? 'btn-primary' : 'btn-success'}`}
              >
                Create Your First {activeTab === 'scenes' ? 'Scene' : 'Chase'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {items.map((item) => (
                <div key={item.scene_id || item.chase_id || item.id} className="card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {activeTab === 'scenes' ? (
                        <Sparkles className="w-4 h-4 theme-text" />
                      ) : (
                        <Zap className="w-4 h-4 text-green-400" />
                      )}
                      <span className="font-semibold text-white text-sm truncate">{item.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handlePlay(item)}
                      className={`flex-1 btn btn-sm ${activeTab === 'scenes' ? 'btn-primary' : 'btn-success'}`}
                    >
                      <Play className="w-3 h-3" /> Play
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const MyEffectsHeaderExtension = () => null;
