import React, { useEffect, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, Trash2, Plus } from 'lucide-react';

export default function Timers() {
  const [timers, setTimers] = useState([]);

  return (
    <div className="page-container">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Timer className="w-5 h-5 theme-text" /> Timers
          </h1>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Timer
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {timers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Timer className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-white/40 mb-4">No timers created yet</p>
              <button className="btn btn-primary">Create Your First Timer</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {timers.map((timer) => (
                <div key={timer.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{timer.name}</h3>
                    <span className={`badge ${timer.running ? 'badge-success' : 'badge-info'}`}>
                      {timer.running ? 'Running' : 'Paused'}
                    </span>
                  </div>

                  <div className="text-3xl font-mono font-bold text-white text-center mb-3">
                    {timer.remaining || '00:00'}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 btn btn-sm btn-primary">
                      {timer.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="btn btn-sm btn-secondary">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button className="btn btn-sm btn-danger">
                      <Trash2 className="w-4 h-4" />
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

export const TimersHeaderExtension = () => null;
