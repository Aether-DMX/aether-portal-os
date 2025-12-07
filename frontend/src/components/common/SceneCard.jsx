import React, { useState } from 'react';
import { Play, Edit, Copy, Trash2, Clock, Layers } from 'lucide-react';

const colorMap = {
  blue: 'from-blue-600 to-blue-800',
  purple: 'from-purple-600 to-purple-800',
  cyan: 'from-cyan-600 to-cyan-800',
  green: 'from-green-600 to-green-800',
  red: 'from-red-600 to-red-800',
  orange: 'from-orange-600 to-orange-800',
};

export default function SceneCard({ 
  scene, 
  onRecall, 
  onEdit, 
  onDuplicate, 
  onDelete 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const channelCount = Object.keys(scene.channels).length;
  const gradient = colorMap[scene.color] || colorMap.blue;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="glass-panel overflow-hidden group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Color Bar */}
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate mb-1">
              {scene.name}
            </h3>
            {scene.description && (
              <p className="text-sm text-slate-400 line-clamp-2">
                {scene.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>{channelCount} channels</span>
          </div>
          {scene.fadeTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{scene.fadeTime}ms</span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-slate-600 mb-3">
          Modified {formatDate(scene.updatedAt)}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onRecall(scene)}
            className="flex-1 glass-button py-3 hover:bg-accent-500/20 font-semibold"
          >
            <Play className="w-4 h-4 mr-2 inline" />
            Recall
          </button>

          <button
            onClick={() => onEdit(scene)}
            className="glass-button p-3"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDuplicate(scene)}
            className="glass-button p-3"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(scene)}
            className="glass-button p-3 hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Hover Effect */}
      {isHovered && (
        <div className="absolute inset-0 bg-accent-500/5 pointer-events-none" />
      )}
    </div>
  );
}
