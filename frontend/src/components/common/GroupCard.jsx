import React from 'react';
import { Users, Edit, Trash2, Play } from 'lucide-react';

const fixtureIcons = {
  dimmer: '💡',
  rgb: '🌈',
  rgbw: '✨',
  moving: '🎯',
  strobe: '⚡',
  par: '🔦',
};

export default function GroupCard({ group, onControl, onEdit, onDelete }) {
  const icon = fixtureIcons[group.fixtureType] || '💡';

  return (
    <div className="glass-panel p-4 hover:bg-slate-800/60 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-3xl mb-2">{icon}</div>
          <h3 className="text-lg font-bold truncate mb-1">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-slate-400 line-clamp-2">
              {group.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Users className="w-4 h-4" />
        <span>{group.channels.length} channels</span>
        <span className="text-slate-700">•</span>
        <span className="capitalize">{group.fixtureType}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onControl(group)}
          className="flex-1 glass-button py-3 hover:bg-accent-500/20 font-semibold"
        >
          <Play className="w-4 h-4 mr-2 inline" />
          Control
        </button>

        <button
          onClick={() => onEdit(group)}
          className="glass-button p-3"
        >
          <Edit className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(group)}
          className="glass-button p-3 hover:bg-red-500/20"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}
