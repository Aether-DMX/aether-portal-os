import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, Edit, Trash2, Plus } from 'lucide-react';
import useSceneStore from '../store/sceneStore';

export default function Scenes() {
  const navigate = useNavigate();
  const { scenes, fetchScenes, playScene, deleteScene } = useSceneStore();

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  return (
    <div className="page-container">
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 theme-text" /> Scenes
          </h1>
          <button onClick={() => navigate('/scene-creator')} className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Scene
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {scenes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Sparkles className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-white/40 mb-4">No scenes created yet</p>
              <button onClick={() => navigate('/scene-creator')} className="btn btn-primary">
                Create Your First Scene
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {scenes.map((scene) => (
                <div key={scene.scene_id || scene.id} className="card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 theme-text" />
                    <span className="font-semibold text-white text-sm truncate flex-1">{scene.name}</span>
                  </div>
                  
                  {scene.channels && (
                    <p className="text-[10px] text-white/40 mb-2">
                      {Object.keys(scene.channels).length} channels
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => playScene(scene.scene_id || scene.id, 1000)}
                      className="flex-1 btn btn-sm btn-primary"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteScene(scene.scene_id || scene.id)}
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

export const ScenesHeaderExtension = () => null;
