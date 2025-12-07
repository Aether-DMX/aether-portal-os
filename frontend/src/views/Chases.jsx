import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Play, Square, Trash2, Plus } from 'lucide-react';
import useChaseStore from '../store/chaseStore';

export default function Chases() {
  const navigate = useNavigate();
  const { chases, activeChase, fetchChases, startChase, stopChase, deleteChase } = useChaseStore();

  useEffect(() => {
    fetchChases();
  }, [fetchChases]);

  const isActive = (chase) => activeChase?.chase_id === chase.chase_id || activeChase?.id === chase.id;

  return (
    <div className="page-container">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" /> Chases
          </h1>
          <button onClick={() => navigate('/chase-creator')} className="btn btn-success">
            <Plus className="w-4 h-4" /> New Chase
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {chases.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Zap className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-white/40 mb-4">No chases created yet</p>
              <button onClick={() => navigate('/chase-creator')} className="btn btn-success">
                Create Your First Chase
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {chases.map((chase) => (
                <div 
                  key={chase.chase_id || chase.id} 
                  className={`card p-3 ${isActive(chase) ? 'ring-2 ring-green-400' : ''}`}
                  style={isActive(chase) ? { background: 'rgba(34, 197, 94, 0.15)' } : {}}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={`w-4 h-4 ${isActive(chase) ? 'text-green-400 animate-pulse' : 'text-green-400'}`} />
                    <span className="font-semibold text-white text-sm truncate flex-1">{chase.name}</span>
                  </div>
                  
                  {chase.steps && (
                    <p className="text-[10px] text-white/40 mb-2">
                      {chase.steps.length} steps • {chase.bpm || 120} BPM
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    {isActive(chase) ? (
                      <button
                        onClick={() => stopChase(chase.chase_id || chase.id)}
                        className="flex-1 btn btn-sm btn-danger"
                      >
                        <Square className="w-3 h-3" /> Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => startChase(chase.chase_id || chase.id)}
                        className="flex-1 btn btn-sm btn-success"
                      >
                        <Play className="w-3 h-3" /> Run
                      </button>
                    )}
                    <button
                      onClick={() => deleteChase(chase.chase_id || chase.id)}
                      className="btn btn-sm btn-danger"
                      disabled={isActive(chase)}
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

export const ChasesHeaderExtension = () => null;
