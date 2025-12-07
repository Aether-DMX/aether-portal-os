import React from 'react';
import { Play, Square, Edit, Copy, Trash2, Zap, Clock } from 'lucide-react';

export default function ChaseCard({ 
  chase, 
  isRunning,
  onStart, 
  onStop,
  onEdit, 
  onDuplicate, 
  onDelete 
}) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold truncate">{chase.name}</h3>
            {isRunning && (
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium animate-pulse">
                Running
              </span>
            )}
          </div>
          {chase.description && (
            <p className="text-sm text-slate-400 line-clamp-2">
              {chase.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>{chase.steps.length} steps</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{chase.speed}ms</span>
        </div>
        {chase.loop && (
          <span className="text-accent-400">Loop</span>
        )}
      </div>

      <div className="flex gap-2">
        {isRunning ? (
          <button
            onClick={() => onStop(chase)}
            className="flex-1 glass-button py-3 bg-red-500/20 hover:bg-red-500/30 font-semibold"
          >
            <Square className="w-4 h-4 mr-2 inline" />
            Stop
          </button>
        ) : (
          <button
            onClick={() => onStart(chase)}
            className="flex-1 glass-button py-3 bg-green-500/20 hover:bg-green-500/30 font-semibold"
          >
            <Play className="w-4 h-4 mr-2 inline" />
            Start
          </button>
        )}

        <button onClick={() => onEdit(chase)} className="glass-button p-3">
          <Edit className="w-4 h-4" />
        </button>

        <button onClick={() => onDuplicate(chase)} className="glass-button p-3">
          <Copy className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(chase)}
          className="glass-button p-3 hover:bg-red-500/20"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}
