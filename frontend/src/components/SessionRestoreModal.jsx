import React, { useEffect, useState } from 'react';
import { Play, X, Clock, Zap } from 'lucide-react';
import useUnifiedPlaybackStore from '../store/unifiedPlaybackStore';

/**
 * Session Restore Modal
 *
 * Shown on startup if there was an active playback session before shutdown.
 * Allows user to quickly restore their previous lighting state.
 */
function SessionRestoreModal({ onClose }) {
  const { lastSession, restoreLastSession, clearLastSession } = useUnifiedPlaybackStore();
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState(null);

  if (!lastSession) return null;

  const getTypeLabel = (type) => {
    const labels = {
      look: 'Look',
      sequence: 'Sequence',
      chase: 'Chase',
      scene: 'Scene',
      effect: 'Effect',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      look: 'text-purple-400',
      sequence: 'text-blue-400',
      chase: 'text-green-400',
      scene: 'text-yellow-400',
      effect: 'text-pink-400',
    };
    return colors[type] || 'text-gray-400';
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);

    const result = await restoreLastSession();

    if (result.success) {
      clearLastSession();
      onClose?.();
    } else {
      setError(result.error || 'Failed to restore session');
    }

    setIsRestoring(false);
  };

  const handleDismiss = () => {
    clearLastSession();
    onClose?.();
  };

  const timeSinceSaved = lastSession.savedAt
    ? Math.round((Date.now() - lastSession.savedAt) / 1000 / 60)
    : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-white">Resume Session?</h2>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Session Info */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className={`w-5 h-5 ${getTypeColor(lastSession.type)}`} />
            <span className={`text-sm font-medium ${getTypeColor(lastSession.type)}`}>
              {getTypeLabel(lastSession.type)}
            </span>
          </div>
          <h3 className="text-lg font-medium text-white mb-1">
            {lastSession.name || 'Unnamed'}
          </h3>
          {timeSinceSaved !== null && (
            <p className="text-sm text-gray-400">
              {timeSinceSaved < 1
                ? 'Just now'
                : timeSinceSaved < 60
                ? `${timeSinceSaved} minute${timeSinceSaved === 1 ? '' : 's'} ago`
                : `${Math.round(timeSinceSaved / 60)} hour${Math.round(timeSinceSaved / 60) === 1 ? '' : 's'} ago`}
            </p>
          )}
          {lastSession.universes && (
            <p className="text-xs text-gray-500 mt-2">
              Universes: {lastSession.universes.join(', ')}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors font-medium"
          >
            Start Fresh
          </button>
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex-1 px-4 py-3 bg-accent hover:bg-accent/80 text-black rounded-xl transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionRestoreModal;
